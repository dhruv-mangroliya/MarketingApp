import React, { useState } from "react";
import "./Footer.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import VerifyPhoneModal from "../../common/Modal/VerifyPhoneModal";
import VerifySMSOTPModal from "../../common/Modal/VerifySMSOTPModal";
import { sendSMSOTP, verifySMSOTP } from "../../../utils/api";

const Footer = () => {
  const navigate = useNavigate();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const handleRegister = () => {
    setShowPhoneModal(true);
  };

  const handlePhoneVerify = async (phone) => {
    try {
      await sendSMSOTP(phone);
      setVerifiedPhone(phone);
      setShowPhoneModal(false);
      setShowOTPModal(true);
      toast.success("OTP sent to your phone!");
    } catch (error) {
      // Handle rate limiting
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        toast.error(`${errorData.error || 'Too many SMS requests'}\n Please try again after ${errorData.retryAfter || '15 minutes'}`, {
          autoClose: 8000,
          style: { whiteSpace: 'pre-line' }
        });
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    }
  };

  const handleOTPVerify = async (otp) => {
    try {
      await verifySMSOTP(verifiedPhone, otp);
      setShowOTPModal(false);
      toast.success("Successfully registered for offers 🎉");
    } catch (error) {
      toast.error("Invalid OTP. Please try again.");
    }
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

          <div className="newsletter">
            <button onClick={handleRegister}>
              Register For Offers
            </button>
          </div>

          <p>For latest offers and new features</p>
        </div>

      </div>

      <div className="footer-bottom">
        © 2026 KurtiBazaar. All rights reserved.
      </div>

      <VerifyPhoneModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onVerify={handlePhoneVerify}
      />

      <VerifySMSOTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleOTPVerify}
        phone={verifiedPhone}
      />

    </footer>
  );
};

export default Footer;
