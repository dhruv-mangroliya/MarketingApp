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

  const queue =
    "inventory.purchase.queue";

  // Create queue
  await channel.assertQueue(queue, {
    durable: true
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

        console.log(`📥 [INVENTORY_PURCHASE] Received PAYMENT_CREATED event for order: ${orderId}`);

        for (const item of items) {
            try {
                await inventoryService.confirmPurchase(
                    item.productId, 
                    item.size, 
                    item.quantity
                );
            } catch (confirmError) {
                console.error(`Failed to purchase item for ${item.productName}:`, confirmError.message);
                
                // Release all reserved stock for this order
                for (const releaseItem of items) {
                    await inventoryService.releaseReservedStock(
                        releaseItem.productId, 
                        releaseItem.size, 
                        releaseItem.quantity
                    );
                }

                // If payment was already processed, initiate refund
                if (paymentDetails && paymentDetails.razorpayPaymentId) {
                    await publishEvent(EVENT_TYPES.REFUND_CREATED, {
                        paymentDetails,
                        orderId,
                        userEmail
                    });

                    console.log(`📤 [INVENTORY_PURCHASE] Published REFUND_CREATED event for order: ${orderId}`);
                }
            }
        }
        
        await publishEvent(EVENT_TYPES.INVENTORY_PURCHASED, {
            items,
            orderId,
            userEmail,
            paymentDetails,
            totalAmount,
            shippingAddress
        });
        
        console.log(`📤 [INVENTORY_PURCHASE] Published INVENTORY_PURCHASED event for order: ${orderId}`);

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

module.exports = startInventoryPurchaseConsumer;
