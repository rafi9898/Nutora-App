import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationsService = {
  async requestPermissions() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6D994D',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  async scheduleDailyReminders() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    await Notifications.cancelAllScheduledNotificationsAsync();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pora na obiad! 🍽️',
        body: 'Hej, zapomniałeś o obiedzie? Zrób zdjęcie i dodaj do dziennika!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 14,
        minute: 0,
      },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Czas na kolację! 🥗',
        body: 'Kończysz dzień? Upewnij się, że twój dziennik posiłków jest uzupełniony.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });

    return true;
  },

  async cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};
