import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthButton = () => {
  const { authenticated, login, logout, userInfo } = useAuth();

  if (authenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>Welcome, {userInfo?.name || userInfo?.username}!</span>
        <button onClick={logout} style={buttonStyle}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <button onClick={login} style={buttonStyle}>
      Login
    </button>
  );
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem'
};

export default AuthButton;
