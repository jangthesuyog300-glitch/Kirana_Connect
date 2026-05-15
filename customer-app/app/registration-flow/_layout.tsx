import { Stack } from 'expo-router';

export default function RegistrationFlowLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="map" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="success" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
