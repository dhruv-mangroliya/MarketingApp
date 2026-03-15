const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number,
    required: true
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  sizes: [{
    type: String
  }],
  description: {
    type: String,
    required: true
  },
  returnPeriod: {
    type: Number,
    default: 7
  },
  userReviews: [{
    user: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String
  }],
  specifications: {
    fabric: String,
    care: String,
    occasion: String
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    slug: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ category: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isNew: 1 });
productSchema.index({ 'seo.slug': 1 });

module.exports = mongoose.model('Product', productSchema);