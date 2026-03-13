import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import OrderHistory from "../../components/OrderHistory";
import "./Cart.css";

const Cart = () => {
  const { cart, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.discountPrice * item.quantity, 0);
  const discount = subtotal - total;

  const handleRemove = (id, name) => {
    removeFromCart(id);
    toast.success(`${name} removed from cart!`);
  };

  const handleViewOrderHistory = () => {
    if (!isAuthenticated) {
      toast.info("Please login to view your order history");
      return;
    }
    setShowOrderHistory(true);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-content">
          <div className="empty-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Add some products to get started!</p>
          <div className="empty-actions">
            <button className="continue-shopping" onClick={() => navigate("/")}>
              Continue Shopping
            </button>
            {isAuthenticated && (
              <button className="view-orders-btn" onClick={handleViewOrderHistory}>
                View Order History
              </button>
            )}
          </div>
        </div>
        
        <OrderHistory 
          isOpen={showOrderHistory} 
          onClose={() => setShowOrderHistory(false)} 
        />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      <div className="cart-content">
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} loading="lazy" />
              <div className="item-details">
                <div className="item-name">
                  <h3>{item.name}</h3>
                  {item.size && <p className="item-size">Size: {item.size}</p>}
                </div>
                <div className="item-price">
                  <p>₹{item.discountPrice}</p>
                </div>
                <div className="item-quantity">
                  <p>Qty: {item.quantity}</p>
                </div>
                <div className="item-total">
                  <p>₹{item.discountPrice * item.quantity}</p>
                </div>
                <button className="remove-btn" onClick={() => handleRemove(item.id, item.name)}>×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <h2>Order Summary</h2>
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
          <div className="cart-actions">
            <button className="payment-btn" onClick={() => navigate("/checkout")}>
              Proceed to Payment
            </button>
            {isAuthenticated && (
              <button className="order-history-btn" onClick={handleViewOrderHistory}>
                View Order History
              </button>
            )}
          </div>
        </div>
      </div>
      
      <OrderHistory 
        isOpen={showOrderHistory} 
        onClose={() => setShowOrderHistory(false)} 
      />
    </div>
  );
};

export default Cart;