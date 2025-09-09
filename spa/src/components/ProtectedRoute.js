import React from 'react';
import { useAuth } from 'react-oidc-context';

const ProtectedRoute = ({ children, fallback = null }) => {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
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
