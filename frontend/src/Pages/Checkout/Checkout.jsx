import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./Checkout.css";
import GoogleLoginButton from "../../components/GoogleLoginButton";
import PhoneVerificationModal from "../../components/PhoneVerificationModal";
import OrderSummary from "../../components/OrderSummary";
import { createPaymentOrder, verifyPayment } from "../../utils/api";

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    pincode: ""
  });
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Login, 2: Phone, 3: Payment

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || ""
      }));
      setCurrentStep(2);
    }
  }, [isAuthenticated, user]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.discountPrice * item.quantity, 0);
  const discount = subtotal - total;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleLoginSuccess = () => {
    setCurrentStep(2);
    toast.success("Login successful! Please verify your phone number.");
  };

  const handlePhoneVerified = (phoneNumber) => {
    setVerifiedPhone(phoneNumber);
    setShowPhoneModal(false);
    setCurrentStep(3);
    toast.success("Phone verified! You can now place your order.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("Please login with Google first!");
      return;
    }

    if (!verifiedPhone) {
      toast.error("Please verify your phone number first!");
      setShowPhoneModal(true);
      return;
    }
    
    // Check if all fields are filled
    const allFieldsFilled = Object.values(formData).every(field => field.trim() !== "");
    
    if (!allFieldsFilled) {
      toast.error("Please fill all shipping details!");
      return;
    }
    
    initiatePayment();
  };

  const initiatePayment = async () => {
    try {
      const orderData = await createPaymentOrder(total);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'KurtiBazaar',
        description: 'Order Payment',
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            // Create order after successful payment
            await createOrder({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id
            });
            
          } catch (error) {
            toast.error("Payment verification failed!");
          }
        },
        modal: {
          ondismiss: function() {
            toast.info("Payment cancelled");
          }
        },
        prefill: {
          name: formData.name,
          email: user?.email,
          contact: verifiedPhone
        },
        theme: {
          color: '#242f66'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.");
    }
  };

  const createOrder = async (paymentDetails) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5001/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          items: cart,
          totalAmount: total,
          shippingAddress: {
            name: formData.name,
            address: formData.address,
            city: formData.city,
            pincode: formData.pincode
          },
          phoneNumber: verifiedPhone,
          paymentDetails
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Only clear cart after successful order creation
        clearCart();
        setCompletedOrder(data.order);
        setShowOrderSummary(true);
        toast.success("Order placed successfully!");
      } else {
        toast.error(data.message || "Failed to create order");
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error("Failed to create order. Please contact support with your payment details.");
    }
  };

  const handleOrderSummaryClose = () => {
    setShowOrderSummary(false);
    navigate("/");
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      
      {/* Progress Steps */}
      <div className="checkout-steps">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${isAuthenticated ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Login</span>
        </div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${verifiedPhone ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Phone Verification</span>
        </div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Payment</span>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-container">
          {!isAuthenticated ? (
            <div className="login-section">
              <h2>Login to Continue</h2>
              <p>Please login with Google to place your order</p>
              <GoogleLoginButton onSuccess={handleGoogleLoginSuccess} />
            </div>
          ) : (
            <form className="checkout-form" onSubmit={handleSubmit}>
              <div className="user-info">
                <h2>Welcome, {user?.name}!</h2>
                <p>Email: {user?.email}</p>
                {verifiedPhone && <p>Phone: {verifiedPhone}</p>}
                {!verifiedPhone && (
                  <button 
                    type="button" 
                    onClick={() => setShowPhoneModal(true)}
                    className="verify-phone-btn"
                  >
                    Verify Phone Number
                  </button>
                )}
              </div>
              
              <h2>Shipping Details</h2>
              <input 
                type="text" 
                name="name" 
                placeholder="Full Name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
              <textarea 
                name="address" 
                placeholder="Address" 
                value={formData.address} 
                onChange={handleChange} 
                required 
              />
              <input 
                type="text" 
                name="city" 
                placeholder="City" 
                value={formData.city} 
                onChange={handleChange} 
                required 
              />
              <input 
                type="text" 
                name="pincode" 
                placeholder="Pincode" 
                value={formData.pincode} 
                onChange={handleChange} 
                required 
              />
              
              <button 
                type="submit" 
                className="place-order-btn"
                disabled={!verifiedPhone}
              >
                {!verifiedPhone ? 'Verify Phone to Continue' : 'Place Order & Pay'}
              </button>
            </form>
          )}
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          {cart.map((item) => (
            <div key={`${item.id}-${item.size}`} className="summary-item">
              <img src={item.image} alt={item.name} className="summary-item-image" />
              <div className="summary-item-details">
                <span className="item-name">{item.name}</span>
                {item.size && <span className="item-size">Size: {item.size}</span>}
                <span className="item-quantity">Qty: {item.quantity}</span>
              </div>
              <span className="item-total">₹{item.discountPrice * item.quantity}</span>
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

      <PhoneVerificationModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onVerified={handlePhoneVerified}
      />

      <OrderSummary
        order={completedOrder}
        onClose={handleOrderSummaryClose}
      />
    </div>
  );
};

export default Checkout;
