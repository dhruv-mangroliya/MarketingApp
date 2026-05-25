const EVENT_TYPES = {
  ORDER_RECEIVED: "order.received",

  //step-1: reserve inventory for all items in the order triggered by order received
  ORDER_CREATED: "order.created",
  INVENTORY_FAILED: "inventory.failed",
  REFUND_CREATED: "refund.created",
  REFUND_PAID: "refund.paid",
  REFUND_FAILED: "refund.failed",
  SHORTAGE_MAIL_SENT: "shortage.mail.sent",
  SHORTAGE_MAIL_FAILED: "shortage.mail.failed",
  REFUND_MAIL_SENT: "refund.mail.sent",
  REFUND_MAIL_FAILED: "refund.mail.failed",
  REFUND_FAILED_MAIL_SENT: "refund_failed.mail.sent",
  REFUND_FAILED_MAIL_FAILED: "refund_failed.mail.failed",
  INVENTORY_RESERVED: "inventory.reserved",
  
  //step-2: Order creation triggers by inventory reservation success
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_CANCELLED: "order.cancelled",

  PAYMENT_SUCCESS: "payment.success",
  PAYMENT_FAILED: "payment.failed",

};

module.exports = EVENT_TYPES;