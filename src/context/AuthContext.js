import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI } from '../api';
import { PushNotificationService } from '../services/PushNotificationService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => { loadStoredUser(); }, []);

  const loadStoredUser = async () => {
    const start = Date.now();
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
          
          // Setup push notifications
          PushNotificationService.registerForPushNotificationsAsync();
        } catch (e) {
          // Token expired or invalid — clear everything
          console.log('Token expired, clearing session');
          await AsyncStorage.multiRemove(['pk_token', 'pk_refresh_token', 'pk_user']);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (e) { console.log('Auth load error', e); }

    // Enforce minimum 2500ms display time for the custom OP Splash Screen
    const elapsed = Date.now() - start;
    if (elapsed < 2500) {
      await new Promise(resolve => setTimeout(resolve, 2500 - elapsed));
    }

    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token, refresh_token, user: u } = res.data;
    await AsyncStorage.setItem('pk_token', access_token);
    await AsyncStorage.setItem('pk_refresh_token', refresh_token);
    await AsyncStorage.setItem('pk_user', JSON.stringify(u));
    
    // Check listings count for redirect
    try {
      const { propertyAPI } = require('../api');
      const listRes = await propertyAPI.myListings({ limit: 1 });
      if (listRes.data.properties && listRes.data.properties.length > 0) {
        await AsyncStorage.setItem('pk_redirect_listings', 'true');
      }
    } catch(e) {
      console.log('Failed to check user listings for redirect:', e);
    }
    
    setUser(u); setIsAuthenticated(true);
    
    // Setup push notifications
    PushNotificationService.registerForPushNotificationsAsync();
    
    return u;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { access_token, refresh_token, user: u } = res.data;
    await AsyncStorage.setItem('pk_token', access_token);
    await AsyncStorage.setItem('pk_refresh_token', refresh_token);
    await AsyncStorage.setItem('pk_user', JSON.stringify(u));
    setUser(u); setIsAuthenticated(true);
    
    // Setup push notifications
    PushNotificationService.registerForPushNotificationsAsync();
    
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

  const refreshUser = async () => {
    try {
      const res = await userAPI.getMe();
      const freshUser = res.data;
      await AsyncStorage.setItem('pk_user', JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (e) {
      console.log('Error refreshing user stats', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
