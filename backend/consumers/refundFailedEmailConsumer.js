const {
  getChannel
} = require("../config/rabbitmq");

const EVENT_TYPES = require(
  "../events/eventTypes"
);

const emailService = require('../services/emailService');
const publishEvent = require('../events/publisher');

async function startRefundFailedEmailConsumer() {

  const channel = getChannel();

  // Setup Dead Letter Queue
  const deadLetterQueue = "refund.failed.email.dead.queue";
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
    "refund.failed.email.failed"
  );

  const queue = "refund.failed.email.queue";

  // Create queue with DLQ configuration
  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: "dead.events",
    deadLetterRoutingKey: "refund.failed.email.failed"
  });

  // Bind queue to exchange
  await channel.bindQueue(
    queue,
    "ecommerce.events",
    EVENT_TYPES.REFUND_FAILED
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
          refundResult,
          orderId
        } = data;

        try {
            await emailService.sendRefundFailedNotification(userEmail, refundResult.refund, orderId);
            console.log(`[SUCCESS] Refund failed email sent to ${userEmail}`);

            await publishEvent(EVENT_TYPES.REFUND_FAILED_MAIL_SENT, {
                userEmail, refundResult, orderId
            });
        } catch (emailError) {
            console.error(`[ERROR] Failed to send refund failed email:`, emailError.message);
            
            try {
              await publishEvent(EVENT_TYPES.REFUND_FAILED_MAIL_FAILED, {
                  userEmail, refundResult, orderId
              });
            } catch (publishError) {
              console.error(`[ERROR] Failed to publish REFUND_FAILED_MAIL_FAILED:`, publishError.message);
            }
        }

        // ACK message
        channel.ack(msg);

      } catch (err) {

        console.error(`[ERROR] [REFUND_FAILED_EMAIL] Error:`, err.message);

        // Reject message and send to DLQ
        channel.nack(msg, false, false);
      }
    }
  );
}

module.exports = startRefundFailedEmailConsumer;
