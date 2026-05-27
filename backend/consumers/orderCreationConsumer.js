const {
  getChannel
} = require("../config/rabbitmq");
const prisma = require('../lib/prisma');
const EVENT_TYPES = require(
  "../events/eventTypes"
);
const publishEvent = require('../events/publisher');

async function startOrderCreationConsumer() {

  const channel = getChannel();

  // Setup Dead Letter Queue
  const deadLetterQueue = "order.create.dead.queue";
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
    "order.create.failed"
  );

  const queue = "order.create.queue";

  // Create queue with DLQ configuration
  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: "dead.events",
    deadLetterRoutingKey: "order.create.failed"
  });

  // Bind queue to exchange
  await channel.bindQueue(
    queue,
    "ecommerce.events",
    EVENT_TYPES.INVENTORY_RESERVED
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
          items, 
          totalAmount, 
          shippingAddress, 
          phoneNumber,
          orderId
        } = data;

        console.log(`[RECEIVED] [ORDER_CREATION] Received INVENTORY_RESERVED event for order: ${orderId}`);
        console.log(`[INFO] [ORDER_CREATION] Data received:`, JSON.stringify(data, null, 2));

        // Handle missing shippingAddress (for old messages)
        const finalShippingAddress = shippingAddress || JSON.stringify({ address: 'N/A' });

        const result = await prisma.$transaction(async (tx) => {
          // Create order
          const order = await tx.order.create({
            data: {
              orderId,
              userEmail,
              totalAmount,
              status: 'CONFIRMED',
              shippingAddress: finalShippingAddress,
              phoneNumber: phoneNumber || '',
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

          return order;
        });
        
        console.log(`[SUCCESS] [ORDER_CREATION] Order created in database: ${orderId}`);
        
        try {
          await publishEvent(EVENT_TYPES.ORDER_CREATED, {
            order: result,
            totalAmount,
            paymentDetails: data.paymentDetails,
            orderId,
            items,
            userEmail,
            shippingAddress
          });
          
          console.log(`[PUBLISHED] [ORDER_CREATION] Published ORDER_CREATED event for order: ${orderId}`);
        } catch (publishError) {
          console.error(`[ERROR] [ORDER_CREATION] Failed to publish ORDER_CREATED:`, publishError.message);
          // Send to DLQ if publishing fails
          channel.nack(msg, false, false);
          return;
        }

        // ACK message
        channel.ack(msg);

      } catch (err) {
        const data = JSON.parse(msg.content.toString());
        console.error(`[ERROR] [ORDER_CREATION] Error for order ${data?.orderId}:`, err.message);

        // If order already exists (duplicate), just ACK to avoid infinite retry
        if (err.code === 'P2002' && err.meta?.target?.includes('orderId')) {
          console.log(`[WARNING] [ORDER_CREATION] Order ${data?.orderId} already exists, acknowledging message`);
          channel.ack(msg);
        } else {
          // For other errors, send to DLQ
          channel.nack(msg, false, false);
        }
      }
    }
  );
}

module.exports = startOrderCreationConsumer;
