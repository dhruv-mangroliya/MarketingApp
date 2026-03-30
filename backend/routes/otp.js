const express = require('express');
const router = express.Router();
const { sendPhoneOTP, verifyPhoneOTP, getUserPhone, resendPhoneOTP } = require('../handlers/otpHandlers');

// Send OTP to phone number for linking to user account
router.post('/send-phone', sendPhoneOTP);

// Verify OTP and link phone number to user account
router.post('/verify-phone', verifyPhoneOTP);

// Get user's phone number by email
router.get('/user-phone/:email', getUserPhone);

// Resend OTP to phone number
router.post('/resend-phone', resendPhoneOTP);

module.exports = router;