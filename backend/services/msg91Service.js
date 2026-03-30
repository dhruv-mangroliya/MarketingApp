const axios = require('axios');

class MSG91Service {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.templateId = process.env.MSG91_TEMPLATE_ID;
    this.baseUrl = 'https://control.msg91.com/api/v5';
    
    if (!this.authKey) {
      console.error('MSG91_AUTH_KEY not found in environment variables');
    }
    
    if (!this.templateId) {
      console.error('MSG91_TEMPLATE_ID not found in environment variables');
    }
  }

  /**
   * Send OTP via SMS using MSG91
   * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
   * @param {string} otp - OTP to send
   * @returns {Promise<{success: boolean, message: string, data?: any}>}
   */
  async sendOTP(phoneNumber, otp) {
    try {
      if (!this.authKey || !this.templateId) {
        throw new Error('MSG91 credentials not configured properly');
      }

      // Clean and format phone number
      let cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, ''); // Remove all non-digits
      
      // If it starts with 91, use as is, otherwise add 91 prefix for India
      if (!cleanPhoneNumber.startsWith('91') && cleanPhoneNumber.length === 10) {
        cleanPhoneNumber = '91' + cleanPhoneNumber;
      }
      
      console.log('Original phone:', phoneNumber);
      console.log('Cleaned phone:', cleanPhoneNumber);
      console.log('Auth key present:', !!this.authKey);
      console.log('Template ID:', this.templateId);

      const payload = {
        mobile: String(cleanPhoneNumber),
        template_id: String(this.templateId),
        otp: String(otp),
        otp_length: 6,
        otp_expiry: 5
      };

      console.log('MSG91 Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(`${this.baseUrl}/otp`, payload, {
        headers: {
          'authkey': String(this.authKey),
          'Content-Type': 'application/json'
        }
      });

      console.log('MSG91 Response:', response.data);

      if (response.data.type === 'success') {
        return {
          success: true,
          message: 'OTP sent successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to send OTP'
        };
      }

    } catch (error) {
      console.error('MSG91 Error:', error.response?.data || error.message);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send OTP'
      };
    }
  }

  /**
   * Verify OTP using MSG91
   * @param {string} phoneNumber - Phone number with country code
   * @param {string} otp - OTP to verify
   * @returns {Promise<{success: boolean, message: string, data?: any}>}
   */
  async verifyOTP(phoneNumber, otp) {
    try {
      if (!this.authKey) {
        throw new Error('MSG91 auth key not configured');
      }

      // Remove + from phone number if present
      const cleanPhoneNumber = phoneNumber.replace('+', '');
      
      const response = await axios.get(`${this.baseUrl}/otp/verify`, {
        params: {
          authkey: this.authKey,
          mobile: cleanPhoneNumber,
          otp: otp
        }
      });

      console.log('MSG91 Verify Response:', response.data);

      if (response.data.type === 'success') {
        return {
          success: true,
          message: 'OTP verified successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Invalid OTP'
        };
      }

    } catch (error) {
      console.error('MSG91 Verify Error:', error.response?.data || error.message);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'OTP verification failed'
      };
    }
  }

  /**
   * Resend OTP using MSG91
   * @param {string} phoneNumber - Phone number with country code
   * @returns {Promise<{success: boolean, message: string, data?: any}>}
   */
  async resendOTP(phoneNumber) {
    try {
      if (!this.authKey) {
        throw new Error('MSG91 auth key not configured');
      }

      // Remove + from phone number if present
      const cleanPhoneNumber = phoneNumber.replace('+', '');
      
      const response = await axios.get(`${this.baseUrl}/otp/retry`, {
        params: {
          authkey: this.authKey,
          mobile: cleanPhoneNumber,
          retrytype: 'text' // Can be 'text' or 'voice'
        }
      });

      console.log('MSG91 Resend Response:', response.data);

      if (response.data.type === 'success') {
        return {
          success: true,
          message: 'OTP resent successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to resend OTP'
        };
      }

    } catch (error) {
      console.error('MSG91 Resend Error:', error.response?.data || error.message);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to resend OTP'
      };
    }
  }
}

module.exports = new MSG91Service();