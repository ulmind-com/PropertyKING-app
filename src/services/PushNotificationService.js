import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { userAPI } from '../api';

// How notifications should be handled when the app is foregrounded
if (Constants.appOwnership !== 'expo') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const PushNotificationService = {
  async registerForPushNotificationsAsync() {
    let token;

    // SDK 53+ removed push notification support from Expo Go. We must bypass it to prevent errors.
    if (Constants.appOwnership === 'expo') {
      console.log('Skipping push notification setup: Not supported in Expo Go (SDK 53+)');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('propertyking_channel', {
        name: 'PropertyKING Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      try {
        // Direct FCM token bypasses Expo's servers completely
        const tokenData = await Notifications.getDevicePushTokenAsync();
        
        if (tokenData && tokenData.data) {
          token = tokenData.data;
          console.log('Got FCM Device Token:', token);

          // Send to backend
          if (token) {
            try {
              await userAPI.updateFCMToken(token);
              console.log('Successfully synced token with backend');
            } catch (e) {
              console.log('Failed to sync token with backend:', e);
            }
          }
        }
      } catch (e) {
        console.log('Error getting push token:', e);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  },

  setupNotificationListeners(navigation) {
    if (Constants.appOwnership === 'expo') {
      return () => {};
    }

    // When a notification is received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification received:', notification.request.content.title);
      // We can also update a context or state here if needed
    });

    // When the user taps a notification
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped, payload:', data);
      
      // Navigate based on notification type
      if (data?.type === 'new_inquiry' || data?.type === 'inquiry_response') {
        if (navigation) {
          // If we have a navigation ref, navigate to Inquiries
          navigation.navigate('ProfileTab', { screen: 'Inquiries' });
        }
      }
    });

    return () => {
      foregroundSubscription.remove();
      backgroundSubscription.remove();
    };
  }
};
