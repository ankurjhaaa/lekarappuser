import { Platform } from 'react-native';

/**
 * ──────────────────────────────────────────────────────────
 *  App Configuration
 * ──────────────────────────────────────────────────────────
 *  API_BASE_URL:
 *   - Physical device → use your computer's LAN IP
 *   - Android emulator → 10.0.2.2 maps to host localhost
 *   - iOS simulator → localhost works directly
 *
 *  IMPORTANT: Your phone and computer must be on SAME Wi-Fi network
 * ──────────────────────────────────────────────────────────
 */

// Your computer's local network IP — both emulator & physical device will work
// Your computer's local network IP — both emulator & physical device will work
const HOST = '10.158.108.98';

export const CONFIG = {
  // API Base URL
  API_BASE_URL: `http://${HOST}:8000/api/v1`,
  // API_BASE_URL: 'https://your-domain.com/api/v1', // Production

  // WebSocket (Laravel Reverb) config
  REVERB_KEY: 'gadiwala-key',
  REVERB_HOST: HOST,
  REVERB_PORT: 6001,
  REVERB_SCHEME: 'http',

  // Google Maps
  GOOGLE_MAPS_API_KEY: 'AIzaSyAUTN27SDgS8mbpMMF4IgQ55UL81Vokx3Q',

  // App Info
  APP_NAME: 'Lekar',
  APP_VERSION: '1.0.0',

  // Location settings
  LOCATION_UPDATE_INTERVAL: 8000,  // 8 seconds
  NEARBY_DRIVERS_RADIUS_KM: 8,

  // Ride settings
  MAX_RIDE_DISTANCE_KM: 50,
  DRIVER_SEARCH_TIMEOUT_SEC: 300,  // 5 minutes
};

