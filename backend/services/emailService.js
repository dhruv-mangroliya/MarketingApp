const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class EmailService {
  /**
   * Send refund notification email to user
   * @param {string} userEmail - User's email address
   * @param {object} refundDetails - Refund details
   * @param {string} orderId - Order ID that failed
   */
  async sendRefundNotification(userEmail, refundDetails, orderId) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Refund Processed - KurtiBazaar Order Failed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #dc3545; margin-top: 0;">Order Failed - Refund Processed</h2>
              
              <p>Dear Customer,</p>
              
              <p>We're sorry to inform you that your order <strong>${orderId}</strong> could not be processed due to a technical issue. However, we have automatically initiated a full refund for your payment.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #28a745; margin-top: 0;">Refund Details</h3>
                <p><strong>Refund ID:</strong> <code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px;">${refundDetails.id}</code></p>
                <p><strong>Amount:</strong> ₹${refundDetails.amount}</p>
                <p><strong>Status:</strong> ${refundDetails.status}</p>
                <p><strong>Initiated:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
              </div>
              
              <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #0c5460; margin-top: 0;">What happens next?</h4>
                <ul style="color: #0c5460;">
                  <li>Your refund will be processed within 5-7 business days</li>
                  <li>The amount will be credited to your original payment method</li>
                  <li>You can track your refund status using the Refund ID above</li>
                  <li>No action is required from your side</li>
                </ul>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">Track Your Refund</h4>
                <p style="color: #856404;">Visit our website and use the "Track Refund" option with your Refund ID: <strong>${refundDetails.id}</strong></p>
              </div>
              
              <p>We apologize for any inconvenience caused. If you have any questions or concerns, please contact our support team.</p>
              
              <p>Thank you for choosing KurtiBazaar!</p>
              
              <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">
                This is an automated email. Please do not reply to this email.<br>
                For support, contact us at support@kurtibazaar.com
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Refund notification email sent to ${userEmail}`);
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to send refund email to ${userEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order confirmation email to user
   * @param {string} userEmail - User's email address
   * @param {object} orderDetails - Order details
   */
  async sendOrderConfirmation(userEmail, orderDetails) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `✅ Order Confirmed - ${orderDetails.id} | KurtiBazaar`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">📋 Order Details</h2>
              
              <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
                <p style="margin: 0; color: #155724;"><strong>Order ID:</strong> <code style="background: #c3e6cb; padding: 4px 8px; border-radius: 4px;">${orderDetails.id}</code></p>
                <p style="margin: 5px 0; color: #155724;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                <p style="margin: 5px 0; color: #155724;"><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
                <p style="margin: 5px 0; color: #155724;"><strong>Payment Status:</strong> ${orderDetails.paymentStatus}</p>
                <p style="margin: 5px 0; color: #155724;"><strong>Order Status:</strong> ${orderDetails.status}</p>
              </div>
              
              <h3 style="color: #333; margin: 25px 0 15px 0;">🛍️ Items Ordered:</h3>
              ${orderDetails.items.map(item => `
                <div style="border: 1px solid #e1e5e9; padding: 15px; margin: 10px 0; border-radius: 8px; background: #f8f9fa;">
                  <p style="margin: 0; font-weight: bold; color: #333;">${item.productName}</p>
                  <p style="margin: 5px 0; color: #666; font-size: 14px;">Size: ${item.size} | Quantity: ${item.quantity} | Price: ₹${item.price}</p>
                  <p style="margin: 5px 0 0 0; color: #28a745; font-weight: bold;">Subtotal: ₹${item.quantity * item.price}</p>
                </div>
              `).join('')}
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">📦 Shipping Information</h2>
              
              <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 20px 0;">
                <p style="margin: 0; color: #0c5460;"><strong>Delivery Address:</strong></p>
                <p style="margin: 5px 0; color: #0c5460;">${orderDetails.shippingAddress.name}</p>
                <p style="margin: 5px 0; color: #0c5460;">${orderDetails.shippingAddress.address}</p>
                <p style="margin: 5px 0; color: #0c5460;">${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} - ${orderDetails.shippingAddress.pincode}</p>
                <p style="margin: 5px 0; color: #0c5460;">Phone: ${orderDetails.shippingAddress.phone}</p>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">📅 Expected Delivery</h4>
                <p style="color: #856404; margin: 0;">Your order will be delivered within <strong>5-7 business days</strong></p>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
              <p>This is an automated confirmation email. Please save this for your records.</p>
              <p style="margin: 10px 0 0 0;">© 2024 KurtiBazaar. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Order confirmation email sent to ${userEmail}`);
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to send order confirmation email to ${userEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order failure notification without refund (for cases where payment wasn't processed)
   * @param {string} userEmail - User's email address
   * @param {string} orderId - Order ID that failed
   * @param {string} reason - Reason for failure
   */
  async sendOrderFailureNotification(userEmail, orderId, reason) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Order Failed - KurtiBazaar',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #dc3545; margin-top: 0;">Order Failed</h2>
              
              <p>Dear Customer,</p>
              
              <p>We're sorry to inform you that your order <strong>${orderId}</strong> could not be processed.</p>
              
              <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p style="color: #721c24; margin: 0;"><strong>Reason:</strong> ${reason}</p>
              </div>
              
              <p>Since no payment was processed, no refund is required. You can try placing the order again.</p>
              
              <p>We apologize for any inconvenience caused.</p>
              
              <p>Thank you for choosing KurtiBazaar!</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Order failure notification sent to ${userEmail}`);
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to send order failure email to ${userEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }
  /**
   * Send stock shortage notification
   * @param {string} userEmail - User email
   * @param {object} stockInfo - Stock shortage information
   */
  async sendStockShortageNotification(userEmail, stockInfo) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `😔 Stock Shortage - ${stockInfo.productName} | KurtiBazaar`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a52); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">😔 Stock Shortage</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">We're sorry, but the item you wanted is currently out of stock</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">📋 Stock Details</h2>
              
              <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
                <p style="margin: 0; color: #333;"><strong>Product:</strong> ${stockInfo.productName}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Size:</strong> ${stockInfo.size}</p>
                <p style="margin: 5px 0; color: #333;"><strong>You Requested:</strong> ${stockInfo.requested} items</p>
                <p style="margin: 5px 0; color: #333;"><strong>Available Stock:</strong> ${stockInfo.available} items</p>
              </div>
              
              <h3 style="color: #333; margin: 25px 0 15px 0;">📝 Your Cart Items:</h3>
              ${stockInfo.items.map(item => `
                <div style="border: 1px solid #eee; padding: 15px; margin: 10px 0; border-radius: 8px; background: #fafafa;">
                  <p style="margin: 0; font-weight: bold; color: #333;">${item.productName}</p>
                  <p style="margin: 5px 0; color: #666; font-size: 14px;">Size: ${item.size} | Quantity: ${item.quantity} | Price: ₹${item.price}</p>
                </div>
              `).join('')}
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">🔄 What You Can Do</h2>
              
              <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4a72ff; margin: 20px 0;">
                <p style="margin: 0; color: #333;"><strong>1. Reduce Quantity:</strong> Try ordering ${stockInfo.available} items instead</p>
                <p style="margin: 10px 0; color: #333;"><strong>2. Choose Different Size:</strong> Check if other sizes are available</p>
                <p style="margin: 10px 0; color: #333;"><strong>3. Wait for Restock:</strong> We'll notify you when it's back in stock</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>4. Browse Similar:</strong> Check our other amazing products</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://kurtibazaar.com" style="background: linear-gradient(135deg, #4a72ff, #6c5ce7); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(74, 114, 255, 0.3);">
                  🛍️ Continue Shopping
                </a>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
              <p>Need help? Contact us at <a href="mailto:support@kurtibazaar.com" style="color: #4a72ff;">support@kurtibazaar.com</a></p>
              <p style="margin: 10px 0 0 0;">© 2024 KurtiBazaar. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Stock shortage notification sent to ${userEmail}`);
      
    } catch (error) {
      console.error('Error sending stock shortage notification:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();