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

  const queue =
    "payment.create.queue";

  // Create queue
  await channel.assertQueue(queue, {
    durable: true
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
        
        console.log(`📥 [PAYMENT_CREATION] Received ORDER_CREATED event for order: ${orderId}`);
        
        // Find the order by orderId string
        const order = await prisma.order.findUnique({
          where: { orderId: orderId }
        });

        if (!order) {
          console.error(`❌ [PAYMENT_CREATION] Order not found: ${orderId}, acknowledging message`);
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

          console.log(`✅ Payment record created for order ${orderId}`);
        }

        await publishEvent(EVENT_TYPES.PAYMENT_CREATED, {
          orderId,
          totalAmount,
          paymentDetails,
          items: data.items,
          userEmail: data.userEmail,
          shippingAddress: data.shippingAddress
        });
        
        console.log(`📤 [PAYMENT_CREATION] Published PAYMENT_CREATED event for order: ${orderId}`);

        // ACK message
        channel.ack(msg);

      } catch (err) {

        console.error('Payment creation consumer error:', err);

        // Reject message
        channel.nack(msg);
      }
    }
  );
}

module.exports = startPaymentCreationConsumer;
