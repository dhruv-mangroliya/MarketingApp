import { useState, useEffect } from "react";
import "../CSS/Navbar.css";
import hamburgerIcon from "../../public/assets/hamburger.png";
import about from "../../public/assets/person.png";
import cart from "../../public/assets/cart.png";
import contact from "../../public/assets/support.png";
import logo from "../../public/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
  }, [isOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="logo"><img src={logo} alt="Logo" className="logo-img"/></div>
        <div className="nav-links brand">
            <div className="brand-name">KurtiBazaar</div>
            <div className="brand-tagline">Shop with confidence</div>
        </div>
        {/* Desktop Icons */}
        <div className="nav-links-icons">
            <img src={about} alt="About" />
            <img src={cart} alt="Cart" />
            <img src={contact} alt="Contact" />
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
          <li onClick={() => setIsOpen(false)}>About Us</li>
          <li onClick={() => setIsOpen(false)}>Your Cart</li>
          <li onClick={() => setIsOpen(false)}>Contact</li>
        </ul>
      </div>
    </>
  );
};
export default Navbar;