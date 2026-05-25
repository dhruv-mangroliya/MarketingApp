const { getChannel } = require("../config/rabbitmq");

async function publishEvent(routingKey, data) {
  const channel = getChannel();

  channel.publish(
    "ecommerce.events",
    routingKey,
    Buffer.from(JSON.stringify(data)),
    {
      persistent: true //this makes sure messages are not lost if RabbitMQ restarts before they are processed
    }
  );

  console.log(`Event published: ${routingKey}`);
}

module.exports = publishEvent;