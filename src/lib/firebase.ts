import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getClient } from './supabase';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCAD4orBNE9uRelBrwjIXCfbJLOS8UrQzM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hero-hand-e899f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hero-hand-e899f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hero-hand-e899f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "151185918811",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:151185918811:web:c2277629d536df7716e87e",
  measurementId: "G-W1LPL3MJF5"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Register background Service Worker and obtain FCM device push token
 */
export async function registerFcmToken(profileId: string, vapidKey?: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const supported = await isSupported();
    if (!supported) return null;

    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted:', permission);
      return null;
    }

    // 2. Register Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // 3. Get FCM Token
    const messaging = getMessaging(app);
    const effectiveVapidKey = vapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: effectiveVapidKey
    });

    if (!token) return null;

    // 4. Save token to Supabase push_tokens
    const supabase = getClient();
    if (supabase && profileId) {
      await supabase.from('push_tokens').upsert({
        profile_id: profileId,
        token,
        platform: 'web',
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,token' });
    }

    return token;
  } catch (err) {
    console.warn('[FCM] Token registration notice:', err);
    return null;
  }
}

/**
 * Foreground message listener
 */
export async function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};
  try {
    const supported = await isSupported();
    if (!supported) return () => {};

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch {
    return () => {};
  }
}
