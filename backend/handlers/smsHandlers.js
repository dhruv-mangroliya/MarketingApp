const OTP = require('../models/OTP');
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to MongoDB
    await OTP.create({
      identifier: phone,
      otp,
      type: 'sms',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // Always use development mode for now (until Twilio is properly configured)
    console.log('=== DEVELOPMENT MODE ===');
    console.log('OTP for', phone, ':', otp);
    console.log('Reason: Development/Testing mode');
    console.log('========================');
    
    // Return success with OTP for development
    res.json({ 
      success: true, 
      message: 'OTP sent successfully (check console)', 
      otp: otp // Include OTP in response for development
    });

  } catch (error) {
    console.error('Error in SMS route:', error.message);
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

const verifySMS = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const storedOTP = await OTP.findOne({ 
      identifier: phone, 
      type: 'sms',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    console.log('Found OTP record:', storedOTP);

    if (!storedOTP) {
      console.log('No OTP found or expired');
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (storedOTP.otp !== String(otp)) {
      console.log('OTP mismatch');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark OTP as verified
    storedOTP.verified = true;
    await storedOTP.save();

    res.json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

module.exports = {
  sendSMS,
  verifySMS
};