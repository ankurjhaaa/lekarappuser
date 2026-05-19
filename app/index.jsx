import { Redirect } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../src/constants/theme';

/**
 * Root index — redirects to auth, main, or complete-profile based on state.
 */
export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) return null;

  if (isAuthenticated) {
    if (!user || !user.name) {
      return <Redirect href="/(auth)/complete-profile" />;
    }
    return <Redirect href="/(main)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});

