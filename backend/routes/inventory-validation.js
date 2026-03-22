const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');

// Check inventory availability before payment
router.post('/check-availability', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Items array is required' 
      });
    }

    const shortages = [];
    let allAvailable = true;

    // Check each item's availability
    for (const item of items) {
      const availableStock = await inventoryService.getAvailableStock(
        item.productId, 
        item.size
      );

      if (availableStock < item.quantity) {
        allAvailable = false;
        shortages.push({
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          requested: item.quantity,
          available: availableStock
        });
      }
    }

    res.json({
      success: true,
      available: allAvailable,
      shortages: shortages
    });

  } catch (error) {
    console.error('Error checking inventory availability:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error checking inventory availability', 
      error: error.message 
    });
  }
});

module.exports = router;