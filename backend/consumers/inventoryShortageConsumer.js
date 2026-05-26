const {
  getChannel
} = require("../config/rabbitmq");

const EVENT_TYPES = require(
  "../events/eventTypes"
);

const publishEvent = require('../events/publisher');
const emailService = require('../services/emailService');

async function startInventoryShortageConsumer() {

  const channel = getChannel();

  const queue =
    "inventory.shortage.queue";

  // Create queue
  await channel.assertQueue(queue, {
    durable: true
  });

  // Bind queue to exchange
  await channel.bindQueue(
    queue,
    "ecommerce.events",
    EVENT_TYPES.INVENTORY_FAILED
  );


  // Start consuming
  channel.consume(
    queue,
    async (msg) => {

      try {

        if (!msg) return;
        
        const data = JSON.parse(msg.content.toString());
        const { productName, size, requested, available, items, userEmail } = data;

        // Send stock shortage notification email
        try {
            await emailService.sendStockShortageNotification(userEmail, {
                productName,
                size,
                requested,
                available,
                items
            });
            console.log(`✅ Stock shortage email sent to ${userEmail}`);

            await publishEvent(EVENT_TYPES.SHORTAGE_MAIL_SENT, {
                userEmail,
                productName,
                size,
                requested,
                available
            });
        } catch (emailError) {
            console.error(`❌ Failed to send stock shortage email:`, emailError.message);
            await publishEvent(EVENT_TYPES.SHORTAGE_MAIL_FAILED, {
                userEmail,
                productName,
                size,
                requested,
                available
            });
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

module.exports = startInventoryShortageConsumer;