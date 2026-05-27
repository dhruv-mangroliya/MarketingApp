const amqp = require("amqplib");

let channel;

async function connectRabbitMQ() {
  const connection = await amqp.connect("amqp://localhost");

  channel = await connection.createChannel();

  await channel.assertExchange(
    "ecommerce.events",
    "topic",
    { durable: true } //this line makes sure exchange survives rabbitmq restarts
  );

  await channel.assertExchange(
    "dead.events",
    "direct",
    { durable: true } //this line makes sure exchange survives rabbitmq restarts
  );

  console.log("RabbitMQ Connected");
}

function getChannel() {
  return channel;
}

module.exports = {
  connectRabbitMQ,
  getChannel
};