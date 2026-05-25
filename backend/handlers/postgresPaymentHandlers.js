const prisma = require('../lib/prisma');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const options = {
      amount: amount * 100, // amount in paise
      currency,
      receipt: `receipt_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // If orderId is provided, update the payment record
    if (orderId) {
      // Find the order first to get the database ID
      const order = await prisma.order.findUnique({
        where: { orderId: orderId }
      });

      if (order) {
        await prisma.payment.upsert({
          where: { orderId: order.id },
          update: {
            razorpayOrderId: razorpayOrder.id,
            amount: amount,
            currency: currency,
            status: 'PENDING'
          },
          create: {
            orderId: order.id,
            razorpayOrderId: razorpayOrder.id,
            amount: amount,
            currency: currency,
            status: 'PENDING'
          }
        });
      }
    }
    
    res.json({ success: true, order: razorpayOrder });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ message: 'Error creating payment order', error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
    console.log("Payment verification received...");
    
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Update payment status in database using orderId string
      if (orderId) {
        await prisma.$transaction(async (tx) => {
          // Find the order first to get the database ID
          const order = await tx.order.findUnique({
            where: { orderId: orderId }
          });

          if (order) {
            // Update payment using the order's database ID
            await tx.payment.update({
              where: { orderId: order.id },
              data: {
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'CAPTURED',
                verifiedAt: new Date()
              }
            });

            // Update order status
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: 'CONFIRMED'
              }
            });
          }
        });
      }

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      // Update payment as failed
      if (orderId) {
        const order = await prisma.order.findUnique({
          where: { orderId: orderId }
        });

        if (order) {
          await prisma.payment.update({
            where: { orderId: order.id },
            data: {
              status: 'FAILED'
            }
          });
        }
      }
      
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find order first, then get payment
    const order = await prisma.order.findUnique({
      where: { orderId: orderId },
      include: {
        payment: true
      }
    });

    if (!order || !order.payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      success: true,
      payment: {
        ...order.payment,
        order: {
          orderId: order.orderId,
          status: order.status,
          totalAmount: order.totalAmount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Error fetching payment status', error: error.message });
  }
};

const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    // Find order first, then get payment
    const order = await prisma.order.findUnique({
      where: { orderId: orderId },
      include: {
        payment: true
      }
    });

    if (!order || !order.payment || !order.payment.razorpayPaymentId) {
      return res.status(404).json({ message: 'Payment not found or not captured' });
    }

    // Create refund with Razorpay
    const refund = await razorpay.payments.refund(order.payment.razorpayPaymentId, {
      amount: amount ? amount * 100 : undefined, // Full refund if amount not specified
      notes: {
        reason: reason || 'Customer requested refund'
      }
    });

    // Update payment status
    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status: 'REFUNDED'
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED'
      }
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Error processing refund', error: error.message });
  }
};

const getRefundStatus = async (req, res) => {
  try {
    const { refundId } = req.params;

    if (!refundId) {
      return res.status(400).json({ message: 'Refund ID is required' });
    }

    // Get refund status from Razorpay
    const refund = await razorpay.refunds.fetch(refundId);
    
    res.json({
      success: true,
      refund: {
        id: refund.id,
        status: refund.status,
        amount: refund.amount / 100, // Convert from paise to rupees
        createdAt: refund.created_at,
        processedAt: refund.processed_at
      }
    });

  } catch (error) {
    console.error('Error fetching refund status:', error);
    
    if (error.statusCode === 400) {
      return res.status(404).json({ message: 'Refund not found' });
    }
    
    res.status(500).json({ message: 'Error fetching refund status', error: error.message });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  refundPayment,
  getRefundStatus
};