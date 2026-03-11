import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import "./Checkout.css";
import VerifyEmailModal from "../../components/common/Modal/VerifyEmailModal";
import VerifyOTPModal from "../../components/common/Modal/VerifyOTPModal";
import { sendOTP, verifyOTP } from "../../utils/api";

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: ""
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.discountPrice * item.quantity, 0);
  const discount = subtotal - total;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if all fields are filled
    const allFieldsFilled = Object.values(formData).every(field => field.trim() !== "");
    
    if (!allFieldsFilled) {
      toast.error("Please fill all fields!");
      return;
    }
    
    // Open email verification modal
    setShowEmailModal(true);
  };

  const handleEmailVerify = async (email) => {
    try {
      await sendOTP(email);
      setVerifiedEmail(email);
      setShowEmailModal(false);
      setShowOTPModal(true);
      toast.success("OTP sent to your email!");
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const handleOTPVerify = async (otp) => {
    try {
      await verifyOTP(verifiedEmail, otp);
      console.log("User email is right:", verifiedEmail);
      setShowOTPModal(false);
      toast.success("Email verified! Order placed successfully!");
      clearCart();
      navigate("/");
    } catch (error) {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-content">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Details</h2>
          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
          <textarea name="address" placeholder="Address" value={formData.address} onChange={handleChange} required />
          <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} required />
          <input type="text" name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleChange} required />
          <button type="submit" className="place-order-btn">Place Order</button>
        </form>

        <div className="order-summary">
          <h2>Order Summary</h2>
          {cart.map((item) => (
            <div key={item.id} className="summary-item">
              <span>{item.name} x {item.quantity}</span>
              <span>₹{item.discountPrice * item.quantity}</span>
            </div>
          ))}
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="summary-row discount">
            <span>Discount:</span>
            <span>-₹{discount}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>

      <VerifyEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onVerify={handleEmailVerify}
        userEmail={formData.email}
      />

      <VerifyOTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleOTPVerify}
        email={verifiedEmail}
      />
    </div>
  );
};

export default Checkout;
