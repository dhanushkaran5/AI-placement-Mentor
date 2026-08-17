import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  // Initialize auth state and fetch user profile
  const initAuth = useCallback(async (currentToken) => {
    if (!currentToken) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      setIsBackendOffline(false);
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);
      const profileData = await api.get('/auth/profile');
      setIsBackendOffline(false);
      setUser({ name: profileData.name, email: profileData.email });
      setProfile({
        target_role: profileData.target_role,
        target_company: profileData.target_company,
        readiness_score: profileData.readiness_score,
        target_date: profileData.target_date,
        daily_hours: profileData.daily_hours
      });
    } catch (error) {
      console.warn('Session verification warning:', error.message);
      if (error.status === 401 || error.status === 403) {
        // Invalid or expired token
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setProfile(null);
        setAuthError('Session expired. Please log in again.');
      } else if (error.message && (error.message.includes('offline') || error.message.includes('timed out'))) {
        setIsBackendOffline(true);
        setAuthError(error.message);
      } else {
        setAuthError(error.message || 'Failed to authenticate session.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth(token);
  }, [token, initAuth]);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsBackendOffline(false);
        return data;
      } else {
        throw new Error('Login failed: Token not received.');
      }
    } catch (error) {
      setAuthError(error.message || 'Login failed. Please check credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await api.post('/auth/signup', { name, email, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsBackendOffline(false);
        return data;
      } else {
        throw new Error('Signup failed: Token not received.');
      }
    } catch (error) {
      setAuthError(error.message || 'Signup failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setAuthError(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const profileData = await api.get('/auth/profile');
      setUser({ name: profileData.name, email: profileData.email });
      setProfile({
        target_role: profileData.target_role,
        target_company: profileData.target_company,
        readiness_score: profileData.readiness_score,
        target_date: profileData.target_date,
        daily_hours: profileData.daily_hours
      });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const updateTarget = async (role, company) => {
    try {
      await api.put('/auth/profile', { target_role: role, target_company: company });
      await refreshProfile();
    } catch (error) {
      console.error('Error updating target profile:', error);
      throw error;
    }
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    token,
    profile,
    loading,
    authError,
    isBackendOffline,
    login,
    signup,
    logout,
    refreshProfile,
    updateTarget,
    clearError,
    retryAuth: () => initAuth(token)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
