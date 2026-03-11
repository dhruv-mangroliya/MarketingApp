import React, { useState } from "react";
import "./Footer.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleRegister = () => {
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    if (!email.includes("@")) {
      toast.warning("Please enter a valid email address.");
      return;
    }

    toast.success("Successfully registered for offers 🎉");
    setEmail("");
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
            <div className="icon"><img src="/assets/communication.png" alt="Facebook" /></div>
            <div className="icon"><img src="/assets/instagram.png" alt="Instagram" /></div>
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
            <input
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

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

    </footer>
  );
};

export default Footer;
