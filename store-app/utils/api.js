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
  verifyOTP: (phone, otp, name) => api.post('/auth/verify-otp', { phone, otp, name, role: 'store_owner' }),
};

export const storeMgmtAPI = {
  getMyStore: () => api.get('/stores/my/store'),
  createStore: (data) => api.post('/stores', data),
  updateStore: (id, data) => api.patch(`/stores/${id}`, data),
};

export const inventoryAPI = {
  getItems: (storeId) => api.get(`/items?store_id=${storeId}`),
  createItem: (data) => api.post('/items', data),
  updateItem: (id, data) => api.patch(`/items/${id}`, data),
  deleteItem: (id) => api.delete(`/items/${id}`),
};

export const orderMgmtAPI = {
  getOrders: () => api.get('/orders'),
  acceptOrder: (id, prep_time_minutes) => api.patch(`/api/owner/orders/${id}/accept`, { prep_time_minutes }),
  updateStatus: (id, status, prep_time_minutes) => api.patch(`/orders/${id}/status`, { status, prep_time_minutes }),
  verifyOTP: (id, otp) => api.post(`/api/owner/orders/${id}/verify-otp`, { otp }),
};

export const workerAPI = {
  getOrders: () => api.get('/worker/orders'),
  acceptOrder: (id, prep_time_minutes) => api.patch(`/worker/orders/${id}/accept`, { prep_time_minutes }),
  updateStatus: (id, status, prep_time_minutes) => api.patch(`/worker/orders/${id}/status`, { status, prep_time_minutes }),
};

export const reportsAPI = {
  getMonthly: (storeId, month) => api.get(`/reports/monthly?store_id=${storeId}&month=${month}`),
};

export const adminAPI = {
  listWorkers: () => api.get('/admin/workers'),
  addWorker: (data) => api.post('/admin/workers', data),
  removeWorker: (workerId) => api.delete(`/admin/workers/${workerId}`),
};

export const catalogAPI = {
  search: (query) => api.get(`/catalog?search=${query}`),
  getCategories: () => api.get('/catalog/categories'),
};
