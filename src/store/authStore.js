import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/auth';
import { registerForPushNotifications, setupNotificationListeners } from '../services/notifications';

/**
 * Auth store — manages authentication state.
 * Token is persisted in AsyncStorage for auto-login.
 * Push notifications are registered on login/init.
 */
const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // Initialize from storage on app launch
  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, isLoading: false });
        // Verify token is still valid
        try {
          const res = await authAPI.me();
          set({ user: res.data.user });
          await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
        } catch (e) {
          if (e.response?.status === 401) {
            await get().logout();
          }
        }
        // Register push notifications
        registerForPushNotifications().catch(() => {});
        setupNotificationListeners();
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },

  // Set auth data after login
  setAuth: async (token, user) => {
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
    // Register push notifications after login
    registerForPushNotifications().catch(() => {});
    setupNotificationListeners();
  },

  // Update user data
  setUser: async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  // Logout
  logout: async () => {
    try { await authAPI.logout(); } catch (e) { /* ignore */ }
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;

