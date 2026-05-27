const {
  getChannel
} = require("../config/rabbitmq");

const EVENT_TYPES = require(
  "../events/eventTypes"
);

const refundService = require('../services/refundService');
const publishEvent = require('../events/publisher');

async function startRefundConsumer() {

  const channel = getChannel();

  // Setup Dead Letter Queue
  const deadLetterQueue = "refund.create.dead.queue";
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
    "refund.create.failed"
  );

  const queue = "refund.create.queue";

  // Create queue with DLQ configuration
  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: "dead.events",
    deadLetterRoutingKey: "refund.create.failed"
  });

  // Bind queue to exchange
  await channel.bindQueue(
    queue,
    "ecommerce.events",
    EVENT_TYPES.REFUND_CREATED
  );

  console.log("Refund consumer started");

  // Start consuming
  channel.consume(
    queue,
    async (msg) => {

      try {

        if (!msg) return;
        
        const data = JSON.parse(msg.content.toString());
        const { paymentDetails, orderId, userEmail } = data;

        console.log(`[RECEIVED] [REFUND] Received REFUND_CREATED event for order: ${orderId}`);

        const refundResult = await refundService.handleOrderFailureRefund(
            paymentDetails.razorpayPaymentId,
            orderId,
            userEmail
        );

        try {
          if (refundResult.success) {
              await publishEvent(EVENT_TYPES.REFUND_PAID,{
                  userEmail, refundResult, orderId
              });
              
              console.log(`[PUBLISHED] [REFUND] Published REFUND_PAID event for order: ${orderId}`);
          } else {
              await publishEvent(EVENT_TYPES.REFUND_FAILED, {
                  userEmail, refundResult, orderId
              });
              console.log(`[PUBLISHED] [REFUND] Published REFUND_FAILED event for order: ${orderId}`);
          }
        } catch (publishError) {
          console.error(`[ERROR] [REFUND] Failed to publish refund event:`, publishError.message);
          // Send to DLQ if publishing fails
          channel.nack(msg, false, false);
          return;
        }

        // ACK message
        channel.ack(msg);

      } catch (err) {

        console.error(`[ERROR] [REFUND] Error:`, err.message);

        // Reject message and send to DLQ
        channel.nack(msg, false, false);
      }
    }
  );
}

module.exports = startRefundConsumer;
