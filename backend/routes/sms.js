const express = require('express');
const router = express.Router();
const twilio = require('twilio');

const otpStore = new Map();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

router.post('/send', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    // Development mode - log OTP instead of sending SMS
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('=== DEVELOPMENT MODE ===');
      console.log('OTP for', phone, ':', otp);
      console.log('========================');
      return res.json({ success: true, message: 'OTP sent successfully (check console)', otp });
    }

    // Try to send SMS, fallback to console if it fails
    try {
      console.log('Attempting to send SMS to:', phone);
      console.log('Using Twilio number:', process.env.TWILIO_PHONE_NUMBER);
      
      await client.messages.create({
        body: `Your KurtiBazaar OTP is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log('SMS sent successfully to:', phone);
      res.json({ success: true, message: 'OTP sent successfully' });
    } catch (twilioError) {
      console.log('=== SMS FAILED - DEVELOPMENT MODE ===');
      console.log('OTP for', phone, ':', otp);
      console.log('Error:', twilioError.message);
      console.log('=====================================');
      res.json({ success: true, message: 'OTP sent successfully (check console)', otp });
    }
  } catch (error) {
    console.error('Error in SMS route:', error.message);
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
});

router.post('/verify', (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const storedData = otpStore.get(phone);

    if (!storedData) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpStore.delete(phone);
    res.json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
});

module.exports = router;
