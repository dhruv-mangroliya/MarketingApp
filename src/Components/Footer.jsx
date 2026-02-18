import React from "react";
import "../CSS/Footer.css";

const Footer = () => {
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
            <li>About Us</li>
            <li>Contact Us</li>
            <li>Shipping Policy</li>
            <li>Return & Exchange</li>
            <li>Terms & Conditions</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        {/* Information */}
        <div className="footer-column">
          <h3>Information</h3>
          <ul>
            <li>Home</li>
            <li>New Arrivals</li>
            <li>Ready To Wear</li>
            <li>Wedding Edits</li>
            <li>Best Sellers</li>
            <li>Pre Fall</li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-column">
          <h3>Sign Up to Newsletter</h3>
          <p>Sign up for latest updates</p>

          <div className="newsletter">
            <input type="email" placeholder="Enter your email..." />
            <button>Sign Up</button>
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
