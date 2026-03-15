import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

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

export const sendSMSOTP = async (phone) => {
  try {
    const response = await api.post('/sms/send', { phone });
    return response.data;
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    
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

export const verifySMSOTP = async (phone, otp) => {
  try {
    const response = await api.post('/sms/verify', { phone, otp });
    return response.data;
  } catch (error) {
    console.error('Error verifying SMS OTP:', error);
    throw error;
  }
};
