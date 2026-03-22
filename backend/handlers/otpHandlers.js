const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured');
      return res.status(500).json({ message: 'Email service not configured' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to MongoDB
    await OTP.create({
      identifier: email,
      otp,
      type: 'email',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Order Verification',
      html: `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes</p>`
    };

    console.log('Attempting to send email to:', email);
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedOTP = await OTP.findOne({ 
      identifier: email, 
      type: 'email',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!storedOTP) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark OTP as verified
    storedOTP.verified = true;
    await storedOTP.save();

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

module.exports = {
  sendOTP,
  verifyOTP
};