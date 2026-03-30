const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'sms'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

otpSchema.index({ identifier: 1 });
otpSchema.index({ type: 1 });
otpSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('OTP', otpSchema);