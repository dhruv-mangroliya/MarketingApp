const express = require('express');
const router = express.Router();
const { createOrder, getOrder, getUserOrders } = require('../handlers/orderHandlers');
const { verifyToken } = require('../handlers/authHandlers');

router.post('/create', verifyToken, createOrder);
router.get('/:orderId', verifyToken, getOrder);
router.get('/user/:userId', verifyToken, getUserOrders);

module.exports = router;