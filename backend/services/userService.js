const User = require('../models/User');

class UserService {
  /**
   * Get user's phone number by email
   * @param {string} email - User's email
   * @returns {Promise<{success: boolean, phoneNumber?: string, phoneVerified?: boolean, message?: string}>}
   */
  async getUserPhoneByEmail(email) {
    try {
      const user = await User.findOne({ email }, 'phoneNumber phoneVerified');
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (!user.phoneNumber) {
        return {
          success: false,
          message: 'Phone number not linked to this account'
        };
      }

      if (!user.phoneVerified) {
        return {
          success: false,
          message: 'Phone number not verified'
        };
      }

      return {
        success: true,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified
      };
    } catch (error) {
      console.error('Error fetching user phone:', error);
      return {
        success: false,
        message: 'Error fetching phone number'
      };
    }
  }

  /**
   * Check if user has verified phone number
   * @param {string} email - User's email
   * @returns {Promise<boolean>}
   */
  async hasVerifiedPhone(email) {
    try {
      const user = await User.findOne({ 
        email, 
        phoneNumber: { $exists: true, $ne: null },
        phoneVerified: true 
      });
      
      return !!user;
    } catch (error) {
      console.error('Error checking verified phone:', error);
      return false;
    }
  }

  /**
   * Get user details including phone info
   * @param {string} email - User's email
   * @returns {Promise<{success: boolean, user?: object, message?: string}>}
   */
  async getUserWithPhone(email) {
    try {
      const user = await User.findOne({ email }, 'name email phoneNumber phoneVerified phoneVerifiedAt');
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      return {
        success: true,
        user: {
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneVerified: user.phoneVerified,
          phoneVerifiedAt: user.phoneVerifiedAt,
          hasPhone: !!user.phoneNumber && user.phoneVerified
        }
      };
    } catch (error) {
      console.error('Error fetching user with phone:', error);
      return {
        success: false,
        message: 'Error fetching user details'
      };
    }
  }
}

module.exports = new UserService();