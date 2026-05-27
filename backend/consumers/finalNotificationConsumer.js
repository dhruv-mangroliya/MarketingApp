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

  const deadLetterQueue = "final.notification.dead.queue";
  await channel.assertExchange(
    "dead.events",
    "direct",
    {
      durable: true
    }
  );

  await channel.assertQueue(
    deadLetterQueue,
    {
      durable: true
    }
  );

  await channel.bindQueue(
    deadLetterQueue,
    "dead.events",
    EVENT_TYPES.NOTIFICATION_FAILED
  );

  const queue =
    "final.notification.queue";

  // Create queue
  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: "dead.events",
    deadLetterRoutingKey: EVENT_TYPES.NOTIFICATION_FAILED
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
        
        console.log(`[RECEIVED] [FINAL_NOTIFICATION] Received INVENTORY_PURCHASED event for order: ${orderId}`);
        console.log(`[INFO] [FINAL_NOTIFICATION] Data received:`, JSON.stringify({ shippingAddress, totalAmount, items: items?.length }, null, 2));
        
        // Parse shippingAddress if it's a JSON string
        const parsedShippingAddress = typeof shippingAddress === 'string' 
          ? JSON.parse(shippingAddress) 
          : shippingAddress;
        
        let emailSent = false;
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
          console.log(`[SUCCESS] [FINAL_NOTIFICATION] Order confirmation email sent to ${userEmail}`);
          emailSent = true;
        } catch (emailError) {
          console.error(`[ERROR] [FINAL_NOTIFICATION] Failed to send email:`, emailError.message);
        }
        
        try {
          // Always publish ORDER_CONFIRMED regardless of email status
          await publishEvent(EVENT_TYPES.ORDER_CONFIRMED, {
            userEmail, 
            orderId,
          });
          console.log(`[PUBLISHED] [FINAL_NOTIFICATION] Published ORDER_CONFIRMED event for order: ${orderId}`);
        } catch (publishError) {
          console.error(`[ERROR] [FINAL_NOTIFICATION] Failed to publish ORDER_CONFIRMED:`, publishError.message);
        }
        
        // If email failed, send to DLQ
        if (!emailSent) {
          console.log(`[PUBLISHED] [FINAL_NOTIFICATION] Sending failed notification to DLQ for order: ${orderId}`);
          channel.nack(msg, false, false);
          return;
        }
        
        // ACK message only if email succeeded
        channel.ack(msg);

      } catch (err) {
        console.error(`[ERROR] [FINAL_NOTIFICATION] Error processing order:`, err.message);
        // Reject message and send to dead letter queue
        channel.nack(msg, false, false);
      }
    }
  );
}

module.exports = startFinalNotificationConsumer;
