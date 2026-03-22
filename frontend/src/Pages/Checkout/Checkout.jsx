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
    state: "",
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
    
    // Check inventory BEFORE payment
    checkInventoryAndProceed();
  };

  const checkInventoryAndProceed = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Map cart items for inventory check
      const mappedItems = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        size: item.size,
        price: item.discountPrice,
        image: item.image
      }));
      
      // Check inventory availability BEFORE payment
      const response = await fetch('http://localhost:5001/api/inventory-validation/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: mappedItems
        })
      });

      const data = await response.json();
      
      if (data.success && data.available) {
        // All items available - proceed with payment
        initiatePayment();
      } else {
        // Stock shortage - show error WITHOUT processing payment
        const shortage = data.shortages[0]; // First shortage item
        toast.error(
          `😔 Stock Shortage Alert\n` +
          `Product: ${shortage.productName}\n` +
          `Size: ${shortage.size}\n` +
          `You requested: ${shortage.requested} items\n` +
          `Available: ${shortage.available} items\n\n` +
          `Please reduce quantity or try a different size.`,
          { 
            autoClose: 10000,
            style: { whiteSpace: 'pre-line', fontSize: '14px' }
          }
        );
      }
      
    } catch (error) {
      console.error('Error checking inventory:', error);
      toast.error("Failed to check inventory. Please try again.");
    }
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
      // Handle rate limiting for payment
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        toast.error(`🚫 ${errorData.error || 'Too many payment attempts'}\n⏰ Please try again after ${errorData.retryAfter || '5 minutes'}`, {
          autoClose: 8000,
          style: { whiteSpace: 'pre-line' }
        });
      } else {
        toast.error("Failed to initiate payment. Please try again.");
      }
    }
  };

  const createOrder = async (paymentDetails) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Map cart items to the format expected by backend
      const mappedItems = cart.map(item => ({
        productId: item.id, // cart uses 'id', backend expects 'productId'
        productName: item.name, // cart uses 'name', backend expects 'productName'
        quantity: item.quantity,
        size: item.size,
        price: item.discountPrice, // Use discountPrice as the actual price
        image: item.image // Add image URL to order items
      }));
      
      const response = await fetch('http://localhost:5001/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userEmail: user.email, // Use email instead of user.id
          items: mappedItems, // Use mapped items instead of cart directly
          totalAmount: total,
          shippingAddress: {
            name: formData.name,
            phone: verifiedPhone, // Add phone to shipping address
            address: formData.address,
            city: formData.city,
            state: formData.state || 'N/A', // Add state field
            pincode: formData.pincode
          },
          phoneNumber: verifiedPhone,
          paymentDetails: {
            razorpayOrderId: paymentDetails.razorpay_order_id,
            razorpayPaymentId: paymentDetails.razorpay_payment_id,
            razorpaySignature: paymentDetails.razorpay_signature,
            paymentStatus: 'captured',
            paymentMethod: 'card' // You can detect this from Razorpay response
          }
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
        console.error('Order creation failed:', data);
        
        // Check if this is a stock shortage scenario
        if (data.stockShortage) {
          // Check if refund was processed
          if (data.refund) {
            toast.error(
              `❌ Payment Refunded - Stock Shortage\n` +
              `Product: ${data.productName}\n` +
              `Size: ${data.size}\n` +
              `You requested: ${data.requested} items\n` +
              `Available: ${data.available} items\n\n` +
              `💰 Refund ID: ${data.refund.id}\n` +
              `Amount: ₹${data.refund.amount}\n` +
              `Processing Time: ${data.refund.estimatedProcessingTime}\n\n` +
              `📧 Refund details sent to your email.\n` +
              `You can track your refund in the Cart section.`,
              { 
                autoClose: 15000,
                style: { whiteSpace: 'pre-line', fontSize: '14px' }
              }
            );
            
            // Send refund notification email
            try {
              await fetch('http://localhost:5001/api/refunds/send-notification', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                  email: user.email,
                  refund: data.refund,
                  orderId: 'STOCK_SHORTAGE'
                })
              });
            } catch (emailError) {
              console.error('Failed to send refund email:', emailError);
            }
          } else {
            toast.error(
              `😔 Stock Shortage Alert\n` +
              `Product: ${data.productName}\n` +
              `Size: ${data.size}\n` +
              `You requested: ${data.requested} items\n` +
              `Available: ${data.available} items\n\n` +
              `📧 Stock shortage details sent to your email.\n` +
              `Please reduce quantity or try a different size.`,
              { 
                autoClose: 10000,
                style: { whiteSpace: 'pre-line', fontSize: '14px' }
              }
            );
          }
        }
        // Check if this is a refund scenario (inventory failure after payment)
        else if (data.refund) {
          toast.error(
            `❌ Order Failed - Payment Refunded\n` +
            `Refund ID: ${data.refund.id}\n` +
            `Amount: ₹${data.refund.amount}\n` +
            `Status: ${data.refund.status}\n` +
            `Processing Time: ${data.refund.estimatedProcessingTime}\n\n` +
            `📧 Refund details sent to your email.\n` +
            `You can track your refund in the Cart section.`,
            { 
              autoClose: 12000,
              style: { whiteSpace: 'pre-line', fontSize: '14px' }
            }
          );
          
          // Send refund notification email
          try {
            await fetch('http://localhost:5001/api/refunds/send-notification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify({
                email: user.email,
                refund: data.refund,
                orderId: 'FAILED_ORDER'
              })
            });
          } catch (emailError) {
            console.error('Failed to send refund email:', emailError);
          }
        } else {
          toast.error(data.message || "Failed to create order");
        }
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
                name="state" 
                placeholder="State (e.g., Maharashtra, Delhi)" 
                value={formData.state} 
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
