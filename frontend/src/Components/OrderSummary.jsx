import React from 'react';
import './OrderSummary.css';

const OrderSummary = ({ order, onClose }) => {
  if (!order) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="order-summary-modal">
        <div className="success-header">
          <div className="success-icon">✓</div>
          <h2>Order Confirmed!</h2>
          <p>Thank you for your purchase</p>
        </div>

        <div className="order-details">
          <div className="order-info">
            <div className="info-row">
              <span className="label">Order ID:</span>
              <span className="value">{order.orderId}</span>
            </div>
            <div className="info-row">
              <span className="label">Order Date:</span>
              <span className="value">{formatDate(order.orderDate)}</span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className="value status-confirmed">{order.status}</span>
            </div>
            <div className="info-row">
              <span className="label">Estimated Delivery:</span>
              <span className="value">{formatDate(order.estimatedDelivery)}</span>
            </div>
          </div>

          <div className="order-items">
            <h3>Order Items</h3>
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  {item.size && <p>Size: {item.size}</p>}
                  <p>Quantity: {item.quantity}</p>
                  <p className="item-price">₹{item.discountPrice || item.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="order-total">
            <div className="total-row">
              <span className="total-label">Total Amount:</span>
              <span className="total-amount">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="order-actions">
          <button className="continue-shopping" onClick={onClose}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;