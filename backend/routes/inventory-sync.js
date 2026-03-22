const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const inventoryService = require('../services/inventoryService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'kurtibazaar';

// Admin middleware
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  next();
};

// Sync MongoDB products with PostgreSQL inventory
router.post('/sync-inventory', isAdmin, async (req, res) => {
  let mongoClient;
  
  try {
    // Connect to MongoDB
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    
    // Get all products from MongoDB
    const products = await db.collection('products').find({}).toArray();
    
    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: []
    };
    
    for (const product of products) {
      try {
        results.processed++;
        
        // Skip if no sizes
        if (!product.sizes || !Array.isArray(product.sizes) || product.sizes.length === 0) {
          results.skipped++;
          continue;
        }
        
        // Create size stock array
        const sizeStock = product.sizes.map(size => ({
          size: size,
          quantity: product.stock || 0
        }));
        
        // Initialize inventory (will skip duplicates)
        await inventoryService.initializeInventory(product.id, sizeStock);
        results.created++;
        
        console.log(`✅ Inventory synced for product ${product.id}: ${product.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to sync product ${product.id}:`, error.message);
        results.errors.push({
          productId: product.id,
          productName: product.name,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Inventory sync completed',
      results
    });
    
  } catch (error) {
    console.error('Error syncing inventory:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync inventory', 
      details: error.message 
    });
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
});

// Get products without inventory
router.get('/missing-inventory', isAdmin, async (req, res) => {
  let mongoClient;
  
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    
    const products = await db.collection('products').find({}).toArray();
    const prisma = require('../lib/prisma');
    
    const missingInventory = [];
    
    for (const product of products) {
      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        // Check if inventory exists
        const inventoryCount = await prisma.inventoryItem.count({
          where: { productId: product.id }
        });
        
        if (inventoryCount === 0) {
          missingInventory.push({
            id: product.id,
            name: product.name,
            sizes: product.sizes,
            stock: product.stock || 0
          });
        }
      }
    }
    
    res.json({
      success: true,
      count: missingInventory.length,
      products: missingInventory
    });
    
  } catch (error) {
    console.error('Error checking missing inventory:', error);
    res.status(500).json({ error: 'Failed to check missing inventory' });
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
});

module.exports = router;