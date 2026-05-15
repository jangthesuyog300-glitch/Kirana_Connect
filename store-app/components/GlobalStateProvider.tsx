import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { initSocket, disconnectSocket } from '../utils/socket';
import { storeMgmtAPI } from '../utils/api';

export default function GlobalStateProvider({ children }) {
  const { token, setStoreData } = useAuthStore();

  useEffect(() => {
    if (token) {
      // Fetch store data
      storeMgmtAPI.getMyStore()
        .then(res => {
          setStoreData(res.data.store);
          initSocket();
        })
        .catch(err => {
          console.error('Failed to fetch store data', err);
          if (err?.response?.status === 404) {
            // No store found, set storeData to null explicitly (though it already is)
            setStoreData(null);
          }
        });
    } else {
      disconnectSocket();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [token]);

  return children;
}
