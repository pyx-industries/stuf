import React, { createContext, useContext, useEffect, useState } from 'react';
import { initKeycloak, login, logout, getUserInfo, getToken, updateToken } from '../services/keycloak';
import keycloakService from '../services/keycloak';

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
    let mounted = true;
    
    const initAuth = async () => {
      try {
        console.log('Initializing Keycloak...');
        const authenticated = await initKeycloak();
        console.log('Keycloak initialized, authenticated:', authenticated);
        
        if (!mounted) return; // Component unmounted during async operation
        
        setAuthenticated(authenticated);
        
        if (authenticated) {
          const userInfo = getUserInfo();
          console.log('User info:', userInfo);
          setUserInfo(userInfo);
          
          // Set up token refresh
          const refreshInterval = setInterval(async () => {
            try {
              await updateToken();
            } catch (error) {
              console.error('Failed to refresh token:', error);
              if (mounted) {
                handleLogout();
              }
            }
          }, 60000); // Check every minute
          
          // Cleanup interval on unmount
          return () => {
            clearInterval(refreshInterval);
          };
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
        console.error('Error details:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async () => {
    try {
      // Check if Keycloak is initialized before attempting login
      if (!authenticated && isLoading) {
        console.log('Keycloak still initializing, waiting...');
        return;
      }
      
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      console.error('Keycloak initialization status:', keycloakService.getInitializationStatus());
      
      // If Keycloak isn't initialized, try to initialize it first
      if (error.message === 'Keycloak not initialized') {
        console.log('Attempting to re-initialize Keycloak...');
        try {
          const authenticated = await initKeycloak();
          if (authenticated) {
            setAuthenticated(true);
            setUserInfo(getUserInfo());
          } else {
            // Try login again after successful initialization
            await login();
          }
        } catch (initError) {
          console.error('Re-initialization failed:', initError);
        }
      }
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
