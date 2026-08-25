import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production by default; EXPO_PUBLIC_API_URL points a dev build at a local
// backend, matching how the website uses VITE_API_URL.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  || 'https://propertyking-backend-oofk.onrender.com/api/v1';

const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 30000 });

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
  requestOTP: (data) => api.post('/auth/request-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (token) => api.post('/auth/google', { token }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  updateAvatar: (file) => { const fd = new FormData(); fd.append('file', file); return api.put('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  updateFCMToken: (token) => api.put('/users/me/fcm-token', { fcm_token: token }),
  getPublicProfile: (id) => api.get(`/users/${id}/public`),
  deleteAccount: () => api.delete('/users/me'),
};

export const propertyAPI = {
  list: (params) => api.get('/properties', { params }),
  getBySlug: (slug) => api.get(`/properties/${slug}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  toggleStatus: (id) => api.put(`/properties/${id}/toggle-status`),
  nearby: (params) => api.get('/properties/nearby', { params }),
  recommendations: (params) => api.get('/properties/recommendations', { params }),
  topViewed: (params) => api.get('/properties/top-viewed', { params }),
  myListings: (params) => api.get('/properties/my-listings', { params }),
  myListingsStats: () => api.get('/properties/my-listings/stats'),
  getViewers: (id, params) => api.get(`/properties/${id}/viewers`, { params }),
  // Cities we actually have listings in — used by the location picker so every
  // suggestion leads somewhere with results.
  locations: (params) => api.get('/properties/locations', { params }),
  // Slim marker payload, so the map can plot a whole city.
  mapPins: (params) => api.get('/properties/map-pins', { params }),
};

// ─── Property claims ───
// Claiming an imported listing needs admin approval; once approved the property
// moves into the user's My Listings and their edits go through the queue below.
export const claimAPI = {
  submit: (propertyId, data) => api.post(`/claims/${propertyId}`, data),
  mine: (params) => api.get('/claims/my', { params }),
  cancel: (claimId) => api.delete(`/claims/${claimId}`),
};

export const editRequestAPI = {
  submit: (propertyId, data) => api.post(`/edit-requests/${propertyId}`, data),
  mine: (params) => api.get('/edit-requests/my', { params }),
  cancel: (requestId) => api.delete(`/edit-requests/${requestId}`),
};

export const propertyTypeAPI = { list: () => api.get('/property-types') };
export const amenityAPI = { list: (cat) => api.get('/amenities', { params: { category: cat } }) };
export const favoriteAPI = { list: (p) => api.get('/favorites', { params: p }), add: (id) => api.post(`/favorites/${id}`), remove: (id) => api.delete(`/favorites/${id}`) };
export const inquiryAPI = { create: (data) => api.post('/inquiries', data), sent: (p) => api.get('/inquiries/sent', { params: p }), received: (p) => api.get('/inquiries/received', { params: p }), respond: (id, data) => api.put(`/inquiries/${id}/respond`, data) };
export const reviewAPI = { getForProperty: (id, p) => api.get(`/reviews/property/${id}`, { params: p }), create: (data) => api.post('/reviews', data) };
export const notificationAPI = { list: (p) => api.get('/notifications', { params: p }), markRead: (id) => api.put(`/notifications/${id}/read`), markAllRead: () => api.put('/notifications/read-all'), delete: (id) => api.delete(`/notifications/${id}`), deleteAll: () => api.delete('/notifications') };

export default api;
