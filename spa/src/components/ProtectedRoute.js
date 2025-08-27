import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, fallback = null }) => {
  const { authenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return fallback || (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Authentication Required</h2>
        <p>Please log in to access this content.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
