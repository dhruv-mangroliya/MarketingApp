const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../handlers/paymentHandlers');

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;