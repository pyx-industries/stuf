import React, { createContext, useContext, useEffect, useState } from 'react';
import { initKeycloak, login, logout, isAuthenticated, getUserInfo, getToken, updateToken } from '../services/keycloak';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = await initKeycloak();
        setAuthenticated(authenticated);
        
        if (authenticated) {
          setUserInfo(getUserInfo());
          
          // Set up token refresh
          setInterval(async () => {
            try {
              await updateToken();
            } catch (error) {
              console.error('Failed to refresh token:', error);
              handleLogout();
            }
          }, 60000); // Check every minute
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setAuthenticated(false);
      setUserInfo(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    isLoading,
    authenticated,
    userInfo,
    login: handleLogin,
    logout: handleLogout,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
