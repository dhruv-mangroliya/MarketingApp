import { useState, useEffect } from "react";
import "./Navbar.css";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

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
          <li onClick={() => { setIsOpen(false); navigate("/"); }}>Home</li>
          <li onClick={() => { setIsOpen(false); navigate("/cart"); }}>Your Cart</li>
          <li onClick={() => { setIsOpen(false); navigate("/blog"); }}>Blog</li>
          <li onClick={() => { setIsOpen(false); navigate("/about"); }}>About Us</li>
          <li onClick={() => { setIsOpen(false); navigate("/shipping-policy")}}>Shipping Policy</li>
          <li onClick={() => { setIsOpen(false); navigate("/return-exchange")}}>Return & Exchange</li>
          <li onClick={() => { setIsOpen(false); navigate("/terms")}}>Terms & Conditions</li>
          <li onClick={() => { setIsOpen(false); navigate("/privacy-policy")}}>Privacy Policy</li>
          <li onClick={() => { setIsOpen(false); navigate("/contact"); }}>Contact</li>
        </ul>
      </div>
    </>
  );
};
export default Navbar;