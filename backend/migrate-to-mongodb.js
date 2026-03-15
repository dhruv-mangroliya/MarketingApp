const mongoose = require('mongoose');
const Product = require('./models/Product');
const productsData = require('./data/products.json');
require('dotenv').config();

const migrateData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kurtibazaar');
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Transform and insert data
    const transformedProducts = productsData.map(product => ({
      ...product,
      seo: {
        slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }
    }));

    await Product.insertMany(transformedProducts);
    console.log(`Imported ${transformedProducts.length} products`);

    mongoose.connection.close();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateData();