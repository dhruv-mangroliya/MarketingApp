const mongoose = require('mongoose');
const Order = require('./models/Order');
const OTP = require('./models/OTP');
const Newsletter = require('./models/Newsletter');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI + '/' + (process.env.DB_NAME || 'kurtibazaar'));
    console.log('Connected to MongoDB');

    // Clear existing data
    await Order.deleteMany({});
    await OTP.deleteMany({});
    await Newsletter.deleteMany({});
    console.log('Cleared existing data');

    // Sample orders
    const sampleOrders = [
      {
        orderId: 'ORDER_1703123456789_abc123',
        userEmail: 'dhruvmangroliya642@gmail.com', // Use actual email
        items: [
          {
            productId: 1,
            productName: 'Classic Pink Kurti Set',
            quantity: 1,
            size: 'M',
            price: 1199,
            image: 'https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/1.jpeg'
          }
        ],
        totalAmount: 1199,
        status: 'delivered',
        shippingAddress: {
          name: 'Priya Sharma',
          phone: '+919876543210',
          address: '123 MG Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        phoneNumber: '+919876543210',
        paymentDetails: {
          razorpayOrderId: 'order_sample123',
          razorpayPaymentId: 'pay_sample123',
          paymentStatus: 'captured',
          paymentMethod: 'card'
        },
        orderDate: new Date('2024-01-15'),
        estimatedDelivery: new Date('2024-01-22')
      },
      {
        orderId: 'ORDER_1703123456790_def456',
        userEmail: 'test@example.com', // Different email for testing
        items: [
          {
            productId: 2,
            productName: 'Yellow Printed Cotton Kurti',
            quantity: 2,
            size: 'L',
            price: 1099,
            image: 'https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/2.jpeg'
          }
        ],
        totalAmount: 2198,
        status: 'shipped',
        shippingAddress: {
          name: 'Anjali Patel',
          phone: '+919876543211',
          address: '456 Park Street',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        phoneNumber: '+919876543211',
        paymentDetails: {
          razorpayOrderId: 'order_sample456',
          razorpayPaymentId: 'pay_sample456',
          paymentStatus: 'captured',
          paymentMethod: 'upi'
        },
        orderDate: new Date('2024-01-20'),
        estimatedDelivery: new Date('2024-01-27')
      }
    ];

    // Sample newsletter subscriptions
    const sampleNewsletterSubscriptions = [
      { email: 'priya@example.com' },
      { email: 'anjali@example.com' },
      { email: 'sneha@example.com' },
      { email: 'riya@example.com' }
    ];

    // Insert sample data
    await Order.insertMany(sampleOrders);
    console.log(`Inserted ${sampleOrders.length} sample orders`);

    await Newsletter.insertMany(sampleNewsletterSubscriptions);
    console.log(`Inserted ${sampleNewsletterSubscriptions.length} newsletter subscriptions`);

    console.log('✅ Data seeding completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    process.exit(1);
  }
};

seedData();