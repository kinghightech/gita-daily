import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DAILY_WISDOM_NOTIFICATION_ID = 'daily-wisdom-9am';
const ANDROID_CHANNEL_ID = 'daily-wisdom';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ensureAndroidNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Daily wisdom',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const requestNotificationPermission = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const setupDailyWisdomNotification = async () => {
  try {
    await ensureAndroidNotificationChannel();

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyScheduled = scheduledNotifications.some(
      (notification) => notification.identifier === DAILY_WISDOM_NOTIFICATION_ID
    );

    if (alreadyScheduled) return;

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_WISDOM_NOTIFICATION_ID,
      content: {
        title: 'Dharma Daily',
        body: 'View today’s wisdom',
      },
      // Daily triggers use the device's local time, so this fires at 9:00 AM
      // for the user's current time zone.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
      // For quick local testing only, temporarily replace this trigger with:
      // { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10 }
    });
  } catch (error) {
    console.warn('Failed to set up daily wisdom notification', error);
  }
};

export const cancelDailyWisdomNotification = async () => {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_WISDOM_NOTIFICATION_ID);
  } catch (error) {
    console.warn('Failed to cancel daily wisdom notification', error);
  }
};
