const express = require('express');
const router = express.Router();
const { createOrder, getOrder, getUserOrders, updateOrderStatus } = require('../handlers/postgresOrderHandlers');
const { verifyToken } = require('../handlers/authHandlers');

// Order routes
router.post('/create', verifyToken, createOrder);
router.get('/:orderId', verifyToken, getOrder);
router.get('/user/:userEmail', verifyToken, getUserOrders);
router.patch('/:orderId/status', verifyToken, updateOrderStatus);

module.exports = router;