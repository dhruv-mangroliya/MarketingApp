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

  const queue =
    "refund.create.queue";

  // Create queue
  await channel.assertQueue(queue, {
    durable: true
  });

  // Bind queue to exchange
  await channel.bindQueue(
    queue,
    "ecommerce.events",
    EVENT_TYPES.REFUND_CREATED
  );

  console.log(
    "Inventory consumer started"
  );

  // Start consuming
  channel.consume(
    queue,
    async (msg) => {

      try {

        if (!msg) return;
        
        const data = JSON.parse(msg.content.toString());
        const { paymentDetails, orderId, userEmail } = data;

        console.log(`📥 [REFUND] Received REFUND_CREATED event for order: ${orderId}`);

        const refundResult = await refundService.handleOrderFailureRefund(
            paymentDetails.razorpayPaymentId,
            orderId,
            userEmail
        );

        if (refundResult.success) {
            await publishEvent(EVENT_TYPES.REFUND_PAID,{
                userEmail, refundResult, orderId
            });
            
            console.log(`📤 [REFUND] Published REFUND_PAID event for order: ${orderId}`);
        } else {
            await publishEvent(EVENT_TYPES.REFUND_FAILED, {
                userEmail, refundResult, orderId
            });
            console.log(`📤 [REFUND] Published REFUND_FAILED event for order: ${orderId}`);
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

module.exports = startRefundConsumer;