import * as PusherRaw from 'pusher-js/react-native';
const getPusher = () => {
  if (typeof PusherRaw === 'function') return PusherRaw;
  if (PusherRaw && typeof PusherRaw.default === 'function') return PusherRaw.default;
  if (PusherRaw && typeof PusherRaw.Pusher === 'function') return PusherRaw.Pusher;
  if (typeof PusherRaw === 'object') {
    for (const key in PusherRaw) if (typeof PusherRaw[key] === 'function') return PusherRaw[key];
  }
  return null;
};
const Pusher = getPusher();
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

/**
 * WebSocket service using Pusher protocol (Laravel Reverb compatible).
 * 
 * CHANNELS:
 * - private-booking.{id}: Ride status updates + driver location
 * - private-user.{id}: User notifications
 * 
 * EVENTS:
 * - BookingUpdated: Status change (assigned, arrived, started, completed, etc.)
 * - DriverLocationUpdated: Live GPS from driver (lat, lng, heading)
 * - NotificationReceived: System notifications
 */
let pusherInstance = null;

export const initWebSocket = async () => {
  if (pusherInstance) return pusherInstance;

  const token = await AsyncStorage.getItem('auth_token');
  if (!token) return null;

  pusherInstance = new Pusher(CONFIG.REVERB_KEY, {
    cluster: 'mt1',
    wsHost: CONFIG.REVERB_HOST,
    wsPort: CONFIG.REVERB_PORT,
    wssPort: CONFIG.REVERB_PORT,
    forceTLS: CONFIG.REVERB_SCHEME === 'https',
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: CONFIG.API_BASE_URL.replace('/api/v1', '') + '/api/v1/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  pusherInstance.connection.bind('connected', () => {
    console.log('[WS] Connected to Reverb');
  });

  pusherInstance.connection.bind('error', (err) => {
    console.warn('[WS] Connection error:', err);
  });

  return pusherInstance;
};

/**
 * Subscribe to a booking channel for ride status updates + driver location
 * @param {number} bookingId
 * @param {function} onStatusUpdate - called when booking status changes
 * @param {function} onDriverLocation - called with driver's live GPS (lat, lng, heading)
 */
export const subscribeToBooking = (bookingId, onStatusUpdate, onDriverLocation = null, onChatMessage = null) => {
  if (!pusherInstance) return null;
  const channel = pusherInstance.subscribe(`private-booking.${bookingId}`);

  // Status changes (accept, arrive, OTP, start, complete, cancel)
  channel.bind('BookingUpdated', (data) => {
    console.log('[WS] BookingUpdated:', data.status);
    onStatusUpdate(data);
  });

  // Live driver location streaming
  if (onDriverLocation) {
    channel.bind('.DriverLocationUpdated', (data) => {
      onDriverLocation(data);
    });
  }

  // Chat messages
  if (onChatMessage) {
    channel.bind('ChatMessageSent', (data) => {
      console.log('[WS] ChatMessage:', data);
      onChatMessage(data.message || data);
    });
  }

  channel.bind('pusher:subscription_error', (err) => {
    console.warn('[WS] Subscription error:', err);
  });

  return channel;
};

/** Unsubscribe from a booking channel */
export const unsubscribeFromBooking = (bookingId) => {
  if (!pusherInstance) return;
  pusherInstance.unsubscribe(`private-booking.${bookingId}`);
};

/** Subscribe to user notifications channel */
export const subscribeToUserChannel = (userId, onNotification) => {
  if (!pusherInstance) return null;
  const channel = pusherInstance.subscribe(`private-user.${userId}`);
  channel.bind('NotificationReceived', onNotification);
  return channel;
};

/** Disconnect WebSocket */
export const disconnectWebSocket = () => {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
};

export default {
  initWebSocket,
  subscribeToBooking,
  unsubscribeFromBooking,
  subscribeToUserChannel,
  disconnectWebSocket,
};
