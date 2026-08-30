// ─── Browser & System Notification Engine (Worker App) ────────

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  } catch {
    return 'denied';
  }
}

export function sendLocalNotification(title: string, options?: { body?: string; icon?: string; tag?: string }) {
  if (typeof window === 'undefined') return;
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body: options?.body || '',
        icon: options?.icon || '/favicon.ico',
        tag: options?.tag,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (e) {
    console.warn('[Notification] Notice:', e);
  }
}
