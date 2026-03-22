const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPayment, getPaymentStatus, refundPayment, getRefundStatus } = require('../handlers/postgresPaymentHandlers');

// Payment routes
router.post('/create-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.get('/:orderId/status', getPaymentStatus);
router.post('/:orderId/refund', refundPayment);
router.get('/refund/:refundId/status', getRefundStatus);

module.exports = router;