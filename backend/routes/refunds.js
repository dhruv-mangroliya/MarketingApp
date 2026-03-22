const express = require('express');
const router = express.Router();
const refundService = require('../services/refundService');
const emailService = require('../services/emailService');

// Get refund status by refund ID
router.get('/status/:refundId', async (req, res) => {
  try {
    const { refundId } = req.params;
    const result = await refundService.getRefundStatus(refundId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json({ message: 'Refund not found', error: result.error });
    }
  } catch (error) {
    console.error('Error fetching refund status:', error);
    res.status(500).json({ message: 'Error fetching refund status', error: error.message });
  }
});

// Get user's refunds
router.get('/user/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const result = await refundService.getUserRefunds(userEmail);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ message: 'Error fetching user refunds', error: result.error });
    }
  } catch (error) {
    console.error('Error fetching user refunds:', error);
    res.status(500).json({ message: 'Error fetching user refunds', error: error.message });
  }
});

// Send refund notification email
router.post('/send-notification', async (req, res) => {
  try {
    const { email, refund, orderId } = req.body;
    
    await emailService.sendRefundNotification(email, refund, orderId);
    
    res.json({ success: true, message: 'Refund notification sent' });
  } catch (error) {
    console.error('Error sending refund notification:', error);
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
});

module.exports = router;