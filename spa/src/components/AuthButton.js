import React from 'react';
import { useAuth } from 'react-oidc-context';

const AuthButton = () => {
  const auth = useAuth();

  if (auth.isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>Welcome, {auth.user?.profile?.name || auth.user?.profile?.preferred_username}!</span>
        <button onClick={() => auth.signoutRedirect()} style={buttonStyle}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => auth.signinRedirect()} style={buttonStyle}>
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
