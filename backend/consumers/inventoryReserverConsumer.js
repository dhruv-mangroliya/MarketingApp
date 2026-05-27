const {
  getChannel
} = require("../config/rabbitmq");
const inventoryService = require('../services/inventoryService');
const publishEvent = require('../events/publisher');
const refundService = require('../services/refundService');
const prisma = require('../lib/prisma');

const EVENT_TYPES = require(
  "../events/eventTypes"
);

async function startInventoryReserverConsumer() {

  const channel = getChannel();

  // Setup Dead Letter Queue
  const deadLetterQueue = "inventory.reserve.dead.queue";
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
    "inventory.reserve.failed"
  );

  const queue = "inventory.reserve.queue";

  // Create queue with DLQ configuration
  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: "dead.events",
    deadLetterRoutingKey: "inventory.reserve.failed"
  });

  // Bind queue to exchange
  await channel.bindQueue(
    queue,
    "ecommerce.events",
    EVENT_TYPES.ORDER_RECEIVED
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
          paymentDetails,
          orderId
        } = data;

        console.log(`[RECEIVED] [INVENTORY_RESERVER] Received ORDER_RECEIVED event for order: ${orderId}`);
        console.log(`[INFO] [INVENTORY_RESERVER] Extracted shippingAddress:`, shippingAddress);

        // Check if order already exists (idempotency check)
        const existingOrder = await prisma.order.findUnique({
          where: { orderId }
        });

        if (existingOrder) {
          console.log(`[WARNING] [INVENTORY_RESERVER] Order ${orderId} already exists, skipping duplicate message`);
          channel.ack(msg);
          return;
        }

        // Step 1: Reserve inventory for all items
        const reservationResults = [];
        for (const item of items) {
          const result = await inventoryService.purchaseProduct(
            item.productId,
            item.size,
            item.quantity
          );

          if (!result.success) {
            // Release any previously reserved stock
            for (const prevItem of reservationResults) {
              await inventoryService.releaseReservedStock(
                prevItem.productId,
                prevItem.size,
                prevItem.quantity
              );
            }

            try {
              await publishEvent(EVENT_TYPES.INVENTORY_FAILED, {
                  productName: item.productName,
                  size: item.size,
                  requested: item.quantity,
                  available: result.message.match(/Available: (\d+)/)?.[1] || 0,
                  items: items,
                  userEmail
              });

              console.log(`[PUBLISHED] [INVENTORY_RESERVER] Published INVENTORY_FAILED event for order: ${orderId}`);

              
              // If payment was already processed, initiate refund
              if (paymentDetails && paymentDetails.razorpayPaymentId) {

                await publishEvent(EVENT_TYPES.REFUND_CREATED, {
                  paymentDetails,
                  orderId,
                  userEmail
               });

               console.log(`[PUBLISHED] [INVENTORY_RESERVER] Published REFUND_CREATED event for order: ${orderId}`);
              }
            } catch (publishError) {
              console.error(`[ERROR] [INVENTORY_RESERVER] Failed to publish events:`, publishError.message);
            }

            console.log(`[ERROR] [INVENTORY_RESERVER] Failed to reserve stock for ${item.productName} (${item.size}). Requested: ${item.quantity}, Available: ${result.message.match(/Available: (\d+)/)?.[1] || 0}`);
            
            // ACK message and stop processing
            channel.ack(msg);
            return;
          }

          reservationResults.push(item);
        }

        try {
          await publishEvent(EVENT_TYPES.INVENTORY_RESERVED, {
            items: reservationResults,
            orderId,
            userEmail, 
            totalAmount, 
            shippingAddress, 
            phoneNumber,
            paymentDetails 
          });
          console.log(`[INFO] [INVENTORY_RESERVER] Publishing data:`, JSON.stringify({ shippingAddress, userEmail, totalAmount }, null, 2));
          console.log(`[PUBLISHED] [INVENTORY_RESERVER] Published INVENTORY_RESERVED event for order: ${orderId}`);
        } catch (publishError) {
          console.error(`[ERROR] [INVENTORY_RESERVER] Failed to publish INVENTORY_RESERVED:`, publishError.message);
          // Send to DLQ if publishing fails
          channel.nack(msg, false, false);
          return;
        }
        
        // ACK message
        channel.ack(msg);

      } catch (err) {
        console.error(`[ERROR] [INVENTORY_RESERVER] Error processing order:`, err.message);
        // Reject message and send to DLQ
        channel.nack(msg, false, false);
      }
    }
  );
}

module.exports = startInventoryReserverConsumer;
