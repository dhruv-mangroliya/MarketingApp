const prisma = require('../lib/prisma');
const inventoryService = require('../services/inventoryService');
const refundService = require('../services/refundService');
const publishEvent = require('../events/publisher');
const EVENT_TYPES = require('../events/eventTypes');

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
    if (!userEmail || !items || !totalAmount || !shippingAddress) {
      return res.status(400).json({ 
        message: 'Missing required fields: userEmail, items, totalAmount, shippingAddress' 
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

    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('📋 [ORDER_HANDLER] Received order data:', JSON.stringify({ shippingAddress, phoneNumber }, null, 2));

    //create order here and create a event object.
    await publishEvent(
      EVENT_TYPES.ORDER_RECEIVED,
      {
        userEmail, 
        items, 
        totalAmount, 
        shippingAddress, 
        phoneNumber,
        paymentDetails,
        orderId
      }
    );

    return res.status(201).json({ 
      message: 'Order created successfully', 
      orderId
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        orderItems: true,
        payment: true
      }
    });

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
    
    const userOrders = await prisma.order.findMany({
      where: { userEmail },
      include: {
        orderItems: true,
        payment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      orders: userOrders
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { orderId },
      data: { status },
      include: {
        orderItems: true,
        payment: true
      }
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrder,
  getUserOrders,
  updateOrderStatus
};