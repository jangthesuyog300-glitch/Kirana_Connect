import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  storeData: null,
  isAuthenticated: false,
  
  setAuth: (user, token) => set({ user, token, isAuthenticated: !!token }),
  setStoreData: (storeData) => set({ storeData }),
  logout: () => set({ user: null, token: null, storeData: null, isAuthenticated: false }),
}));
