import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add response interceptor to handle rate limiting globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const errorData = error.response.data;
      throw {
        response: {
          status: 429,
          data: {
            error: errorData.error || 'Too many requests',
            retryAfter: errorData.retryAfter || '15 minutes'
          }
        }
      };
    }
    throw error;
  }
);

export const getProducts = async () => {
  try {
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const sendOTP = async (email) => {
  try {
    const response = await api.post('/otp/send', { email });
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      throw {
        response: {
          status: 429,
          data: error.response.data
        }
      };
    }
    
    throw error;
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post('/otp/verify', { email, otp });
    return response.data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

export const createPaymentOrder = async (amount) => {
  try {
    const response = await api.post('/payment/create-order', { amount });
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      throw {
        response: {
          status: 429,
          data: error.response.data
        }
      };
    }
    
    throw error;
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const response = await api.post('/payment/verify-payment', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

export const sendPhoneOTP = async (email, phoneNumber) => {
  try {
    const response = await api.post('/otp/send-phone', { email, phoneNumber });
    return response.data;
  } catch (error) {
    console.error('Error sending phone OTP:', error);
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      throw {
        response: {
          status: 429,
          data: error.response.data
        }
      };
    }
    
    throw error;
  }
};

export const verifyPhoneOTP = async (phoneNumber, otp) => {
  try {
    const response = await api.post('/otp/verify-phone', { phoneNumber, otp });
    return response.data;
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    throw error;
  }
};

export const getUserPhone = async (email) => {
  try {
    const response = await api.get(`/otp/user-phone/${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user phone:', error);
    throw error;
  }
};
