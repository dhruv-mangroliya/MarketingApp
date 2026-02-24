import { useState, useEffect } from "react";
import "../CSS/Navbar.css";
import hamburgerIcon from "../../public/assets/hamburger.png";
import about from "../../public/assets/person.png";
import cart from "../../public/assets/cart.png";
import contact from "../../public/assets/support.png";
import logo from "../../public/assets/logo.png";
import { useNavigate } from "react-router-dom";
import home from "../../public/assets/home.png"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="navbar">
        <div className="logo"><img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/')}/></div>
        <div className="nav-links brand" onClick={() => navigate('/')}>
            <div className="brand-name">KurtiBazaar</div>
            <div className="brand-tagline">Shop with confidence</div>
        </div>
        {/* Desktop Icons */}
        <div className="nav-links-icons">
            <img src={home} alt="Home" onClick={() => navigate('/')}/>
            <img src={cart} alt="Cart" onClick={() => navigate('/cart')} />
            <img src={about} alt="About" onClick={() => navigate('/about')}/>
            <img src={contact} alt="Contact"  onClick={() => navigate('/contact')}/>
        </div>

        

        {!isOpen && (
          <div className="hamburger" onClick={() => setIsOpen(true)}>
            <img src={hamburgerIcon} alt="menu" />
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