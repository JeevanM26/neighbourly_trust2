// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyCAD4orBNE9uRelBrwjIXCfbJLOS8UrQzM",
  authDomain: "hero-hand-e899f.firebaseapp.com",
  projectId: "hero-hand-e899f",
  storageBucket: "hero-hand-e899f.firebasestorage.app",
  messagingSenderId: "151185918811",
  appId: "1:151185918811:web:c2277629d536df7716e87e"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[Worker firebase-messaging-sw.js] Received background message: ', payload);

  const title = payload.notification?.title || payload.data?.title || '🚨 Hero Hand Partner Alert';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'New booking or customer call.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [300, 150, 300, 150, 300],
    tag: payload.data?.tag || 'hero_hand_worker_alert',
    renotify: true,
    requireInteraction: true,
    data: payload.data || {}
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
