const express = require('express');
const router = express.Router();

// Admin middleware
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // For now, just check if token exists - you can add JWT verification here
  next();
};

// Add product (Admin only)
router.post('/products', isAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const productData = req.body;
    
    // Get the highest ID and increment
    const lastProduct = await db.collection('products').findOne({}, { sort: { id: -1 } });
    const newId = lastProduct ? lastProduct.id + 1 : 1;
    
    const newProduct = {
      id: newId,
      ...productData,
      isInCatalog: productData.isInCatalog !== false, // Default to true if not specified
      createdAt: new Date()
    };
    
    // Create product in MongoDB
    const result = await db.collection('products').insertOne(newProduct);
    
    // Create inventory entries in PostgreSQL if sizes are provided
    if (productData.sizes && Array.isArray(productData.sizes) && productData.sizes.length > 0) {
      try {
        const inventoryService = require('../services/inventoryService');
        const sizeStock = productData.sizes.map(size => ({
          size: size,
          quantity: productData.stock || 0 // Use provided stock or default to 0
        }));
        
        await inventoryService.initializeInventory(newId, sizeStock);
        console.log(`✅ Inventory initialized for product ${newId}`);
      } catch (inventoryError) {
        console.error('❌ Failed to initialize inventory:', inventoryError);
        // Don't fail the product creation, just log the error
      }
    }
    
    res.json({ success: true, productId: result.insertedId, inventoryCreated: !!productData.sizes });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Get all products for admin (including hidden ones)
router.get('/products', isAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Remove product (Admin only) - Hide from catalog instead of deleting
router.delete('/products/:id', isAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const productId = parseInt(req.params.id);
    const result = await db.collection('products').updateOne(
      { id: productId },
      { 
        $set: { 
          isInCatalog: false,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product hidden from catalog successfully' });
  } catch (error) {
    console.error('Error hiding product:', error);
    res.status(500).json({ error: 'Failed to hide product' });
  }
});

// Restore product (Admin only) - Show in catalog again
router.patch('/products/:id/restore', isAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const productId = parseInt(req.params.id);
    const result = await db.collection('products').updateOne(
      { id: productId },
      { 
        $set: { 
          isInCatalog: true,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product restored to catalog successfully' });
  } catch (error) {
    console.error('Error restoring product:', error);
    res.status(500).json({ error: 'Failed to restore product' });
  }
});

module.exports = router;