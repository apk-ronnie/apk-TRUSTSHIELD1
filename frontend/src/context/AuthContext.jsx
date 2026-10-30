import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('trustshield_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('trustshield_token'));
  const [loading, setLoading] = useState(true);

  // Synchronize authentication status on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response?.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('trustshield_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.warn('Authentication token verification failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();

    // Listen for global 401 unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;
    
    localStorage.setItem('trustshield_token', receivedToken);
    localStorage.setItem('trustshield_user', JSON.stringify(receivedUser));
    
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { token: receivedToken, user: receivedUser } = response.data;
    
    localStorage.setItem('trustshield_token', receivedToken);
    localStorage.setItem('trustshield_user', JSON.stringify(receivedUser));
    
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('trustshield_token');
    localStorage.removeItem('trustshield_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

