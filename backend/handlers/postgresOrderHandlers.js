const prisma = require('../lib/prisma');
const inventoryService = require('../services/inventoryService');
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

    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Step 1: Reserve inventory for all items
    const reservationResults = [];
    for (const item of items) {
      const result = await inventoryService.purchaseProduct(
        item.productId, 
        item.size, 
        item.quantity
      );
      
      if (!result.success) {
        // Release any previously reserved stock
        for (const prevItem of reservationResults) {
          await inventoryService.releaseReservedStock(
            prevItem.productId, 
            prevItem.size, 
            prevItem.quantity
          );
        }
        
        // Send stock shortage notification email
        try {
          const emailService = require('../services/emailService');
          await emailService.sendStockShortageNotification(userEmail, {
            productName: item.productName,
            size: item.size,
            requested: item.quantity,
            available: result.message.match(/Available: (\d+)/)?.[1] || 0,
            items: items
          });
          console.log(`📧 Stock shortage email sent to ${userEmail}`);
        } catch (emailError) {
          console.error('Failed to send stock shortage email:', emailError);
        }
        
        // If payment was already processed, initiate refund
        if (paymentDetails && paymentDetails.razorpayPaymentId) {
          const refundResult = await refundService.handleOrderFailureRefund(
            paymentDetails.razorpayPaymentId,
            orderId,
            userEmail
          );
          
          if (refundResult.success) {
            // Send email notification with refund details
            try {
              const emailService = require('../services/emailService');
              await emailService.sendRefundNotification(userEmail, refundResult.refund, orderId);
              console.log(`✅ Refund email sent to ${userEmail}`);
            } catch (emailError) {
              console.error('Failed to send refund email:', emailError);
            }
            
            return res.status(400).json({ 
              message: `Stock shortage detected. Payment has been automatically refunded.`,
              refund: {
                id: refundResult.refund.id,
                amount: refundResult.refund.amount,
                status: refundResult.refund.status,
                estimatedProcessingTime: '5-7 business days'
              },
              stockShortage: true,
              productName: item.productName,
              size: item.size,
              requested: item.quantity,
              available: result.message.match(/Available: (\d+)/)?.[1] || 0
            });
          } else {
            return res.status(500).json({ 
              message: 'Stock shortage detected and automatic refund failed. Please contact support immediately.',
              paymentId: paymentDetails.razorpayPaymentId,
              stockShortage: true,
              productName: item.productName,
              size: item.size,
              requested: item.quantity,
              available: result.message.match(/Available: (\d+)/)?.[1] || 0,
              refundError: refundResult.error
            });
          }
        }
        
        return res.status(400).json({ 
          message: `Failed to reserve stock for ${item.productName} (${item.size}): ${result.message}`,
          stockShortage: true,
          productName: item.productName,
          size: item.size,
          requested: item.quantity,
          available: result.message.match(/Available: (\d+)/)?.[1] || 0
        });
      }
      
      reservationResults.push(item);
    }

    try {
      // Step 2: Create order and payment in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            orderId,
            userEmail,
            totalAmount,
            status: 'CONFIRMED',
            shippingAddress,
            phoneNumber,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            orderItems: {
              create: items.map(item => ({
                productId: parseInt(item.productId),
                productName: item.productName,
                quantity: item.quantity,
                size: item.size,
                price: item.price,
                image: item.image
              }))
            }
          },
          include: {
            orderItems: true
          }
        });

        // Create payment record
        if (paymentDetails) {
          await tx.payment.create({
            data: {
              orderId: order.id,
              razorpayOrderId: paymentDetails.razorpayOrderId,
              razorpayPaymentId: paymentDetails.razorpayPaymentId,
              razorpaySignature: paymentDetails.razorpaySignature,
              amount: totalAmount,
              status: paymentDetails.paymentStatus === 'captured' ? 'CAPTURED' : 'PENDING',
              paymentMethod: paymentDetails.paymentMethod
            }
          });
        }

        return order;
      });

      // Step 3: Confirm inventory purchases (with safety checks)
      for (const item of items) {
        try {
          await inventoryService.confirmPurchase(
            item.productId, 
            item.size, 
            item.quantity
          );
        } catch (confirmError) {
          console.error(`Failed to confirm purchase for ${item.productName}:`, confirmError.message);
          
          // Release all reserved stock for this order
          for (const releaseItem of items) {
            await inventoryService.releaseReservedStock(
              releaseItem.productId, 
              releaseItem.size, 
              releaseItem.quantity
            );
          }
          
          // Initiate automatic refund since payment was already processed
          if (paymentDetails && paymentDetails.razorpayPaymentId) {
            const refundResult = await refundService.handleOrderFailureRefund(
              paymentDetails.razorpayPaymentId,
              orderId,
              userEmail
            );
            
            if (refundResult.success) {
              // Send email notification with refund details
              try {
                const emailService = require('../services/emailService');
                await emailService.sendRefundNotification(userEmail, refundResult.refund, orderId);
                console.log(`✅ Refund email sent to ${userEmail}`);
              } catch (emailError) {
                console.error('Failed to send refund email:', emailError);
              }
              
              return res.status(400).json({ 
                message: `Order failed due to inventory issue. Payment has been automatically refunded.`,
                refund: {
                  id: refundResult.refund.id,
                  amount: refundResult.refund.amount,
                  status: refundResult.refund.status,
                  estimatedProcessingTime: '5-7 business days'
                },
                orderId: orderId,
                error: confirmError.message
              });
            } else {
              return res.status(500).json({ 
                message: 'Order failed and automatic refund failed. Please contact support immediately.',
                paymentId: paymentDetails.razorpayPaymentId,
                orderId: orderId,
                error: confirmError.message,
                refundError: refundResult.error
              });
            }
          }
          
          throw confirmError;
        }
      }

      // Step 4: Send order confirmation email
      try {
        const emailService = require('../services/emailService');
        await emailService.sendOrderConfirmation(userEmail, {
          id: result.orderId,
          totalAmount: result.totalAmount,
          paymentStatus: paymentDetails?.paymentStatus || 'PENDING',
          status: result.status,
          items: result.orderItems,
          shippingAddress: shippingAddress
        });
        console.log(`✅ Order confirmation email sent to ${userEmail}`);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the order if email fails
      }

      res.json({
        success: true,
        message: 'Order created successfully',
        order: {
          orderId: result.orderId,
          status: result.status,
          totalAmount: result.totalAmount,
          orderDate: result.orderDate,
          estimatedDelivery: result.estimatedDelivery,
          items: result.orderItems
        }
      });

    } catch (transactionError) {
      console.error('Order creation failed:', transactionError);
      
      // Release reserved stock if transaction fails
      for (const item of items) {
        try {
          await inventoryService.releaseReservedStock(
            item.productId, 
            item.size, 
            item.quantity
          );
        } catch (releaseError) {
          console.error(`Failed to release stock for ${item.productName}:`, releaseError);
        }
      }
      
      // If payment was already processed, initiate refund
      if (paymentDetails && paymentDetails.razorpayPaymentId) {
        const refundResult = await refundService.handleOrderFailureRefund(
          paymentDetails.razorpayPaymentId,
          orderId,
          userEmail
        );
        
        if (refundResult.success) {
          // Send email notification with refund details
          try {
            const emailService = require('../services/emailService');
            await emailService.sendRefundNotification(userEmail, refundResult.refund, orderId);
            console.log(`✅ Refund email sent to ${userEmail}`);
          } catch (emailError) {
            console.error('Failed to send refund email:', emailError);
          }
          
          return res.status(500).json({ 
            message: 'Order creation failed. Payment has been automatically refunded.',
            refund: {
              id: refundResult.refund.id,
              amount: refundResult.refund.amount,
              status: refundResult.refund.status,
              estimatedProcessingTime: '5-7 business days'
            },
            orderId: orderId,
            error: transactionError.message 
          });
        } else {
          return res.status(500).json({ 
            message: 'Order creation failed and automatic refund failed. Please contact support immediately.',
            paymentId: paymentDetails.razorpayPaymentId,
            orderId: orderId,
            error: transactionError.message,
            refundError: refundResult.error
          });
        }
      }
      
      throw transactionError;
    }

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