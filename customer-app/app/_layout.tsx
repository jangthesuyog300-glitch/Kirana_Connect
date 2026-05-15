import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import GlobalStateProvider from '../components/GlobalStateProvider';

export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Basic auth routing logic
    const inAuthGroup = segments[0] === 'auth';
    
    if (!isReady) {
      setIsReady(true);
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, segments, isReady]);

  return (
    <GlobalStateProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="store/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout', presentation: 'modal' }} />
      </Stack>
    </GlobalStateProvider>
  );
}
