const prisma = require('../lib/prisma');
const inventoryService = require('../services/inventoryService');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'kurtibazaar';

// Get all products with their inventory status
const getAllProductsWithInventory = async (req, res) => {
  let mongoClient;
  
  try {
    // Connect to MongoDB to get products
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    
    // Get all products from MongoDB
    const products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();
    
    // Get inventory data for all products
    const productsWithInventory = [];
    
    for (const product of products) {
      let inventoryStatus = 'No Inventory';
      let totalStock = 0;
      let totalReserved = 0;
      let sizeBreakdown = [];
      
      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        // Get inventory from PostgreSQL
        const inventory = await prisma.inventoryItem.findMany({
          where: { productId: product.id },
          select: {
            size: true,
            stockQuantity: true,
            reservedQuantity: true
          }
        });
        
        if (inventory.length > 0) {
          inventoryStatus = 'Has Inventory';
          totalStock = inventory.reduce((sum, item) => sum + item.stockQuantity, 0);
          totalReserved = inventory.reduce((sum, item) => sum + item.reservedQuantity, 0);
          
          sizeBreakdown = inventory.map(item => ({
            size: item.size,
            stock: item.stockQuantity,
            reserved: item.reservedQuantity,
            available: item.stockQuantity - item.reservedQuantity
          }));
        } else {
          inventoryStatus = 'Missing Inventory';
        }
      }
      
      productsWithInventory.push({
        id: product.id,
        name: product.name,
        image: product.image,
        sizes: product.sizes || [],
        isInCatalog: product.isInCatalog,
        createdAt: product.createdAt,
        inventory: {
          status: inventoryStatus,
          totalStock,
          totalReserved,
          totalAvailable: totalStock - totalReserved,
          sizeBreakdown
        }
      });
    }
    
    res.json({
      success: true,
      products: productsWithInventory,
      summary: {
        total: productsWithInventory.length,
        withInventory: productsWithInventory.filter(p => p.inventory.status === 'Has Inventory').length,
        missingInventory: productsWithInventory.filter(p => p.inventory.status === 'Missing Inventory').length,
        noSizes: productsWithInventory.filter(p => p.inventory.status === 'No Inventory').length
      }
    });
    
  } catch (error) {
    console.error('Error fetching products with inventory:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching products with inventory', 
      error: error.message 
    });
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
};

const getProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size } = req.query;

    if (size) {
      // Get stock for specific size
      const stock = await inventoryService.getAvailableStock(parseInt(productId), size);
      res.json({
        success: true,
        productId: parseInt(productId),
        size,
        availableStock: stock
      });
    } else {
      // Get stock for all sizes
      const inventory = await prisma.inventoryItem.findMany({
        where: { productId: parseInt(productId) },
        select: {
          size: true,
          stockQuantity: true,
          reservedQuantity: true
        }
      });

      const stockBySizes = inventory.map(item => ({
        size: item.size,
        totalStock: item.stockQuantity,
        reservedStock: item.reservedQuantity,
        availableStock: item.stockQuantity - item.reservedQuantity
      }));

      res.json({
        success: true,
        productId: parseInt(productId),
        inventory: stockBySizes
      });
    }

  } catch (error) {
    console.error('Error fetching product stock:', error);
    res.status(500).json({ message: 'Error fetching product stock', error: error.message });
  }
};

const updateProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, quantity, operation = 'set' } = req.body;

    if (!size || quantity === undefined) {
      return res.status(400).json({ message: 'Size and quantity are required' });
    }

    let updateData = {};
    
    switch (operation) {
      case 'add':
        updateData = {
          stockQuantity: { increment: quantity },
          version: { increment: 1 }
        };
        break;
      case 'subtract':
        updateData = {
          stockQuantity: { decrement: quantity },
          version: { increment: 1 }
        };
        break;
      case 'set':
      default:
        updateData = {
          stockQuantity: quantity,
          version: { increment: 1 }
        };
        break;
    }

    const updatedInventory = await prisma.inventoryItem.update({
      where: {
        productId_size: {
          productId: parseInt(productId),
          size: size
        }
      },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      inventory: updatedInventory
    });

  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ message: 'Error updating product stock', error: error.message });
  }
};

const initializeProductInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sizeStock } = req.body;

    if (!Array.isArray(sizeStock) || sizeStock.length === 0) {
      return res.status(400).json({ message: 'sizeStock array is required' });
    }

    await inventoryService.initializeInventory(parseInt(productId), sizeStock);

    res.json({
      success: true,
      message: 'Inventory initialized successfully',
      productId: parseInt(productId),
      sizeStock
    });

  } catch (error) {
    console.error('Error initializing inventory:', error);
    res.status(500).json({ message: 'Error initializing inventory', error: error.message });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 5 } = req.query;

    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        stockQuantity: {
          lte: parseInt(threshold)
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        stockQuantity: 'asc'
      }
    });

    res.json({
      success: true,
      lowStockItems: lowStockItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.image,
        size: item.size,
        currentStock: item.stockQuantity,
        reservedStock: item.reservedQuantity,
        availableStock: item.stockQuantity - item.reservedQuantity
      }))
    });

  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Error fetching low stock products', error: error.message });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get total products
    const totalProducts = await prisma.product.count({
      where: { isActive: true }
    });

    // Get total inventory items
    const totalInventoryItems = await prisma.inventoryItem.count();

    // Get total stock value (approximate)
    const inventoryValue = await prisma.inventoryItem.aggregate({
      _sum: {
        stockQuantity: true,
        reservedQuantity: true
      }
    });

    // Get low stock count
    const lowStockCount = await prisma.inventoryItem.count({
      where: {
        stockQuantity: {
          lte: 5
        }
      }
    });

    // Get out of stock count
    const outOfStockCount = await prisma.inventoryItem.count({
      where: {
        stockQuantity: 0
      }
    });

    res.json({
      success: true,
      report: {
        totalProducts,
        totalInventoryItems,
        totalStock: inventoryValue._sum.stockQuantity || 0,
        totalReservedStock: inventoryValue._sum.reservedQuantity || 0,
        lowStockCount,
        outOfStockCount,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ message: 'Error generating inventory report', error: error.message });
  }
};

module.exports = {
  getProductStock,
  updateProductStock,
  initializeProductInventory,
  getLowStockProducts,
  getInventoryReport,
  getAllProductsWithInventory
};