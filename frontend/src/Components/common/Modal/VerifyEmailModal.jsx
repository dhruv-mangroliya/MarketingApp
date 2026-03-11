import { useState } from 'react';
import './VerifyEmailModal.css';

const VerifyEmailModal = ({ isOpen, onClose, onVerify, userEmail }) => {
  const [email, setEmail] = useState(userEmail || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify(email);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Verify Email</h2>
        <p>Enter your email to receive OTP</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="modal-buttons">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" className="verify-btn">Get OTP</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmailModal;
