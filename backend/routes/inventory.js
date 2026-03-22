const express = require('express');
const router = express.Router();
const { 
  getProductStock, 
  updateProductStock, 
  initializeProductInventory, 
  getLowStockProducts, 
  getInventoryReport,
  getAllProductsWithInventory 
} = require('../handlers/inventoryHandlers');
const { verifyToken } = require('../handlers/authHandlers');

// Public routes
router.get('/product/:productId/stock', getProductStock);
router.get('/products', getAllProductsWithInventory); // New route for all products with inventory

// Admin routes (require authentication)
router.post('/product/:productId/initialize', verifyToken, initializeProductInventory);
router.patch('/product/:productId/stock', verifyToken, updateProductStock);
router.get('/low-stock', verifyToken, getLowStockProducts);
router.get('/report', verifyToken, getInventoryReport);

module.exports = router;