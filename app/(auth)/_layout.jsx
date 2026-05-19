import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import useAuthStore from '../../src/store/authStore';

/**
 * Auth layout — only shown when NOT authenticated or profile is incomplete.
 * Redirects to main if user is logged in with complete profile.
 */
export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) return null;
  
  // Only redirect to main if fully authenticated and profile completed
  if (isAuthenticated && user?.name) {
    return <Redirect href="/(main)/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}

