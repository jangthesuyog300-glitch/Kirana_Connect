import { create } from 'zustand';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface RegistrationState {
  customerName: string;
  mobileNumber: string;
  location: LocationData | null;
  setCustomerDetails: (name: string, mobile: string) => void;
  setLocation: (location: LocationData) => void;
  clearRegistration: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  customerName: '',
  mobileNumber: '',
  location: null,
  setCustomerDetails: (name, mobile) => set({ customerName: name, mobileNumber: mobile }),
  setLocation: (location) => set({ location }),
  clearRegistration: () => set({ customerName: '', mobileNumber: '', location: null }),
}));
