const Razorpay = require('razorpay');
const prisma = require('../lib/prisma');
const emailService = require('./emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class RefundService {
  /**
   * Initiate automatic refund for failed orders with database tracking
   * @param {string} paymentId - Razorpay payment ID
   * @param {string} orderId - Order ID
   * @param {string} userEmail - User email
   * @param {string} reason - Reason for refund
   * @param {number} amount - Amount to refund (optional, full refund if not specified)
   * @returns {Promise<{success: boolean, refund?: object, error?: string}>}
   */
  async initiateRefund(paymentId, orderId, userEmail, reason, amount = null) {
    try {
      console.log(`🔄 Initiating refund for payment: ${paymentId}`);
      
      // Get order and payment details
      const order = await prisma.order.findUnique({
        where: { orderId },
        include: { payment: true }
      });

      if (!order || !order.payment) {
        throw new Error('Order or payment not found');
      }

      const refundData = {
        notes: {
          reason,
          orderId,
          userEmail,
          timestamp: new Date().toISOString()
        }
      };

      // Add amount if specified (in paise)
      if (amount) {
        refundData.amount = amount * 100;
      }

      // Create refund with Razorpay
      const razorpayRefund = await razorpay.payments.refund(paymentId, refundData);
      
      // Store refund in database
      const refund = await prisma.refund.create({
        data: {
          orderId: order.id,
          paymentId: order.payment.id,
          razorpayRefundId: razorpayRefund.id,
          amount: razorpayRefund.amount / 100,
          reason,
          status: 'PENDING',
          userEmail
        }
      });

      // Update order and payment status
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'REFUNDED' }
        });

        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: 'REFUNDED' }
        });
      });

      // Send email notification
      await emailService.sendRefundNotification(userEmail, {
        id: refund.razorpayRefundId,
        amount: refund.amount,
        status: refund.status
      }, orderId);
      
      console.log(`✅ Refund initiated successfully: ${razorpayRefund.id}`);
      
      return {
        success: true,
        refund: {
          id: refund.razorpayRefundId,
          status: refund.status,
          amount: refund.amount,
          createdAt: refund.createdAt
        }
      };

    } catch (error) {
      console.error(`❌ Refund failed for payment ${paymentId}:`, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check and update refund status from Razorpay
   * @param {string} refundId - Razorpay refund ID
   * @returns {Promise<{success: boolean, refund?: object, error?: string}>}
   */
  async getRefundStatus(refundId) {
    try {
      // Get refund from Razorpay
      const razorpayRefund = await razorpay.refunds.fetch(refundId);
      
      // Update local database
      const refund = await prisma.refund.update({
        where: { razorpayRefundId: refundId },
        data: {
          status: this.mapRazorpayStatus(razorpayRefund.status),
          processedAt: razorpayRefund.processed_at ? new Date(razorpayRefund.processed_at * 1000) : null
        }
      });
      
      return {
        success: true,
        refund: {
          id: refund.razorpayRefundId,
          status: refund.status,
          amount: refund.amount,
          createdAt: refund.createdAt,
          processedAt: refund.processedAt
        }
      };

    } catch (error) {
      console.error(`❌ Failed to fetch refund status for ${refundId}:`, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's refunds
   * @param {string} userEmail - User email
   * @returns {Promise<{success: boolean, refunds?: array, error?: string}>}
   */
  async getUserRefunds(userEmail) {
    try {
      const refunds = await prisma.refund.findMany({
        where: { userEmail },
        include: {
          order: {
            select: {
              orderId: true,
              totalAmount: true,
              orderDate: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        refunds: refunds.map(refund => ({
          id: refund.razorpayRefundId,
          orderId: refund.order.orderId,
          amount: refund.amount,
          reason: refund.reason,
          status: refund.status,
          createdAt: refund.createdAt,
          processedAt: refund.processedAt,
          orderDate: refund.order.orderDate,
          orderAmount: refund.order.totalAmount
        }))
      };

    } catch (error) {
      console.error(`❌ Failed to fetch user refunds for ${userEmail}:`, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle order failure refund with proper logging
   * @param {string} paymentId - Razorpay payment ID
   * @param {string} orderId - Order ID for reference
   * @param {string} userEmail - User email for reference
   * @returns {Promise<{success: boolean, refund?: object, error?: string}>}
   */
  async handleOrderFailureRefund(paymentId, orderId, userEmail) {
    return await this.initiateRefund(
      paymentId,
      orderId,
      userEmail,
      'Order creation failed due to inventory shortage - automatic refund'
    );
  }

  /**
   * Map Razorpay refund status to our enum
   * @param {string} razorpayStatus - Razorpay status
   * @returns {string} Our refund status
   */
  mapRazorpayStatus(razorpayStatus) {
    const statusMap = {
      'pending': 'PENDING',
      'processed': 'COMPLETED',
      'failed': 'FAILED'
    };
    
    return statusMap[razorpayStatus] || 'PENDING';
  }
}

module.exports = new RefundService();