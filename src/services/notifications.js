/**
 * Push Notification Service (Stubbed for Expo Go SDK 53+ compatibility)
 * Notifications are disabled locally per user request.
 */
export async function registerForPushNotifications() {
  console.log('[Push] Push notifications are disabled in this environment.');
  return null;
}

export function setupNotificationListeners() {
  return () => {};
}

export default { registerForPushNotifications, setupNotificationListeners };
