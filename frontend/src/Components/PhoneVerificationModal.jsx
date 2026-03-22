import React, { useState } from 'react';
import './PhoneVerificationModal.css';
import { toast } from 'react-toastify';

const PhoneVerificationModal = ({ isOpen, onClose, onVerified }) => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phoneNumber })
      });

      const data = await response.json();
      
      // Handle rate limiting
      if (response.status === 429) {
        toast.error(`🚫 ${data.error || 'Too many SMS requests'}\n⏰ Please try again after ${data.retryAfter || '15 minutes'}`, {
          autoClose: 8000,
          style: { whiteSpace: 'pre-line' }
        });
        return;
      }
      
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
      toast.error('Failed to send OTP');
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
      const response = await fetch('http://localhost:5001/api/sms/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phoneNumber, otp })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Phone verified successfully!');
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
            <p>Please enter your phone number to receive OTP</p>
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
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PhoneVerificationModal;