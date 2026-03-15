import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './GoogleLoginButton.css';

const GoogleLoginButton = ({ onSuccess }) => {
  const { loginWithGoogle } = useAuth();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      
      if (result.success) {
        toast.success('Login successful!');
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        toast.error(`🚫 ${errorData.error || 'Too many login attempts'}\n⏰ Please try again after ${errorData.retryAfter || '15 minutes'}`, {
          autoClose: 8000,
          style: { whiteSpace: 'pre-line' }
        });
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.');
  };

  return (
    <div className="google-login-container">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        logo_alignment="left"
      />
    </div>
  );
};

export default GoogleLoginButton;