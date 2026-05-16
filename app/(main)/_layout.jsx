import { Redirect, Stack } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import SidebarMenu from '../../src/components/SidebarMenu';

/**
 * Main layout — wraps authenticated screens including tabs and modals.
 * Animations: slide_from_right when opening, slide back left automatically.
 */
export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="search-location" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ride-detail" />
        <Stack.Screen name="ride-tracking" />
        <Stack.Screen name="ride-history-detail" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="payment-methods" />
        <Stack.Screen name="personal-info" />
        <Stack.Screen name="my-vehicles" />
        <Stack.Screen name="help-support" />
        <Stack.Screen name="safety" />
        <Stack.Screen name="about" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="security" />
        <Stack.Screen name="notification-settings" />
      </Stack>
      
      {/* Global Sidebar Menu */}
      <SidebarMenu />
    </>
  );
}
