const EVENT_TYPES = {
  ORDER_RECEIVED: "order.received",

  //step-1: reserve inventory for all items in the order triggered by order received
  INVENTORY_FAILED: "inventory.failed",
  REFUND_CREATED: "refund.created",
  REFUND_PAID: "refund.paid",
  REFUND_FAILED: "refund.failed",
  SHORTAGE_MAIL_SENT: "shortage.mail.sent",
  SHORTAGE_MAIL_FAILED: "shortage.mail.failed",
  REFUND_PAID_MAIL_SENT: "refund.paid.mail.sent",
  REFUND_PAID_MAIL_FAILED: "refund.paid.mail.failed",
  REFUND_FAILED_MAIL_SENT: "refund.failed.mail.sent",
  REFUND_FAILED_MAIL_FAILED: "refund.failed.mail.failed",
  INVENTORY_RESERVED: "inventory.reserved",
  
  //step-2: Order creation triggers by inventory reservation success
  ORDER_CREATED: "order.created",
  PAYMENT_CREATED: "payment.created",
  INVENTORY_PURCHASED: "inventory.purchased",
  ORDER_CONFIRMED: "order.confirmed",
  //refund is same as above, triggered by payment failure, not able to purchase inventory





  ORDER_CANCELLED: "order.cancelled",


  PAYMENT_FAILED: "payment.failed",

};

module.exports = EVENT_TYPES;