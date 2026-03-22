const Order = require('../models/Order');
const refundService = require('../services/refundService');

const createOrder = async (req, res) => {
  try {
    const { 
      userEmail, 
      items, 
      totalAmount, 
      shippingAddress, 
      phoneNumber,
      paymentDetails 
    } = req.body;

    // Validate required fields
    if (!userEmail || !items || !totalAmount || !shippingAddress || !phoneNumber) {
      return res.status(400).json({ 
        message: 'Missing required fields: userEmail, items, totalAmount, shippingAddress, phoneNumber' 
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Items array is required and must not be empty' 
      });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId || !item.productName || !item.quantity || !item.size || !item.price) {
        return res.status(400).json({ 
          message: `Item ${i + 1} is missing required fields: productId, productName, quantity, size, price` 
        });
      }
      
      // Validate quantity is positive
      if (item.quantity <= 0) {
        return res.status(400).json({ 
          message: `Item ${i + 1} (${item.productName}) must have quantity greater than 0` 
        });
      }
      
      // Validate price is positive
      if (item.price <= 0) {
        return res.status(400).json({ 
          message: `Item ${i + 1} (${item.productName}) must have price greater than 0` 
        });
      }
    }

    // Validate shipping address
    const requiredAddressFields = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    for (const field of requiredAddressFields) {
      if (!shippingAddress[field]) {
        return res.status(400).json({ 
          message: `Shipping address is missing required field: ${field}` 
        });
      }
    }

    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const order = new Order({
      orderId,
      userEmail,
      items,
      totalAmount,
      shippingAddress,
      phoneNumber,
      paymentDetails,
      status: 'confirmed',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order created successfully',
      order: {
        orderId: order.orderId,
        status: order.status,
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        estimatedDelivery: order.estimatedDelivery,
        items: order.items
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    
    // If payment was already processed, initiate refund
    if (paymentDetails && paymentDetails.razorpayPaymentId) {
      const refundResult = await refundService.handleOrderFailureRefund(
        paymentDetails.razorpayPaymentId,
        'UNKNOWN_ORDER', // Order wasn't created yet
        userEmail
      );
      
      if (refundResult.success) {
        return res.status(500).json({ 
          message: 'Order creation failed. Payment has been automatically refunded.',
          refund: refundResult.refund,
          error: error.message 
        });
      } else {
        return res.status(500).json({ 
          message: 'Order creation failed and automatic refund failed. Please contact support immediately.',
          paymentId: paymentDetails.razorpayPaymentId,
          error: error.message,
          refundError: refundResult.error
        });
      }
    }
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const userOrders = await Order.find({ userEmail }).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders: userOrders
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrder,
  getUserOrders
};