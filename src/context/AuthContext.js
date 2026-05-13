import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI } from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => { loadStoredUser(); }, []);

  const loadStoredUser = async () => {
    try {
      const token = await AsyncStorage.getItem('pk_token');
      if (token) {
        // Verify token is still valid by calling /users/me
        try {
          const res = await userAPI.getMe();
          const freshUser = res.data;
          await AsyncStorage.setItem('pk_user', JSON.stringify(freshUser));
          setUser(freshUser);
          setIsAuthenticated(true);
        } catch (e) {
          // Token expired or invalid — clear everything
          console.log('Token expired, clearing session');
          await AsyncStorage.multiRemove(['pk_token', 'pk_refresh_token', 'pk_user']);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (e) { console.log('Auth load error', e); }
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token, refresh_token, user: u } = res.data;
    await AsyncStorage.setItem('pk_token', access_token);
    await AsyncStorage.setItem('pk_refresh_token', refresh_token);
    await AsyncStorage.setItem('pk_user', JSON.stringify(u));
    setUser(u); setIsAuthenticated(true);
    return u;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { access_token, refresh_token, user: u } = res.data;
    await AsyncStorage.setItem('pk_token', access_token);
    await AsyncStorage.setItem('pk_refresh_token', refresh_token);
    await AsyncStorage.setItem('pk_user', JSON.stringify(u));
    setUser(u); setIsAuthenticated(true);
    return u;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['pk_token', 'pk_refresh_token', 'pk_user']);
    setUser(null); setIsAuthenticated(false);
  };

  const updateUser = async (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    await AsyncStorage.setItem('pk_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
