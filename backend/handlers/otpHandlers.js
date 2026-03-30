const OTP = require('../models/OTP');
const User = require('../models/User');
const msg91Service = require('../services/msg91Service');

/**
 * Send OTP to phone number and link it to user's email
 * This is a one-time process to link phone number to user account
 */
const sendPhoneOTP = async (req, res) => {
  try {
    console.log('📱 sendPhoneOTP called with:', req.body);
    
    const { email, phoneNumber } = req.body;
    
    if (!email || !phoneNumber) {
      console.log('❌ Missing email or phoneNumber');
      return res.status(400).json({ 
        success: false,
        message: 'Email and phone number are required' 
      });
    }

    // Validate phone number format (should include country code)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.log('❌ Invalid phone number format:', phoneNumber);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number format. Please include country code.' 
      });
    }

    console.log('🔍 Looking for user with email:', email);
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found with email:', email);
      return res.status(404).json({ 
        success: false,
        message: 'User not found with this email' 
      });
    }

    console.log('✅ User found:', user.name);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 Generated OTP:', otp);
    
    // Save OTP to MongoDB
    console.log('💾 Saving OTP to database...');
    await OTP.create({
      identifier: phoneNumber,
      otp,
      type: 'sms',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      metadata: { email } // Store email for linking after verification
    });
    console.log('✅ OTP saved to database');

    // For development, return OTP in response (remove in production)
    if (process.env.NODE_ENV === 'development' || !process.env.MSG91_AUTH_KEY) {
      console.log('🚧 Development mode - returning OTP in response');
      return res.json({ 
        success: true, 
        message: 'OTP sent successfully to your phone number',
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        otp: otp // Only for development
      });
    }

    // Send OTP via MSG91
    console.log('📤 Sending OTP via MSG91...');
    const smsResult = await msg91Service.sendOTP(phoneNumber, otp);
    
    if (!smsResult.success) {
      console.log('❌ MSG91 failed:', smsResult.message);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send OTP', 
        error: smsResult.message 
      });
    }

    console.log(`📱 OTP sent to ${phoneNumber} for email ${email}`);
    res.json({ 
      success: true, 
      message: 'OTP sent successfully to your phone number',
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') // Mask phone number in response
    });
  } catch (error) {
    console.error('💥 Error in sendPhoneOTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending OTP', 
      error: error.message 
    });
  }
};

/**
 * Verify OTP and link phone number to user's email
 */
const verifyPhoneOTP = async (req, res) => {
  try {
    console.log('🔍 verifyPhoneOTP called with:', req.body);
    
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      console.log('❌ Missing phoneNumber or otp');
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and OTP are required' 
      });
    }

    console.log('🔍 Looking for OTP record...');
    
    // Find OTP record
    const storedOTP = await OTP.findOne({ 
      identifier: phoneNumber, 
      type: 'sms',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!storedOTP) {
      console.log('❌ OTP not found or expired');
      return res.status(400).json({ 
        success: false,
        message: 'OTP not found or expired' 
      });
    }

    console.log('✅ OTP record found');

    if (storedOTP.otp !== otp) {
      console.log('❌ Invalid OTP provided');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP' 
      });
    }

    console.log('✅ OTP matches');

    // Get email from OTP metadata
    const email = storedOTP.metadata?.email;
    if (!email) {
      console.log('❌ No email in OTP metadata');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP session' 
      });
    }

    console.log('📧 Email from metadata:', email);
    console.log('🔄 Updating user with phone number...');

    // Update user with phone number
    const user = await User.findOneAndUpdate(
      { email },
      { 
        phoneNumber,
        phoneVerified: true,
        phoneVerifiedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      console.log('❌ User not found for update');
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('✅ User updated successfully');

    // Mark OTP as verified
    storedOTP.verified = true;
    await storedOTP.save();
    console.log('✅ OTP marked as verified');

    console.log(`✅ Phone ${phoneNumber} linked to email ${email}`);
    res.json({ 
      success: true, 
      message: 'Phone number verified and linked successfully',
      user: {
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified
      }
    });
  } catch (error) {
    console.error('💥 Error in verifyPhoneOTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying OTP', 
      error: error.message 
    });
  }
};

/**
 * Get user's phone number by email
 */
const getUserPhone = async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findOne({ email }, 'phoneNumber phoneVerified phoneVerifiedAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      phoneVerifiedAt: user.phoneVerifiedAt
    });
  } catch (error) {
    console.error('Error fetching user phone:', error.message);
    res.status(500).json({ message: 'Error fetching phone number', error: error.message });
  }
};

/**
 * Resend OTP to phone number
 */
const resendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if there's a pending OTP for this phone number
    const existingOTP = await OTP.findOne({ 
      identifier: phoneNumber, 
      type: 'sms',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!existingOTP) {
      return res.status(400).json({ message: 'No pending OTP found for this phone number' });
    }

    // Resend OTP via MSG91
    const resendResult = await msg91Service.resendOTP(phoneNumber);
    
    if (!resendResult.success) {
      return res.status(500).json({ 
        message: 'Failed to resend OTP', 
        error: resendResult.message 
      });
    }

    console.log(`🔄 OTP resent to ${phoneNumber}`);
    res.json({ 
      success: true, 
      message: 'OTP resent successfully'
    });
  } catch (error) {
    console.error('Error resending OTP:', error.message);
    res.status(500).json({ message: 'Error resending OTP', error: error.message });
  }
};

module.exports = {
  sendPhoneOTP,
  verifyPhoneOTP,
  getUserPhone,
  resendPhoneOTP
};