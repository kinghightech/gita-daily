import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { fetchAllFestivals, getFestivalSymbol, type Festival } from './festivals';
import {
  DAILY_WISDOM_NOTIFICATION_HOUR,
  DAILY_WISDOM_NOTIFICATION_MINUTE,
  FESTIVAL_NOTIFICATION_HOUR,
  FESTIVAL_NOTIFICATION_MINUTE,
} from './notificationConfig';

const DAILY_WISDOM_NOTIFICATION_ID = 'daily-wisdom-9am';
const FESTIVAL_NOTIFICATION_ID_PREFIX = 'festival-reminder-';
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
    name: 'Daily reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const requestNotificationPermission = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

const buildLocalNotificationDate = (isoDate: string, hour: number, minute: number) => {
  const [year, month, day] = isoDate.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatFestivalNames = (festivals: Festival[]) => {
  const names = festivals.map((festival) => festival.name);
  if (names.length <= 2) return names.join(' and ');

  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
};

const groupFestivalsByDate = (festivals: Festival[]) => {
  return festivals.reduce<Record<string, Festival[]>>((groups, festival) => {
    if (!groups[festival.main_date]) groups[festival.main_date] = [];
    groups[festival.main_date].push(festival);
    return groups;
  }, {});
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
        title: 'Om Daily',
        body: 'View today’s wisdom',
      },
      // Daily triggers use the device's local time, so this fires at 9:00 AM
      // for the user's current time zone.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: DAILY_WISDOM_NOTIFICATION_HOUR,
        minute: DAILY_WISDOM_NOTIFICATION_MINUTE,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
      // For quick local testing only, temporarily replace this trigger with:
      // { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10 }
    });
  } catch (error) {
    console.warn('Failed to set up daily wisdom notification', error);
  }
};

export const setupFestivalNotifications = async () => {
  try {
    await ensureAndroidNotificationChannel();

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const festivals = await fetchAllFestivals();
    const groupedFestivals = groupFestivalsByDate(festivals);
    const now = new Date();
    const upcomingFestivalGroups = Object.entries(groupedFestivals)
      .map(([mainDate, festivalsForDate]) => ({
        mainDate,
        festivals: festivalsForDate,
        notificationDate: buildLocalNotificationDate(
          mainDate,
          FESTIVAL_NOTIFICATION_HOUR,
          FESTIVAL_NOTIFICATION_MINUTE
        ),
      }))
      .filter(
        (group): group is { mainDate: string; festivals: Festival[]; notificationDate: Date } =>
          !!group.notificationDate && group.notificationDate.getTime() > now.getTime()
      )
      .sort((a, b) => a.notificationDate.getTime() - b.notificationDate.getTime());

    if (upcomingFestivalGroups.length === 0) return;

    await cancelFestivalNotifications();

    for (const group of upcomingFestivalGroups) {
      const [firstFestival] = group.festivals;
      const festivalNames = formatFestivalNames(group.festivals);
      const symbol = getFestivalSymbol(firstFestival.name, firstFestival.icon_emoji);
      const hasMultipleFestivals = group.festivals.length > 1;

      await Notifications.scheduleNotificationAsync({
        identifier: `${FESTIVAL_NOTIFICATION_ID_PREFIX}${group.mainDate}`,
        content: {
          title: hasMultipleFestivals ? 'Festivals today' : `Today is ${firstFestival.name}`,
          body: hasMultipleFestivals
            ? `${symbol} ${festivalNames} are today. Learn their stories and ways to celebrate.`
            : `${symbol} ${firstFestival.name} is today. Learn the story and ways to celebrate.`,
          data: {
            type: hasMultipleFestivals ? 'festivals' : 'festival',
            festivalDate: group.mainDate,
            festivalId: firstFestival.id,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: group.notificationDate,
          ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
        },
      });
    }
  } catch (error) {
    console.warn('Failed to set up festival notifications', error);
  }
};

export const setupDailyReminderNotifications = async () => {
  await setupDailyWisdomNotification();
  await setupFestivalNotifications();
};

export const cancelDailyWisdomNotification = async () => {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_WISDOM_NOTIFICATION_ID);
  } catch (error) {
    console.warn('Failed to cancel daily wisdom notification', error);
  }
};

export const cancelFestivalNotifications = async () => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const festivalNotifications = scheduledNotifications.filter((notification) =>
      notification.identifier.startsWith(FESTIVAL_NOTIFICATION_ID_PREFIX)
    );

    await Promise.all(
      festivalNotifications.map((notification) =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier)
      )
    );
  } catch (error) {
    console.warn('Failed to cancel festival notifications', error);
  }
};

export const cancelDailyReminderNotifications = async () => {
  await cancelDailyWisdomNotification();
  await cancelFestivalNotifications();
};
