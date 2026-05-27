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

  // Setup Dead Letter Queue
  const deadLetterQueue = "inventory.shortage.dead.queue";
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
    "inventory.shortage.failed"
  );

  const queue = "inventory.shortage.queue";

  // Create queue with DLQ configuration
  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: "dead.events",
    deadLetterRoutingKey: "inventory.shortage.failed"
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
        let emailSent = false;
        try {
            await emailService.sendStockShortageNotification(userEmail, {
                productName,
                size,
                requested,
                available,
                items
            });
            console.log(`[SUCCESS] Stock shortage email sent to ${userEmail}`);
            emailSent = true;
        } catch (emailError) {
            console.error(`[ERROR] Failed to send stock shortage email:`, emailError.message);
        }

        try {
          if (emailSent) {
            await publishEvent(EVENT_TYPES.SHORTAGE_MAIL_SENT, {
                userEmail,
                productName,
                size,
                requested,
                available
            });
          } else {
            await publishEvent(EVENT_TYPES.SHORTAGE_MAIL_FAILED, {
                userEmail,
                productName,
                size,
                requested,
                available
            });
          }
        } catch (publishError) {
          console.error(`[ERROR] Failed to publish shortage mail event:`, publishError.message);
        }

        // ACK message
        channel.ack(msg);

      } catch (err) {

        console.error(`[ERROR] [INVENTORY_SHORTAGE] Error:`, err.message);

        // Reject message and send to DLQ
        channel.nack(msg, false, false);
      }
    }
  );
}

module.exports = startInventoryShortageConsumer;
