const {
  getChannel
} = require("../config/rabbitmq");

const EVENT_TYPES = require(
  "../events/eventTypes"
);
const inventoryService = require('../services/inventoryService');
const publishEvent = require('../events/publisher');

async function startInventoryPurchaseConsumer() {

  const channel = getChannel();

  // Setup Dead Letter Queue
  const deadLetterQueue = "inventory.purchase.dead.queue";
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
    "inventory.purchase.failed"
  );

  const queue = "inventory.purchase.queue";

  // Create queue with DLQ configuration
  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: "dead.events",
    deadLetterRoutingKey: "inventory.purchase.failed"
  });

  // Bind queue to exchange
  await channel.bindQueue(
    queue,
    "ecommerce.events",
    EVENT_TYPES.PAYMENT_CREATED
  );

  // Start consuming
  channel.consume(
    queue,
    async (msg) => {

      try {

        if (!msg) return;
        
        const data = JSON.parse(msg.content.toString());

        const {
          items,
          orderId,
          userEmail,
          paymentDetails,
          totalAmount,
          shippingAddress
        } = data;

        console.log(`[RECEIVED] [INVENTORY_PURCHASE] Received PAYMENT_CREATED event for order: ${orderId}`);

        for (const item of items) {
            try {
                await inventoryService.confirmPurchase(
                    item.productId, 
                    item.size, 
                    item.quantity
                );
                console.log(`[SUCCESS] [INVENTORY_PURCHASE] Confirmed purchase for product ${item.productId}, size ${item.size}, qty ${item.quantity}`);
            } catch (confirmError) {
                console.error(`[ERROR] [INVENTORY_PURCHASE] Failed to confirm purchase for ${item.productName}:`, confirmError.message);
                
                // Release all reserved stock for this order
                for (const releaseItem of items) {
                    await inventoryService.releaseReservedStock(
                        releaseItem.productId, 
                        releaseItem.size, 
                        releaseItem.quantity
                    );
                }

                try {
                  // If payment was already processed, initiate refund
                  if (paymentDetails && paymentDetails.razorpayPaymentId) {
                      await publishEvent(EVENT_TYPES.REFUND_CREATED, {
                          paymentDetails,
                          orderId,
                          userEmail
                      });

                      console.log(`[PUBLISHED] [INVENTORY_PURCHASE] Published REFUND_CREATED event for order: ${orderId}`);
                  }
                } catch (publishError) {
                  console.error(`[ERROR] [INVENTORY_PURCHASE] Failed to publish REFUND_CREATED:`, publishError.message);
                }
                
                // ACK and stop processing, If purchase failed that is business logic failure.
                channel.ack(msg);
                return;
            }
        }
        
        try {
          await publishEvent(EVENT_TYPES.INVENTORY_PURCHASED, {
              items,
              orderId,
              userEmail,
              paymentDetails,
              totalAmount,
              shippingAddress
          });
          
          console.log(`[PUBLISHED] [INVENTORY_PURCHASE] Published INVENTORY_PURCHASED event for order: ${orderId}`);
        } catch (publishError) {
          console.error(`[ERROR] [INVENTORY_PURCHASE] Failed to publish INVENTORY_PURCHASED:`, publishError.message);
          // Send to DLQ if publishing fails
          channel.nack(msg, false, false);
          return;
        }

        // ACK message
        channel.ack(msg);

      } catch (err) {
        console.error(`[ERROR] [INVENTORY_PURCHASE] Error processing order:`, err.message);
        // Reject message and send to DLQ
        channel.nack(msg, false, false);
      }
    }
  );
}

module.exports = startInventoryPurchaseConsumer;
