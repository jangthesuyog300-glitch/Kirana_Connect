import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

const getApiBaseUrl = () => {
  const configuredUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configuredUrl) return configuredUrl;
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp, name) => api.post('/auth/verify-otp', { phone, otp, name, role: 'customer' }),
  getMe: () => api.get('/auth/me'),
};

export const storesAPI = {
  getNearby: (lat, lng, radius = 5) => api.get(`/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getById: (id, lat, lng) => api.get(`/stores/${id}?lat=${lat}&lng=${lng}`),
  getFavourites: () => api.get('/stores/my/favourites'),
  toggleFavourite: (id) => api.post(`/stores/${id}/favourite`),
};

export const itemsAPI = {
  getStoreItems: (storeId, category = '', limit = 6, offset = 0) => {
    let url = `/items?store_id=${storeId}&available_only=true&limit=${limit}&offset=${offset}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    return api.get(url);
  },
  getCategories: () => api.get('/items/categories/list'),
};

export const ordersAPI = {
  placeOrder: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
};
