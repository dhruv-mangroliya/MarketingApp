import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { toast } from 'react-toastify';
import './RefundTracker.css';

const RefundTracker = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackingRefundId, setTrackingRefundId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [activeTab, setActiveTab] = useState('my-refunds');

  useEffect(() => {
    if (isOpen && user?.email) {
      fetchUserRefunds();
    }
  }, [isOpen, user]);

  const fetchUserRefunds = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/refunds/user/${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      if (data.success) {
        setRefunds(data.refunds);
      } else {
        toast.error('Failed to fetch refunds');
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Error fetching refunds');
    } finally {
      setLoading(false);
    }
  };

  const trackRefund = async () => {
    if (!trackingRefundId.trim()) {
      toast.error('Please enter a refund ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/refunds/status/${trackingRefundId}`);
      const data = await response.json();
      
      if (data.success) {
        setTrackingResult(data.refund);
        toast.success('Refund status updated');
      } else {
        toast.error('Refund not found');
        setTrackingResult(null);
      }
    } catch (error) {
      console.error('Error tracking refund:', error);
      toast.error('Error tracking refund');
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return '#28a745';
      case 'PROCESSING': return '#ffc107';
      case 'PENDING': return '#17a2b8';
      case 'FAILED': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'PROCESSING': return 'Processing';
      case 'PENDING': return 'Pending';
      case 'FAILED': return 'Failed';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="refund-tracker-overlay">
      <div className="refund-tracker-modal">
        <div className="refund-tracker-header">
          <h2>Refund Tracker</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="refund-tracker-tabs">
          <button 
            className={`tab-btn ${activeTab === 'my-refunds' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-refunds')}
          >
            My Refunds
          </button>
          <button 
            className={`tab-btn ${activeTab === 'track-refund' ? 'active' : ''}`}
            onClick={() => setActiveTab('track-refund')}
          >
            Track Refund
          </button>
        </div>

        <div className="refund-tracker-content">
          {activeTab === 'my-refunds' && (
            <div className="my-refunds-tab">
              {loading ? (
                <div className="loading">Loading refunds...</div>
              ) : refunds.length === 0 ? (
                <div className="no-refunds">
                  <div className="no-refunds-icon">💰</div>
                  <h3>No Refunds Found</h3>
                  <p>You don't have any refunds yet.</p>
                </div>
              ) : (
                <div className="refunds-list">
                  {refunds.map((refund) => (
                    <div key={refund.id} className="refund-item">
                      <div className="refund-header">
                        <div className="refund-id">
                          <strong>Refund ID:</strong> {refund.id}
                        </div>
                        <div 
                          className="refund-status"
                          style={{ color: getStatusColor(refund.status) }}
                        >
                          {getStatusText(refund.status)}
                        </div>
                      </div>
                      
                      <div className="refund-details">
                        <div className="refund-row">
                          <span>Order ID:</span>
                          <span>{refund.orderId}</span>
                        </div>
                        <div className="refund-row">
                          <span>Amount:</span>
                          <span>₹{refund.amount}</span>
                        </div>
                        <div className="refund-row">
                          <span>Reason:</span>
                          <span>{refund.reason}</span>
                        </div>
                        <div className="refund-row">
                          <span>Initiated:</span>
                          <span>{formatDate(refund.createdAt)}</span>
                        </div>
                        {refund.processedAt && (
                          <div className="refund-row">
                            <span>Processed:</span>
                            <span>{formatDate(refund.processedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'track-refund' && (
            <div className="track-refund-tab">
              <div className="track-refund-form">
                <div className="form-group">
                  <label htmlFor="refundId">Enter Refund ID:</label>
                  <input
                    type="text"
                    id="refundId"
                    value={trackingRefundId}
                    onChange={(e) => setTrackingRefundId(e.target.value)}
                    placeholder="e.g., rfnd_1234567890"
                    className="refund-input"
                  />
                </div>
                <button 
                  onClick={trackRefund} 
                  disabled={loading}
                  className="track-btn"
                >
                  {loading ? 'Tracking...' : 'Track Refund'}
                </button>
              </div>

              {trackingResult && (
                <div className="tracking-result">
                  <h3>Refund Status</h3>
                  <div className="result-card">
                    <div className="result-header">
                      <div className="result-id">
                        <strong>Refund ID:</strong> {trackingResult.id}
                      </div>
                      <div 
                        className="result-status"
                        style={{ color: getStatusColor(trackingResult.status) }}
                      >
                        {getStatusText(trackingResult.status)}
                      </div>
                    </div>
                    
                    <div className="result-details">
                      <div className="result-row">
                        <span>Amount:</span>
                        <span>₹{trackingResult.amount}</span>
                      </div>
                      <div className="result-row">
                        <span>Initiated:</span>
                        <span>{formatDate(trackingResult.createdAt)}</span>
                      </div>
                      {trackingResult.processedAt && (
                        <div className="result-row">
                          <span>Processed:</span>
                          <span>{formatDate(trackingResult.processedAt)}</span>
                        </div>
                      )}
                    </div>

                    <div className="status-info">
                      {trackingResult.status === 'PENDING' && (
                        <p className="info-text pending">
                          Your refund is being processed. It typically takes 5-7 business days.
                        </p>
                      )}
                      {trackingResult.status === 'PROCESSING' && (
                        <p className="info-text processing">
                          Your refund is currently being processed by the payment gateway.
                        </p>
                      )}
                      {trackingResult.status === 'COMPLETED' && (
                        <p className="info-text completed">
                          Your refund has been completed and credited to your original payment method.
                        </p>
                      )}
                      {trackingResult.status === 'FAILED' && (
                        <p className="info-text failed">
                          Refund failed. Please contact our support team for assistance.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundTracker;