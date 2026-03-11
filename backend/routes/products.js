const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
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
});

router.get('/:id', (req, res) => {
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
});

module.exports = router;
