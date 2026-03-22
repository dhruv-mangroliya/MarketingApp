const prisma = require('../lib/prisma');

async function seedPostgreSQL() {
  try {
    console.log('🌱 Starting PostgreSQL seeding...');

    // Clear existing data
    await prisma.orderItem.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.product.deleteMany({});
    
    console.log('🧹 Cleared existing data');

    // Create sample products
    const products = await prisma.product.createMany({
      data: [
        {
          id: 1,
          name: 'Classic Pink Kurti Set',
          price: 1499,
          discountPrice: 1199,
          stock: 25,
          image: 'https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/1.jpeg',
          category: 'Kurti',
          description: 'Elegant pink cotton kurti set perfect for summer wear.',
          sizes: ['S', 'M', 'L', 'XL'],
          isActive: true
        },
        {
          id: 2,
          name: 'Yellow Printed Cotton Kurti',
          price: 1399,
          discountPrice: 1099,
          stock: 18,
          image: 'https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/2.jpeg',
          category: 'Kurti',
          description: 'Bright yellow cotton kurti with traditional block prints.',
          sizes: ['S', 'M', 'L', 'XL'],
          isActive: true
        },
        {
          id: 3,
          name: 'Floral Embroidered Kurti',
          price: 1499,
          discountPrice: 1199,
          stock: 25,
          image: 'https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/3.jpeg',
          category: 'Kurti',
          description: 'Beautiful floral embroidered kurti for special occasions.',
          sizes: ['S', 'M', 'L', 'XL'],
          isActive: true
        }
      ]
    });

    console.log('✅ Created sample products');

    // Create inventory for each product
    const inventoryData = [
      // Product 1 inventory
      { productId: 1, size: 'S', stockQuantity: 5, reservedQuantity: 0 },
      { productId: 1, size: 'M', stockQuantity: 10, reservedQuantity: 0 },
      { productId: 1, size: 'L', stockQuantity: 7, reservedQuantity: 0 },
      { productId: 1, size: 'XL', stockQuantity: 3, reservedQuantity: 0 },
      
      // Product 2 inventory
      { productId: 2, size: 'S', stockQuantity: 4, reservedQuantity: 0 },
      { productId: 2, size: 'M', stockQuantity: 6, reservedQuantity: 0 },
      { productId: 2, size: 'L', stockQuantity: 5, reservedQuantity: 0 },
      { productId: 2, size: 'XL', stockQuantity: 3, reservedQuantity: 0 },
      
      // Product 3 inventory
      { productId: 3, size: 'S', stockQuantity: 6, reservedQuantity: 0 },
      { productId: 3, size: 'M', stockQuantity: 8, reservedQuantity: 0 },
      { productId: 3, size: 'L', stockQuantity: 7, reservedQuantity: 0 },
      { productId: 3, size: 'XL', stockQuantity: 4, reservedQuantity: 0 }
    ];

    await prisma.inventoryItem.createMany({
      data: inventoryData
    });

    console.log('✅ Created inventory items');

    // Create sample orders
    const order1 = await prisma.order.create({
      data: {
        orderId: 'ORDER_1703123456789_abc123',
        userEmail: 'dhruvmangroliya642@gmail.com',
        totalAmount: 1199,
        status: 'DELIVERED',
        shippingAddress: {
          name: 'Priya Sharma',
          phone: '+919876543210',
          address: '123 MG Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        phoneNumber: '+919876543210',
        orderDate: new Date('2024-01-15'),
        estimatedDelivery: new Date('2024-01-22'),
        orderItems: {
          create: [
            {
              productId: 1,
              productName: 'Classic Pink Kurti Set',
              quantity: 1,
              size: 'M',
              price: 1199,
              image: 'https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/1.jpeg'
            }
          ]
        },
        payment: {
          create: {
            razorpayOrderId: 'order_sample123',
            razorpayPaymentId: 'pay_sample123',
            amount: 1199,
            status: 'CAPTURED',
            paymentMethod: 'card',
            verifiedAt: new Date('2024-01-15')
          }
        }
      }
    });

    const order2 = await prisma.order.create({
      data: {
        orderId: 'ORDER_1703123456790_def456',
        userEmail: 'test@example.com',
        totalAmount: 2198,
        status: 'SHIPPED',
        shippingAddress: {
          name: 'Anjali Patel',
          phone: '+919876543211',
          address: '456 Park Street',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        phoneNumber: '+919876543211',
        orderDate: new Date('2024-01-20'),
        estimatedDelivery: new Date('2024-01-27'),
        orderItems: {
          create: [
            {
              productId: 2,
              productName: 'Yellow Printed Cotton Kurti',
              quantity: 2,
              size: 'L',
              price: 1099,
              image: 'https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/2.jpeg'
            }
          ]
        },
        payment: {
          create: {
            razorpayOrderId: 'order_sample456',
            razorpayPaymentId: 'pay_sample456',
            amount: 2198,
            status: 'CAPTURED',
            paymentMethod: 'upi',
            verifiedAt: new Date('2024-01-20')
          }
        }
      }
    });

    console.log('✅ Created sample orders with payments');

    // Update inventory to reflect the orders
    await prisma.inventoryItem.update({
      where: { productId_size: { productId: 1, size: 'M' } },
      data: { stockQuantity: 9, version: 1 } // Reduced by 1
    });

    await prisma.inventoryItem.update({
      where: { productId_size: { productId: 2, size: 'L' } },
      data: { stockQuantity: 3, version: 1 } // Reduced by 2
    });

    console.log('✅ Updated inventory after orders');

    // Create a sample refund for demonstration
    const firstPayment = await prisma.payment.findFirst({
      where: { orderId: order1.id }
    });

    if (firstPayment) {
      const sampleRefund = await prisma.refund.create({
        data: {
          orderId: order1.id,
          paymentId: firstPayment.id,
          razorpayRefundId: 'rfnd_sample123456',
          amount: 1199,
          reason: 'Product out of stock - automatic refund',
          status: 'COMPLETED',
          userEmail: 'dhruvmangroliya642@gmail.com',
          processedAt: new Date('2024-01-16')
        }
      });

      console.log('✅ Created sample refund');
    }

    console.log('🎉 PostgreSQL seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('- 3 Products created');
    console.log('- 12 Inventory items created');
    console.log('- 2 Orders created');
    console.log('- 2 Payments created');
    console.log('- 1 Sample refund created');

  } catch (error) {
    console.error('❌ PostgreSQL seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedPostgreSQL()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedPostgreSQL;