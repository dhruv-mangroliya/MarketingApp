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

  const queue =
    "refund.failed.email.queue";

  // Create queue
  await channel.assertQueue(queue, {
    durable: true
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
            console.log(`✅ Refund failed email sent to ${userEmail}`);

            await publishEvent(EVENT_TYPES.REFUND_FAILED_MAIL_SENT, {
                userEmail, refundResult, orderId
            });
        } catch (emailError) {
            await publishEvent(EVENT_TYPES.REFUND_FAILED_MAIL_FAILED, {
                userEmail, refundResult, orderId
            });
            console.error('Failed to send refund email:', emailError);
        }

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

module.exports = startRefundFailedEmailConsumer;