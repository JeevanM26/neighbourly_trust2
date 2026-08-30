// ─── Browser & System Notification Engine (Worker App) ────────
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }
    if (perm === 'granted' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (swErr) {
        console.warn('[SW Registration Notice]:', swErr);
      }
    }
    return perm;
  } catch {
    return 'denied';
  }
}

export async function sendLocalNotification(title: string, options?: { body?: string; icon?: string; tag?: string }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notifOptions: NotificationOptions = {
    body: options?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: options?.tag || 'hero_hand_worker_alert',
    vibrate: [300, 150, 300, 150, 300] as any,
    renotify: true,
    requireInteraction: true,
  };

  // 1. Primary for Chrome on Android: ServiceWorkerRegistration.showNotification()
  // Chrome on Android BLOCKS new Notification() constructor and requires SW showNotification.
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }
      if (reg) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    } catch (swErr) {
      console.warn('[SW showNotification fallback]:', swErr);
    }
  }

  // 2. Fallback for Desktop Browsers (Chrome, Edge, Firefox, Safari)
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (e) {
    console.warn('[Notification Constructor fallback notice]:', e);
  }

  // 3. Hardware Vibration
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 300]);
    }
  } catch {}
}
