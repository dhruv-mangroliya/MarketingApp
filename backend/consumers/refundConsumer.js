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

        const refundResult = await refundService.handleOrderFailureRefund(
            paymentDetails.razorpayPaymentId,
            orderId,
            userEmail
        );

        if (refundResult.success) {
            // Send email notification with refund details
            await publishEvent(EVENT_TYPES.REFUND_PAID,{
                userEmail, refundResult, orderId
            })
            
            console.log('Refund successful for payment:', paymentDetails.razorpayPaymentId);
        } else {
            await publishEvent(EVENT_TYPES.REFUND_FAILED, {
                userEmail, refundResult, orderId
            });
            console.error('Refund failed for payment:', paymentDetails.razorpayPaymentId);
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