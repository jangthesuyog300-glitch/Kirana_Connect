import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { initSocket, disconnectSocket } from '../utils/socket';

export default function GlobalStateProvider({ children }) {
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (token) {
      initSocket();
    } else {
      disconnectSocket();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [token]);

  return children;
}
