import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './OrderHistory.css';

const OrderHistory = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchOrders();
    }
  }, [isOpen, user]);

  const fetchOrders = async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/orders/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch order history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return '#28a745';
      case 'processing': return '#ffc107';
      case 'shipped': return '#17a2b8';
      case 'delivered': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="order-history-modal">
        <div className="modal-header">
          <h2>Order History</h2>
          <button className="close-btn" style={{ backgroundColor: "green" }} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Orders Found</h3>
            <p>You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.orderId} className="order-card">
                <div className="order-header">
                  <div className="order-id">{order.orderId}</div>
                  <div 
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </div>
                </div>

                <div className="order-content">
                    <h4>Order Details</h4>
                  <div className="order-info">
                    <div className="info-row">
                      <span className="info-label">Date:</span>
                      <span className="info-value">{formatDate(order.orderDate)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Total:</span>
                      <span className="info-value">₹{order.totalAmount}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Items:</span>
                      <span className="info-value">{order.items.length}</span>
                    </div>
                  </div>

                  <div className="order-items">
                    <h4>Items</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="item">
                        <img src={item.image} alt={item.name} className="item-image" />
                        <div className="item-info">
                          <div className="item-name">{item.name}</div>
                          <div className="item-details">
                            {item.size && <div>Size: {item.size}</div>}
                            <div>Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="item-price">₹{item.discountPrice || item.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;