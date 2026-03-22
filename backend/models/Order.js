const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: Number,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  size: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: false // Optional for backward compatibility
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  userEmail: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  phoneNumber: {
    type: String,
    required: true
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paymentStatus: String,
    paymentMethod: String
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  estimatedDelivery: {
    type: Date
  }
}, {
  timestamps: true
});

orderSchema.index({ userEmail: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);