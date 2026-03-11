import { useState } from 'react';
import './VerifyPhoneModal.css';

const VerifyPhoneModal = ({ isOpen, onClose, onVerify }) => {
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify(phone);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Verify Phone Number</h2>
        <p>Enter your phone number to receive OTP</p>
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            placeholder="Enter phone number (+91XXXXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            pattern="^\+?[1-9]\d{1,14}$"
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

export default VerifyPhoneModal;
