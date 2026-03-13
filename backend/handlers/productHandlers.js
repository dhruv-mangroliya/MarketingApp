const fs = require('fs');
const path = require('path');

const getAllProducts = (req, res) => {
  try {
    const productsPath = path.join(__dirname, '../data', 'products.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const simplifiedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      rating: p.rating,
      discountPrice: p.discountPrice,
      discountPercentage: p.discountPercentage,
      reviews: p.reviews
    }));
    res.json(simplifiedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

const getProductById = (req, res) => {
  try {
    const productsPath = path.join(__dirname, '../data', 'products.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById
};