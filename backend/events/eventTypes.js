const EVENT_TYPES = {
  ORDER_CREATED: "order.created",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_CANCELLED: "order.cancelled",

  INVENTORY_RESERVED: "inventory.reserved",
  INVENTORY_FAILED: "inventory.failed",
  INVENTORY_RELEASED: "inventory.released",

  PAYMENT_SUCCESS: "payment.success",
  PAYMENT_FAILED: "payment.failed",

  REFUND_CREATED: "refund.created",

  NOTIFICATION_SEND: "notification.send"
};

module.exports = EVENT_TYPES;