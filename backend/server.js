const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { connectRabbitMQ } = require("./config/rabbitmq");
const startInventoryConsumer = require("./consumers/inventoryConsumer");
const startInventoryReserverConsumer = require("./consumers/inventoryReserverConsumer");
const startInventoryShortageConsumer = require("./consumers/inventoryShortageConsumer");
const startRefundConsumer = require("./consumers/refundConsumer");
const startRefundPaidEmailConsumer = require("./consumers/refundPaidEmailConsumer");
const startRefundFailedEmailConsumer = require("./consumers/refundFailedEmailConsumer");
const startFinalNotificationConsumer = require("./consumers/finalNotificationConsumer");
const startInventoryPurchaseConsumer = require("./consumers/inventoryPurchaseConsumer");
const startPaymentConsumer = require("./consumers/paymentCreationConsumer");
const startOrderCreationConsumer = require("./consumers/orderCreationConsumer");

require('dotenv').config();

// Import route handlers
const authRoutes = require('./routes/auth');
const smsRoutes = require('./routes/sms');
const paymentRoutes = require('./routes/postgresPayments'); // Use PostgreSQL payments
const orderRoutes = require('./routes/postgresOrders'); // Use PostgreSQL orders
const uploadRoutes = require('./routes/upload');
const newsletterRoutes = require('./routes/newsletter');
const otpRoutes = require('./routes/otp');
const inventoryRoutes = require('./routes/inventory'); // Add inventory routes
const refundRoutes = require('./routes/refunds'); // Add refund routes
const productsRoutes = require('./routes/products'); // Add products routes
const reviewsRoutes = require('./routes/reviews'); // Add reviews routes
const blogsRoutes = require('./routes/blogs'); // Add blogs routes
const adminRoutes = require('./routes/admin'); // Add admin routes
const prisma = require('./lib/prisma'); // Add Prisma client

const app = express();
const PORT = process.env.PORT || 5001;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'kurtibazaar';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dhruvmangroliya642@gmail.com';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);
let db;

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Connect to MongoDB with Mongoose
mongoose.connect(MONGODB_URI + '/' + DB_NAME)
  .then(() => {
    console.log('Connected to MongoDB with Mongoose');
  })
  .catch(error => console.error('Mongoose connection error:', error));

// Connect to MongoDB with native driver for existing functionality
MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('Connected to MongoDB with native driver');
    db = client.db(DB_NAME);
    // Make db available to routes
    app.locals.db = db;
  })
  .catch(error => console.error('MongoDB connection error:', error));

app.use(cors());
app.use(express.json());

// Rate limiting configuration
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});

const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit each IP to 3 payment requests per 5 minutes
  message: {
    error: 'Too many payment attempts, please try again later.',
    retryAfter: '5 minutes'
  },
});

const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 SMS requests per windowMs
  message: {
    error: 'Too many SMS requests, please try again later.',
    retryAfter: '15 minutes'
  },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 admin requests per windowMs
  message: {
    error: 'Too many admin requests, please try again later.',
    retryAfter: '15 minutes'
  },
});

// Apply global rate limiting
app.use(globalLimiter);

// Use route handlers with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sms', smsLimiter, smsRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/inventory', inventoryRoutes); // Add inventory routes
app.use('/api/refunds', refundRoutes); // Add refund routes
app.use('/api/products', productsRoutes); // Add products routes
app.use('/api/reviews', reviewsRoutes); // Add reviews routes
app.use('/api/blogs', blogsRoutes); // Add blogs routes
app.use('/api/admin', adminLimiter, adminRoutes); // Add admin routes
app.use('/api/inventory-validation', require('./routes/inventory-validation')); // Add inventory validation routes
app.use('/api/admin/inventory', require('./routes/inventory-sync')); // Add inventory sync routes

// S3 image upload endpoint
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `products/product-${timestamp}.${fileExtension}`;
    
    try {
      // Upload to S3
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME || 'kurtibazaar-images',
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      
      const imageUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`;
      
      console.log('✅ S3 Upload successful:', imageUrl);
      
      res.json({
        success: true,
        imageUrl: imageUrl,
        message: 'Image uploaded successfully'
      });
    } catch (s3Error) {
      console.error('❌ S3 upload failed:', s3Error.message);
      
      // Use a working placeholder image for development
      const placeholderUrl = `https://picsum.photos/400/400?random=${timestamp}`;
      
      console.log('🔄 Using Picsum placeholder:', placeholderUrl);
      
      res.json({
        success: true,
        imageUrl: placeholderUrl,
        message: 'Using placeholder image (S3 upload failed)',
        error: s3Error.message
      });
    }
  } catch (error) {
    console.error('❌ Upload endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process upload',
      error: error.message 
    });
  }
});
async function startServer() {
  await connectRabbitMQ();
  await startInventoryConsumer();
  await startInventoryReserverConsumer();
  await startInventoryShortageConsumer();
  await startRefundConsumer();
  await startRefundPaidEmailConsumer();
  await startRefundFailedEmailConsumer();
  await startFinalNotificationConsumer();
  await startInventoryPurchaseConsumer();
  await startPaymentConsumer();
  await startOrderCreationConsumer();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();




// we are implementing newsletter email verification feature...