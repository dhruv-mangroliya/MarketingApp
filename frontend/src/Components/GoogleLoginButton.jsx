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
      toast.error('Login failed. Please try again.');
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