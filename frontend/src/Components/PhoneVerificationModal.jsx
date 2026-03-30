import React, { useState } from 'react';
import './PhoneVerificationModal.css';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { sendPhoneOTP, verifyPhoneOTP } from '../utils/api';

const PhoneVerificationModal = ({ isOpen, onClose, onVerified }) => {
  const { user, updateUserPhone } = useAuth();
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!user?.email) {
      toast.error('User email not found. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const data = await sendPhoneOTP(user.email, phoneNumber);
      
      if (data.success) {
        toast.success('OTP sent successfully!');
        
        // In development mode, show the OTP
        if (data.otp) {
          toast.info(`Development Mode - OTP: ${data.otp}`, {
            autoClose: 10000
          });
        }
        
        setStep(2);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        toast.error(`🚫 ${errorData.error || 'Too many SMS requests'}\n⏰ Please try again after ${errorData.retryAfter || '15 minutes'}`, {
          autoClose: 8000,
          style: { whiteSpace: 'pre-line' }
        });
      } else {
        toast.error('Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyPhoneOTP(phoneNumber, otp);
      
      if (data.success) {
        toast.success('Phone verified and linked successfully!');
        
        // Update user context with phone number
        updateUserPhone(phoneNumber);
        
        onVerified(phoneNumber);
        handleClose();
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setPhoneNumber('');
    setOtp('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="phone-verification-modal">
        <h3>Phone Verification</h3>
        <button className="close-btn" onClick={handleClose}>×</button>
        
        {step === 1 ? (
          <>
            <p>Please enter your phone number to link with your account</p>
            <input
              type="tel"
              placeholder="+911234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="phone-input"
            />
            <button 
              onClick={sendOTP} 
              disabled={loading}
              className="send-otp-btn"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p>Enter the 6-digit OTP sent to {phoneNumber}</p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="otp-input"
              maxLength={6}
            />
            <button 
              onClick={() => setStep(1)} 
              className="back-btn"
            >
              Change Number
            </button>
            <button 
              onClick={verifyOTP} 
              disabled={loading}
              className="verify-btn"
            >
              {loading ? 'Verifying...' : 'Verify & Link Phone'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PhoneVerificationModal;