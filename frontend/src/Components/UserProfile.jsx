import React from 'react';
import { useAuth } from '../context/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="user-profile">
      <div className="user-info">
        <img src={user.picture} alt={user.name} className="user-avatar" />
      </div>
    </div>
  );
};

export default UserProfile;