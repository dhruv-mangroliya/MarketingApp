import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Cart.css";

const Cart = () => {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.discountPrice * item.quantity, 0);
  const discount = subtotal - total;

  const handleRemove = (id, name) => {
    removeFromCart(id);
    toast.success(`${name} removed from cart!`);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your Cart is Empty</h2>
        <p>Add some products to get started!</p>
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
              <img src={item.image} alt={item.name} />
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
          <button className="payment-btn" onClick={() => navigate("/checkout")}>
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;