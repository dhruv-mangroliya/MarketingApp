import { useState, useEffect } from "react";
import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import GoogleLoginButton from "../../GoogleLoginButton";
import RefundTracker from "../../RefundTracker";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRefundTracker, setShowRefundTracker] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const isAdmin = user?.email === 'dhruvmangroliya642@gmail.com';

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <img 
            src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/logo.png" 
            alt="Logo" 
            className="logo-img" 
            onClick={() => navigate('/')}
          />
        </div>
        <div className="nav-links brand" onClick={() => navigate('/')}>
            <div className="brand-name">KurtiBazaar</div>
            <div className="brand-tagline">Shop with confidence</div>
        </div>
        {/* Desktop Icons */}
        <div className="nav-links-icons">
            <img 
              src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/home.png" 
              alt="Home" 
              onClick={() => navigate('/')}
            />
            <img 
              src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/cart.png" 
              alt="Cart" 
              onClick={() => navigate('/cart')} 
            />
            <img 
              src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/person.png" 
              alt="About" 
              onClick={() => navigate('/about')}
            />
            <img 
              src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/support.png" 
              alt="Contact"  
              onClick={() => navigate('/contact')}
            />
            
            {/* Track Refund Button */}
            <button 
              className="track-refund-btn"
              onClick={() => setShowRefundTracker(true)}
              title="Track Refund"
            >
              📋
            </button>
            
            {/* Login Button */}
            <button 
              className="login-btn"
              onClick={() => setShowLoginModal(true)}
            >
              Login
            </button>
            
            {isAdmin && (
              <button 
                className="admin-btn"
                onClick={() => navigate('/admin')}
              >
                Admin
              </button>
            )}
        </div>

        {!isOpen && (
          <div className="hamburger" onClick={() => setIsOpen(true)}>
            <img 
              src="https://kurtibazaar-images.s3.ap-south-1.amazonaws.com/products/hamburger.png" 
              alt="menu" 
            />
          </div>
        )}
      </nav>

      {/* Fullscreen Mobile Slider */}
      <div className={`mobile-menu-full ${isOpen ? "open" : ""}`}>
        <div className="menu-header">
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            x
          </button>
        </div>

        <ul className="menu-links">
          {isAdmin && (
            <li onClick={() => { setIsOpen(false); navigate("/admin"); }}>Admin Management</li>
          )}
          {/* Mobile Login */}
          <li onClick={() => { setIsOpen(false); setShowLoginModal(true); }}>Login</li>
          <li onClick={() => { setIsOpen(false); navigate("/cart"); }}>Your Cart</li>
          <li onClick={() => { setIsOpen(false); setShowRefundTracker(true); }}>Track Refund</li>
          <li onClick={() => { setIsOpen(false); navigate("/"); }}>Home</li>
          <li onClick={() => { setIsOpen(false); navigate("/blog"); }}>Blog</li>
          <li onClick={() => { setIsOpen(false); navigate("/about"); }}>About Us</li>
          
          
          <li onClick={() => { setIsOpen(false); navigate("/shipping-policy")}}>Shipping Policy</li>
          <li onClick={() => { setIsOpen(false); navigate("/return-exchange")}}>Return & Exchange</li>
          <li onClick={() => { setIsOpen(false); navigate("/terms")}}>Terms & Conditions</li>
          <li onClick={() => { setIsOpen(false); navigate("/privacy-policy")}}>Privacy Policy</li>
          <li onClick={() => { setIsOpen(false); navigate("/contact"); }}>Contact</li>
        </ul>
      </div>
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-header">
              <h3>Login to KurtiBazaar</h3>
              <button className="close-modal-btn" onClick={() => setShowLoginModal(false)}>×</button>
            </div>
            <div className="login-modal-content">
              {isAuthenticated ? (
                <div className="already-logged-in">
                  <p>✅ You are already logged in!</p>
                  <p>Welcome back, {user?.name}</p>
                  <button 
                    className="continue-btn"
                    onClick={() => setShowLoginModal(false)}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <GoogleLoginButton onSuccess={() => setShowLoginModal(false)} />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Refund Tracker Modal */}
      <RefundTracker 
        isOpen={showRefundTracker} 
        onClose={() => setShowRefundTracker(false)} 
      />
    </>
  );
};
export default Navbar;