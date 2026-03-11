import { useState } from 'react';
import './VerifySMSOTPModal.css';

const VerifySMSOTPModal = ({ isOpen, onClose, onVerify, phone }) => {
  const [otp, setOtp] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify(otp);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Verify OTP</h2>
        <p>Enter the 6-digit OTP sent to {phone}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength="6"
            pattern="\d{6}"
            required
          />
          <div className="modal-buttons">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" className="verify-btn">Verify</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifySMSOTPModal;
