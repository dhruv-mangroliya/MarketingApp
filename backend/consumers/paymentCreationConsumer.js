const {
  getChannel
} = require("../config/rabbitmq");

const EVENT_TYPES = require(
  "../events/eventTypes"
);
const prisma = require('../lib/prisma');
const publishEvent = require('../events/publisher');

async function startPaymentCreationConsumer() {

  const channel = getChannel();

  // Setup Dead Letter Queue
  const deadLetterQueue = "payment.create.dead.queue";
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
    "payment.create.failed"
  );

  const queue = "payment.create.queue";

  // Create queue with DLQ configuration
  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: "dead.events",
    deadLetterRoutingKey: "payment.create.failed"
  });

  // Bind queue to exchange
  await channel.bindQueue(
    queue,
    "ecommerce.events",
    EVENT_TYPES.ORDER_CREATED
  );

  console.log("Payment creation consumer started");

  // Start consuming
  channel.consume(
    queue,
    async (msg) => {

      try {

        if (!msg) return;
        
        const data = JSON.parse(msg.content.toString());
        const {
          orderId,
          totalAmount,
          paymentDetails
        } = data;
        
        console.log(`[RECEIVED] [PAYMENT_CREATION] Received ORDER_CREATED event for order: ${orderId}`);
        
        // Find the order by orderId string
        const order = await prisma.order.findUnique({
          where: { orderId: orderId }
        });

        if (!order) {
          console.error(`[ERROR] [PAYMENT_CREATION] Order not found: ${orderId}, acknowledging message`);
          channel.ack(msg);
          return;
        }

        // Create payment record if payment details exist
        if (paymentDetails) {
          await prisma.payment.create({
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

          console.log(`[SUCCESS] Payment record created for order ${orderId}`);
        }

        try {
          await publishEvent(EVENT_TYPES.PAYMENT_CREATED, {
            orderId,
            totalAmount,
            paymentDetails,
            items: data.items,
            userEmail: data.userEmail,
            shippingAddress: data.shippingAddress
          });
          
          console.log(`[PUBLISHED] [PAYMENT_CREATION] Published PAYMENT_CREATED event for order: ${orderId}`);
        } catch (publishError) {
          console.error(`[ERROR] [PAYMENT_CREATION] Failed to publish PAYMENT_CREATED:`, publishError.message);
          // Send to DLQ if publishing fails
          channel.nack(msg, false, false);
          return;
        }

        // ACK message
        channel.ack(msg);

      } catch (err) {

        console.error(`[ERROR] [PAYMENT_CREATION] Error:`, err.message);

        // Reject message and send to DLQ
        channel.nack(msg, false, false);
      }
    }
  );
}

module.exports = startPaymentCreationConsumer;
