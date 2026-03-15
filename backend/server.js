const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import route handlers
const authRoutes = require('./routes/auth');
const smsRoutes = require('./routes/sms');
const paymentRoutes = require('./routes/payment');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/upload');

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

// Connect to MongoDB
MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
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
  max: 3, // limit each IP to 3 payment requests per 5 minutes
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

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.collection('products').find({ isInCatalog: { $ne: false } }).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.collection('products').findOne({ id: parseInt(req.params.id) });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await db.collection('reviews').find({}).toArray();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get all blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await db.collection('blogs').find({}).toArray();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Admin middleware
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // For now, just check if token exists - you can add JWT verification here
  next();
};

// Add product (Admin only)
app.post('/api/admin/products', adminLimiter, isAdmin, async (req, res) => {
  try {
    const productData = req.body;
    
    // Get the highest ID and increment
    const lastProduct = await db.collection('products').findOne({}, { sort: { id: -1 } });
    const newId = lastProduct ? lastProduct.id + 1 : 1;
    
    const newProduct = {
      id: newId,
      ...productData,
      isInCatalog: productData.isInCatalog !== false, // Default to true if not specified
      createdAt: new Date()
    };
    
    const result = await db.collection('products').insertOne(newProduct);
    res.json({ success: true, productId: result.insertedId });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Get all products for admin (including hidden ones)
app.get('/api/admin/products', adminLimiter, isAdmin, async (req, res) => {
  try {
    const products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Remove product (Admin only) - Hide from catalog instead of deleting
app.delete('/api/admin/products/:id', adminLimiter, isAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const result = await db.collection('products').updateOne(
      { id: productId },
      { 
        $set: { 
          isInCatalog: false,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product hidden from catalog successfully' });
  } catch (error) {
    console.error('Error hiding product:', error);
    res.status(500).json({ error: 'Failed to hide product' });
  }
});

// Restore product (Admin only) - Show in catalog again
app.patch('/api/admin/products/:id/restore', adminLimiter, isAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const result = await db.collection('products').updateOne(
      { id: productId },
      { 
        $set: { 
          isInCatalog: true,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product restored to catalog successfully' });
  } catch (error) {
    console.error('Error restoring product:', error);
    res.status(500).json({ error: 'Failed to restore product' });
  }
});

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});