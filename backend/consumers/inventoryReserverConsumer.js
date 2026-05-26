const {
  getChannel
} = require("../config/rabbitmq");
const inventoryService = require('../services/inventoryService');
const publishEvent = require('../events/publisher');
const refundService = require('../services/refundService');

const EVENT_TYPES = require(
  "../events/eventTypes"
);

async function startInventoryReserverConsumer() {

  const channel = getChannel();

  const queue = "inventory.reserve.queue";

  // Create queue
  await channel.assertQueue(queue, {
    durable: true
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

        console.log(`📥 [INVENTORY_RESERVER] Received ORDER_RECEIVED event for order: ${orderId}`);
        console.log(`📋 [INVENTORY_RESERVER] Extracted shippingAddress:`, shippingAddress);

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

            await publishEvent(EVENT_TYPES.INVENTORY_FAILED, {
                productName: item.productName,
                size: item.size,
                requested: item.quantity,
                available: result.message.match(/Available: (\d+)/)?.[1] || 0,
                items: items
            });

            console.log(`📤 [INVENTORY_RESERVER] Published INVENTORY_FAILED event for order: ${orderId}`);

            
            // If payment was already processed, initiate refund
            if (paymentDetails && paymentDetails.razorpayPaymentId) {

              await publishEvent(EVENT_TYPES.REFUND_CREATED, {
                paymentDetails,
                orderId,
                userEmail
             });

             console.log(`📤 [INVENTORY_RESERVER] Published REFUND_CREATED event for order: ${orderId}`);
            }

            console.log(`Failed to reserve stock for ${item.productName} (${item.size}). Requested: ${item.quantity}, Available: ${result.message.match(/Available: (\d+)/)?.[1] || 0}`);
          }

          reservationResults.push(item);
        }

        await publishEvent(EVENT_TYPES.INVENTORY_RESERVED, {
          items: reservationResults,
          orderId,
          userEmail, 
          totalAmount, 
          shippingAddress, 
          phoneNumber,
          paymentDetails 
        });
        console.log(`📋 [INVENTORY_RESERVER] Publishing data:`, JSON.stringify({ shippingAddress, userEmail, totalAmount }, null, 2));
        console.log(`📤 [INVENTORY_RESERVER] Published INVENTORY_RESERVED event for order: ${orderId}`);
        
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

module.exports = startInventoryReserverConsumer;
