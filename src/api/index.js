import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://propertyking-backend.onrender.com/api/v1';

const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('pk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(r => r, async (error) => {
  if (error.response?.status === 401) {
    await AsyncStorage.multiRemove(['pk_token', 'pk_refresh_token', 'pk_user']);
  }
  return Promise.reject(error);
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (token) => api.post('/auth/google', { token }),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  updateAvatar: (file) => { const fd = new FormData(); fd.append('file', file); return api.put('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  updateFCMToken: (token) => api.put('/users/me/fcm-token', { fcm_token: token }),
  getPublicProfile: (id) => api.get(`/users/${id}/public`),
};

export const propertyAPI = {
  list: (params) => api.get('/properties', { params }),
  getBySlug: (slug) => api.get(`/properties/${slug}`),
  create: (data) => api.post('/properties', data),
  nearby: (params) => api.get('/properties/nearby', { params }),
  recommendations: (params) => api.get('/properties/recommendations', { params }),
  myListings: (params) => api.get('/properties/my-listings', { params }),
  getViewers: (id, params) => api.get(`/properties/${id}/viewers`, { params }),
};

export const propertyTypeAPI = { list: () => api.get('/property-types') };
export const amenityAPI = { list: (cat) => api.get('/amenities', { params: { category: cat } }) };
export const favoriteAPI = { list: (p) => api.get('/favorites', { params: p }), add: (id) => api.post(`/favorites/${id}`), remove: (id) => api.delete(`/favorites/${id}`) };
export const inquiryAPI = { create: (data) => api.post('/inquiries', data), sent: (p) => api.get('/inquiries/sent', { params: p }), received: (p) => api.get('/inquiries/received', { params: p }) };
export const reviewAPI = { getForProperty: (id, p) => api.get(`/reviews/property/${id}`, { params: p }), create: (data) => api.post('/reviews', data) };
export const notificationAPI = { list: (p) => api.get('/notifications', { params: p }), markRead: (id) => api.put(`/notifications/${id}/read`), markAllRead: () => api.put('/notifications/read-all') };

export default api;
