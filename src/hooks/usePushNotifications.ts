import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      registerPush();
    }
  }, []);

  const registerPush = async () => {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission denied');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (t) => {
      console.log('Push registration success, token: ' + t.value);
      setToken(t.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on push registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });
  };

  return { token };
}
