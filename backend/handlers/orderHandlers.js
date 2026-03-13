// In-memory order store (replace with database in production)
const orders = new Map();

const createOrder = async (req, res) => {
  try {
    const { 
      userId, 
      items, 
      totalAmount, 
      shippingAddress, 
      phoneNumber,
      paymentDetails 
    } = req.body;

    if (!userId || !items || !totalAmount || !shippingAddress || !phoneNumber) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, items, totalAmount, shippingAddress, phoneNumber' 
      });
    }

    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const order = {
      orderId,
      userId,
      items,
      totalAmount,
      shippingAddress,
      phoneNumber,
      paymentDetails,
      status: 'confirmed',
      orderDate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    orders.set(orderId, order);

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
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

const getOrder = (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);

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

const getUserOrders = (req, res) => {
  try {
    const { userId } = req.params;
    const userOrders = Array.from(orders.values()).filter(order => order.userId === userId);

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