const {
  getChannel
} = require("../config/rabbitmq");

const EVENT_TYPES = require(
  "../events/eventTypes"
);

const emailService = require('../services/emailService');
const publishEvent = require('../events/publisher');

async function startFinalNotificationConsumer() {

  const channel = getChannel();

  const queue =
    "final.notification.queue";

  // Create queue
  await channel.assertQueue(queue, {
    durable: true
  });

  // Bind queue to exchange
  await channel.bindQueue(
    queue,
    "ecommerce.events",
    EVENT_TYPES.INVENTORY_PURCHASED
  );

  // Start consuming
  channel.consume(
    queue,
    async (msg) => {

      try {

        if (!msg) return;
        
        const data = JSON.parse(msg.content.toString());
        const {
          userEmail, 
          orderId,
          totalAmount,
          paymentDetails,
          shippingAddress,
          items
        } = data;
        
        console.log(`📥 [FINAL_NOTIFICATION] Received INVENTORY_PURCHASED event for order: ${orderId}`);
        console.log(`📋 [FINAL_NOTIFICATION] Data received:`, JSON.stringify({ shippingAddress, totalAmount, items: items?.length }, null, 2));
        
        // Parse shippingAddress if it's a JSON string
        const parsedShippingAddress = typeof shippingAddress === 'string' 
          ? JSON.parse(shippingAddress) 
          : shippingAddress;
        
        try {
            await emailService.sendOrderConfirmation(userEmail, {
                id: orderId,
                totalAmount: totalAmount,
                paymentStatus: paymentDetails?.paymentStatus || 'PENDING',
                paymentId: paymentDetails?.razorpayPaymentId || null,
                status: 'CONFIRMED',
                items: items,
                shippingAddress: parsedShippingAddress
            });
            console.log(`✅ [FINAL_NOTIFICATION] Order confirmation email sent to ${userEmail}`);
        } catch (emailError) {
            console.error(`❌ Failed to send order confirmation email to ${userEmail}:`, emailError.message);
        }

        await publishEvent(EVENT_TYPES.ORDER_CONFIRMED, {
          userEmail, 
          orderId,
        });
        
        console.log(`📤 [FINAL_NOTIFICATION] Published ORDER_CONFIRMED event for order: ${orderId}`);
        // ACK message
        channel.ack(msg);

      } catch (err) {

        console.error(err);

        // Reject message
        channel.nack(msg);
      }
    }
  );
}

module.exports = startFinalNotificationConsumer;