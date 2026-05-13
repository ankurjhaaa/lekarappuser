import { Redirect, Stack } from 'expo-router';
import useAuthStore from '../../src/store/authStore';

/**
 * Main layout — wraps authenticated screens including tabs and modals.
 */
export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search-location" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ride-detail" />
      <Stack.Screen name="ride-tracking" />
    </Stack>
  );
}
