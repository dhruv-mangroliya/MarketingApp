const prisma = require('../lib/prisma');

class InventoryService {
  /**
   * Purchase product with optimistic locking to prevent race conditions
   * @param {number} productId - Product ID
   * @param {string} size - Product size
   * @param {number} quantity - Quantity to purchase
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async purchaseProduct(productId, size, quantity) {
    // Validate input parameters
    if (!productId || !size || quantity <= 0) {
      return { success: false, message: 'Invalid parameters: productId, size, and positive quantity are required' };
    }

    const MAX_RETRIES = 5;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Get current inventory with version
        const inventory = await prisma.inventoryItem.findUnique({
          where: {
            productId_size: {
              productId: parseInt(productId),
              size: size
            }
          }
        });

        if (!inventory) {
          throw new Error(`Product size ${size} not found`);
        }

        // Check stock availability
        const availableStock = inventory.stockQuantity - inventory.reservedQuantity;
        if (availableStock < quantity) {
          throw new Error(`Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`);
        }

        // Attempt optimistic update
        const updated = await prisma.inventoryItem.updateMany({
          where: {
            productId: parseInt(productId),
            size: size,
            version: inventory.version // Optimistic locking condition
          },
          data: {
            reservedQuantity: inventory.reservedQuantity + quantity,
            version: inventory.version + 1
          }
        });

        // If update succeeded, we got the stock
        if (updated.count === 1) {
          console.log(`[SUCCESS] Stock reserved: Product ${productId}, Size ${size}, Qty ${quantity}`);
          return { success: true };
        }

        // Version conflict - retry
        console.log(`[RETRY] Retry ${attempt}/${MAX_RETRIES}: Version conflict for product ${productId}`);

      } catch (error) {
        if (error.message.includes('Insufficient stock') || error.message.includes('not found')) {
          // Don't retry for business logic errors
          return { success: false, message: error.message };
        }

        if (attempt === MAX_RETRIES) {
          console.error(`[ERROR] Failed after ${MAX_RETRIES} retries:`, error.message);
          return { success: false, message: 'Failed to reserve stock after multiple attempts' };
        }
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 50 * attempt));
    }

    return { success: false, message: 'Failed to reserve stock' };
  }

  /**
   * Confirm purchase - convert reserved stock to sold
   * @param {number} productId - Product ID
   * @param {string} size - Product size
   * @param {number} quantity - Quantity to confirm
   */
  async confirmPurchase(productId, size, quantity) {
    try {
      // Get current inventory to check if we can safely decrement
      const inventory = await prisma.inventoryItem.findUnique({
        where: {
          productId_size: {
            productId: parseInt(productId),
            size: size
          }
        }
      });

      if (!inventory) {
        throw new Error(`Inventory not found for product ${productId}, size ${size}`);
      }

      // Prevent negative stock - this should never happen if reservation worked correctly
      if (inventory.stockQuantity < quantity) {
        throw new Error(`Cannot confirm purchase: insufficient stock. Available: ${inventory.stockQuantity}, Requested: ${quantity}`);
      }

      // Prevent negative reserved stock
      if (inventory.reservedQuantity < quantity) {
        throw new Error(`Cannot confirm purchase: insufficient reserved stock. Reserved: ${inventory.reservedQuantity}, Requested: ${quantity}`);
      }

      const result = await prisma.inventoryItem.updateMany({
        where: {
          productId: parseInt(productId),
          size: size,
          stockQuantity: { gte: quantity }, // Additional safety check
          reservedQuantity: { gte: quantity } // Additional safety check
        },
        data: {
          stockQuantity: {
            decrement: quantity
          },
          reservedQuantity: {
            decrement: quantity
          },
          version: {
            increment: 1
          }
        }
      });

      if (result.count === 0) {
        throw new Error(`Failed to confirm purchase: stock validation failed for product ${productId}, size ${size}`);
      }

      console.log(`[SUCCESS] Purchase confirmed: Product ${productId}, Size ${size}, Qty ${quantity}`);
    } catch (error) {
      console.error('Error confirming purchase:', error);
      throw error;
    }
  }

  /**
   * Release reserved stock (in case of payment failure)
   * @param {number} productId - Product ID
   * @param {string} size - Product size
   * @param {number} quantity - Quantity to release
   */
  async releaseReservedStock(productId, size, quantity) {
    try {
      // Get current inventory to prevent negative reserved stock
      const inventory = await prisma.inventoryItem.findUnique({
        where: {
          productId_size: {
            productId: parseInt(productId),
            size: size
          }
        }
      });

      if (!inventory) {
        console.warn(`[WARNING] Inventory not found for product ${productId}, size ${size} - cannot release stock`);
        return;
      }

      // Prevent negative reserved stock
      const releaseQuantity = Math.min(quantity, inventory.reservedQuantity);
      
      if (releaseQuantity <= 0) {
        console.warn(`[WARNING] No reserved stock to release for product ${productId}, size ${size}`);
        return;
      }

      await prisma.inventoryItem.updateMany({
        where: {
          productId: parseInt(productId),
          size: size,
          reservedQuantity: { gte: releaseQuantity } // Safety check
        },
        data: {
          reservedQuantity: {
            decrement: releaseQuantity
          },
          version: {
            increment: 1
          }
        }
      });

      console.log(`[RETRY] Stock released: Product ${productId}, Size ${size}, Qty ${releaseQuantity}`);
    } catch (error) {
      console.error('Error releasing stock:', error);
      throw error;
    }
  }

  /**
   * Get available stock for a product size
   * @param {number} productId - Product ID
   * @param {string} size - Product size
   * @returns {Promise<number>} Available stock
   */
  async getAvailableStock(productId, size) {
    try {
      const inventory = await prisma.inventoryItem.findUnique({
        where: {
          productId_size: {
            productId: parseInt(productId),
            size: size
          }
        }
      });

      if (!inventory) return 0;
      return inventory.stockQuantity - inventory.reservedQuantity;
    } catch (error) {
      console.error('Error getting stock:', error);
      return 0;
    }
  }

  /**
   * Initialize inventory for a product
   * @param {number} productId - Product ID
   * @param {Array} sizeStock - Array of {size, quantity}
   */
  async initializeInventory(productId, sizeStock) {
    try {
      const inventoryData = sizeStock.map(item => {
        // Ensure non-negative stock quantities
        const quantity = Math.max(0, parseInt(item.quantity) || 0);
        
        return {
          productId: parseInt(productId),
          size: item.size,
          stockQuantity: quantity,
          reservedQuantity: 0,
          version: 0
        };
      });

      await prisma.inventoryItem.createMany({
        data: inventoryData,
        skipDuplicates: true
      });

      console.log(`[SUCCESS] Inventory initialized for product ${productId}`);
    } catch (error) {
      console.error('Error initializing inventory:', error);
      throw error;
    }
  }

  /**
   * Validate inventory integrity - ensure no negative values
   * @param {number} productId - Product ID (optional)
   */
  async validateInventoryIntegrity(productId = null) {
    try {
      const where = productId ? { productId: parseInt(productId) } : {};
      
      // Find any inventory items with negative values
      const invalidItems = await prisma.inventoryItem.findMany({
        where: {
          ...where,
          OR: [
            { stockQuantity: { lt: 0 } },
            { reservedQuantity: { lt: 0 } }
          ]
        }
      });

      if (invalidItems.length > 0) {
        console.error('[ERROR] Invalid inventory items found:', invalidItems);
        
        // Fix negative values
        for (const item of invalidItems) {
          await prisma.inventoryItem.update({
            where: {
              productId_size: {
                productId: item.productId,
                size: item.size
              }
            },
            data: {
              stockQuantity: Math.max(0, item.stockQuantity),
              reservedQuantity: Math.max(0, item.reservedQuantity),
              version: { increment: 1 }
            }
          });
        }
        
        console.log('[SUCCESS] Fixed negative inventory values');
      }

      return { valid: invalidItems.length === 0, fixedItems: invalidItems.length };
    } catch (error) {
      console.error('Error validating inventory:', error);
      throw error;
    }
  }
}

module.exports = new InventoryService();

// Auto-validate inventory integrity on startup
setTimeout(async () => {
  try {
    const inventoryService = module.exports;
    const result = await inventoryService.validateInventoryIntegrity();
    if (result.fixedItems > 0) {
      console.log(`[FIX] Fixed ${result.fixedItems} inventory items with negative values`);
    }
  } catch (error) {
    console.error('Failed to validate inventory on startup:', error);
  }
}, 5000); // Run after 5 seconds to ensure DB is connected