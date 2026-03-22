import React, { useState } from "react";
import "./Footer.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("OTP sent to your email! Check your inbox.");
        setShowOTPInput(true);
      } else {
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error('OTP send error:', error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSubscribe = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      // First verify OTP
      const verifyResponse = await fetch('http://localhost:5001/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const verifyResult = await verifyResponse.json();
      
      if (!verifyResult.success) {
        toast.error(verifyResult.message || "Invalid OTP");
        return;
      }

      // Then subscribe to newsletter
      const subscribeResponse = await fetch('http://localhost:5001/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const subscribeResult = await subscribeResponse.json();
      
      if (subscribeResult.success) {
        toast.success("Successfully subscribed to newsletter! 🎉");
        setEmail("");
        setOtp("");
        setShowOTPInput(false);
      } else {
        toast.error(subscribeResult.message || "Failed to subscribe");
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setShowOTPInput(false);
    setOtp("");
  };


  return (
    <footer className="footer">

      <div className="footer-container">

        {/* About */}
        <div className="footer-column">
          <h3>About Us</h3>
          <p>
            At KurtiBazaar, we believe every woman deserves to look graceful,
            confident, and stylish — whether it’s a casual day out or a festive occasion.
          </p>

          <p><strong>Phone:</strong> +91 9876543210</p>
          <p><strong>Email:</strong> support@kurtibazaar.com</p>

          <div className="social-icons">
            <div className="icon">
              <img 
                src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/communication.png" 
                alt="Facebook" 
              />
            </div>
            <div className="icon">
              <img 
                src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/instagram.png" 
                alt="Instagram" 
              />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h3>Quick Links</h3>
          <ul>
            <li onClick={() => navigate("/about")}>About Us</li>
            <li onClick={() => navigate("/contact")}>Contact Us</li>
            <li onClick={() => navigate("/shipping-policy")}>Shipping Policy</li>
            <li onClick={() => navigate("/return-exchange")}>Return & Exchange</li>
            <li onClick={() => navigate("/terms")}>Terms & Conditions</li>
            <li onClick={() => navigate("/privacy-policy")}>Privacy Policy</li>
          </ul>

        </div>

        {/* Newsletter */}
        <div className="footer-column">
          <h3>Sign Up to Newsletter</h3>
          <p>Sign up for latest updates</p>

          {!showOTPInput ? (
            <form className="newsletter" onSubmit={handleSendOTP}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form className="newsletter" onSubmit={handleVerifyAndSubscribe}>
              <p className="otp-info">OTP sent to {email}</p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Subscribe'}
              </button>
              <button type="button" onClick={handleBackToEmail} className="back-btn">
                Change Email
              </button>
            </form>
          )}

          <p>For latest offers and new features</p>
        </div>

      </div>

      <div className="footer-bottom">
        © 2026 KurtiBazaar. All rights reserved.
      </div>

    </footer>
  );
};

export default Footer;
