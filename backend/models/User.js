const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  picture: {
    type: String
  },
  preferences: {
    favoriteCategories: [{
      type: String
    }],
    sizePreference: {
      type: String,
      enum: ['S', 'M', 'L', 'XL']
    },
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);