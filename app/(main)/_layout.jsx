import { Redirect, Stack, usePathname, router } from 'expo-router';
import { DeviceEventEmitter, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../../src/store/authStore';
import SidebarMenu from '../../src/components/SidebarMenu';
import LekarHeader from '../../src/components/LekarHeader';
import { COLORS } from '../../src/constants/theme';

/**
 * Main layout — wraps authenticated screens including tabs and modals.
 * Persistent header prevents the "sliding" navbar effect.
 */
export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const pathname = usePathname();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  // Logic to determine header properties based on current route
  const isTab = ['/home', '/rides', '/wallet', '/notifications', '/profile'].includes(pathname) || pathname === '/';
  const isRideDetail = pathname.includes('ride-detail');
  const isSearch = pathname.includes('search-location');
  
  // Hide persistent header on specific screens if they have their own or need full screen
  const hideHeader = isSearch;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {!hideHeader && (
        <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.primary, zIndex: 1000 }}>
          <LekarHeader 
            compact={isRideDetail}
            onMenu={isTab ? () => DeviceEventEmitter.emit('openSidebar') : undefined}
            onBack={!isTab ? () => router.back() : undefined}
            rightIcon={pathname.includes('notifications') ? null : 'notifications-outline'}
          />
        </SafeAreaView>
      )}
      
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
      </Stack>
      
      <SidebarMenu />
    </View>
  );
}
