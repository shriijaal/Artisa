import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Use relative path to leverage Vite proxy in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    
    if (storedToken) {
      setAccessToken(storedToken);
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAccessToken(null);
    setUser(null);
  };

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        clearTokens();
      } else {
        console.error('Failed to fetch user:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
        username,
        password
      });
      
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setAccessToken(access);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { detail: 'Login failed' }
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register/`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { detail: 'Registration failed' }
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await axios.post(`${API_BASE_URL}/api/auth/logout/`, {
          refresh: refreshToken
        });
      }
    } catch (error) {
      // Silently handle - token may be expired
    } finally {
      clearTokens();
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
        refresh: refreshToken
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);
      setAccessToken(access);
      return access;
    } catch (error) {
      clearTokens();
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    loading,
    accessToken,
    login,
    register,
    logout,
    refreshAccessToken,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
