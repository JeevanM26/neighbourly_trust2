'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  WorkerProfile, Booking, WorkerSettings,
  ToastState, EarningsSummary, COMMISSION_RATE,
  BookingOffer, ServiceCategory
} from '../lib/types';
import {
  setWorkerOnline, respondToOffer, updateBookingStatus,
  subscribeToBookingOffers, isConfigured, getClient,
  fetchActiveBookings, fetchBookingHistory,
  deleteWorkerAccount, createWorkerProfile, fetchWorkerProfile,
  updateWorkerProfileData, fetchServiceCategories, fetchPendingOffers
} from '../lib/supabase';
import { useWebRTC } from '../hooks/useWebRTC';
import { CallOverlay } from '../components/CallOverlay';
import { CallAudioSynthesizer } from '../lib/callEngine';
import { MapPin } from 'lucide-react';
import { WorkerLocationProvider } from './WorkerLocationContext';
import { WorkerOnlinePlugin } from '../lib/workerOnlinePlugin';

// ─── FCM helpers ────────────────────────────────────────────────
// Lazily imported so Next.js SSR / web builds don't choke on Capacitor imports
async function registerFcmToken(workerId: string): Promise<void> {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    // Request permission
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      console.warn('[FCM] Push permission denied');
      return;
    }

    // Register for FCM
    await PushNotifications.register();

    // Listen for token once
    PushNotifications.addListener('registration', async (token) => {
      console.log('[FCM] Token received:', token.value);
      try {
        const client = getClient();
        if (client && token.value) {
          await client
            .from('worker_profiles')
            .update({ fcm_token: token.value })
            .eq('profile_id', workerId);
          console.log('[FCM] Token saved to Supabase');
        }
      } catch (e) {
        console.error('[FCM] Failed to save token:', e);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[FCM] Registration error:', err);
    });

  } catch (e) {
    console.warn('[FCM] Not available on this platform:', e);
  }
}

async function startForegroundService(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    await WorkerOnlinePlugin.startOnlineService();
    console.log('[Service] Foreground service started');
  } catch (e) {
    console.warn('[Service] Could not start foreground service:', e);
  }
}

async function stopForegroundService(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    await WorkerOnlinePlugin.stopOnlineService();
    console.log('[Service] Foreground service stopped');
  } catch (e) {
    console.warn('[Service] Could not stop foreground service:', e);
  }
}

// ─── Context Shape ─────────────────────────────────────────
interface WorkerContextType {
  worker: WorkerProfile | null;
  isLoggedIn: boolean;
  isNewWorker: boolean;
  categories: ServiceCategory[];
  isAuthLoading: boolean;
  loginWorker: (phone: string, authUserId: string) => void;
  completeOnboarding: (name: string, categoryIds: string[]) => void;
  logoutWorker: () => void;
  deleteAccount: () => Promise<void>;
  updateProfileData: (name: string, categoryIds: string[]) => Promise<boolean>;

  isOnline: boolean;
  toggleOnline: () => Promise<void>;

  offers: BookingOffer[];
  activeBookings: Booking[];
  completedBookings: Booking[];
  isLoading: boolean;
  
  refreshBookings: () => Promise<void>;
  
  acceptOffer: (offerId: string, bookingId: string) => Promise<void>;
  declineOffer: (offerId: string, bookingId: string, status?: 'declined' | 'timed_out') => Promise<void>;
  updateJobStatus: (id: string, status: Booking['status'], finalPrice?: number) => Promise<void>;

  earnings: EarningsSummary;
  earningsPeriod: 'today' | 'week' | 'month';
  setEarningsPeriod: (p: 'today' | 'week' | 'month') => void;

  settings: WorkerSettings;
  setLanguage: (lang: WorkerSettings['language']) => void;
  toggleSound: () => void;

  toast: ToastState | null;
  showToast: (msg: string, type?: ToastState['type']) => void;
  dismissToast: () => void;

  webrtc: ReturnType<typeof useWebRTC>;
}

const WorkerContext = createContext<WorkerContextType | null>(null);
export const useWorker = () => {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error('useWorker must be inside WorkerProvider');
  return ctx;
};

// ─── Default Category Base Rates & Earnings Calculator ─────────────────
const DEFAULT_CATEGORY_RATES: Record<string, number> = {
  Electrician: 350,
  Plumber: 350,
  Carpenter: 400,
  'Home Clean': 500,
  Painter: 600,
  'Pest Control': 750,
};

export function getBookingAmount(b: Booking): number {
  if (b.final_price && b.final_price > 0) return b.final_price;
  if (b.price_estimate && b.price_estimate > 0) return b.price_estimate;
  const name = b.category_name || '';
  return DEFAULT_CATEGORY_RATES[name] || 350;
}

function calcEarnings(bookings: Booking[], period: 'today' | 'week' | 'month'): EarningsSummary {
  const now = new Date();
  const start = new Date();
  if (period === 'today') start.setHours(0, 0, 0, 0);
  else if (period === 'week') start.setDate(now.getDate() - 7);
  else start.setMonth(now.getMonth() - 1);

  const filtered = bookings.filter(b =>
    b.status === 'completed' && new Date(b.created_at) >= start
  );

  const gross = filtered.reduce((s, b) => s + getBookingAmount(b), 0);
  const commission = Math.round(gross * COMMISSION_RATE);

  const byCat: Record<string, { amount: number; count: number }> = {};
  filtered.forEach(b => {
    const key = b.category_name || b.category_id || 'Services';
    if (!byCat[key]) byCat[key] = { amount: 0, count: 0 };
    const price = getBookingAmount(b);
    byCat[key].amount += Math.round(price * (1 - COMMISSION_RATE));
    byCat[key].count += 1;
  });

  return {
    gross,
    commission,
    net: gross - commission,
    jobs_count: filtered.length,
    period,
    by_category: Object.entries(byCat).map(([category, v]) => ({ category, ...v })),
  };
}

// ─── Provider ─────────────────────────────────────────────
export const WorkerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [worker, setWorker] = useState<WorkerProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('nt_worker') ?? 'null'); } catch { return null; }
  });
  const [isNewWorker, setIsNewWorker] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const savedOnline = localStorage.getItem('nt_worker_online');
      if (savedOnline !== null) return JSON.parse(savedOnline);
      const savedWorker = JSON.parse(localStorage.getItem('nt_worker') ?? 'null');
      return !!savedWorker?.is_online;
    } catch { return false; }
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  
  const [offers, setOffers] = useState<BookingOffer[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [settings, setSettings] = useState<WorkerSettings>(() => {
    if (typeof window === 'undefined') return { language: 'en', sounds: true, notifications: true };
    try { return JSON.parse(localStorage.getItem('nt_worker_settings') ?? 'null') ?? { language: 'en', sounds: true, notifications: true }; }
    catch { return { language: 'en', sounds: true, notifications: true }; }
  });
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeRef = useRef<any>(null);
  const accessTokenRef = useRef<string | null>(null);

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const webrtc = useWebRTC(worker?.id || '');

  // Persist worker profile and online status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nt_worker', JSON.stringify(worker));
    }
  }, [worker]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nt_worker_online', JSON.stringify(isOnline));
    }
  }, [isOnline]);

  useEffect(() => {
    const fetchCats = async () => {
      const cats = await fetchServiceCategories();
      setCategories(cats);
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const client = getClient();
    if (client) {
      const handleWorkerSession = async (authUser: any) => {
        try {
          const prof = await fetchWorkerProfile(authUser.id);
          const userEmail = authUser.email || '';
          const userPhone = authUser.phone || authUser.user_metadata?.phone || prof?.phone || '';
          const hasCategories = (prof?.categories && prof.categories.length > 0) || (prof?.skills && prof.skills.length > 0);
          const hasValidPhone = !!userPhone && userPhone.replace(/\D/g, '').length >= 10;

          if (prof && prof.full_name && prof.full_name.trim() !== '' && prof.full_name !== 'Deleted User' && hasValidPhone && hasCategories) {
            const savedOnline = typeof window !== 'undefined' ? localStorage.getItem('nt_worker_online') : null;
            const effectiveOnline = savedOnline !== null ? JSON.parse(savedOnline) : prof.is_online;
            setWorker({ ...prof, is_online: effectiveOnline, phone: userPhone, email: userEmail || prof.email });
            setIsOnline(effectiveOnline);
            setIsNewWorker(false);
          } else {
            const defaultName = prof?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Partner';
            const initialProf: WorkerProfile = {
              id: authUser.id,
              full_name: defaultName,
              phone: userPhone,
              email: userEmail,
              language: 'en',
              avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || undefined,
              rating: prof?.rating || 5.0,
              review_count: prof?.review_count || 0,
              experience_years: prof?.experience_years || 1,
              skills: prof?.skills || [],
              categories: prof?.categories || [],
              is_online: true,
              wallet_balance: prof?.wallet_balance || 0,
              created_at: prof?.created_at || new Date().toISOString(),
            };
            setWorker(initialProf);
            setIsNewWorker(true);
          }
        } catch (err) {
          console.error("Worker Auth error:", err);
        }
      };

      // Native Deep Link Listener for Google OAuth Return in Worker App
      // Uses safe string-index parsing (no new URL()) to support custom schemes
      const handleCustomUrl = async (urlStr: string) => {
        try {
          if (!urlStr || !client) return;

          // 1. Try parsing query params (PKCE flow e.g. ?code=...)
          const qIndex = urlStr.indexOf('?');
          if (qIndex !== -1) {
            const queryPart = urlStr.substring(qIndex + 1).split('#')[0];
            const qParams = new URLSearchParams(queryPart);
            const code = qParams.get('code');
            if (code) {
              const { data } = await client.auth.exchangeCodeForSession(code);
              if (data?.user) {
                await handleWorkerSession(data.user);
                return;
              }
            }
            const qAccess = qParams.get('access_token');
            const qRefresh = qParams.get('refresh_token');
            if (qAccess && qRefresh) {
              const { data } = await client.auth.setSession({
                access_token: qAccess,
                refresh_token: qRefresh,
              });
              if (data?.user) {
                await handleWorkerSession(data.user);
                return;
              }
            }
          }

          // 2. Try parsing hash fragment (Implicit flow e.g. #access_token=...&refresh_token=...)
          const hashIndex = urlStr.indexOf('#');
          if (hashIndex !== -1) {
            const hash = urlStr.substring(hashIndex + 1);
            const params = new URLSearchParams(hash);
            const code = params.get('code');
            if (code) {
              const { data } = await client.auth.exchangeCodeForSession(code);
              if (data?.user) {
                await handleWorkerSession(data.user);
                return;
              }
            }
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken) {
              const { data } = await client.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (data?.user) {
                await handleWorkerSession(data.user);
                return;
              }
            }
          }
        } catch (err) {
          console.warn('[DeepLink Worker Auth Error]', err);
        }
      };

      // Handle case where app was opened via deep link with auth params
      if (typeof window !== 'undefined') {
        if (window.location.hash.includes('access_token') || window.location.href.includes('code=')) {
          handleCustomUrl(window.location.href);
        }
      }

      let appListenerCleanup: (() => void) | null = null;
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', async (data) => {
          setTimeout(async () => {
            try {
              const { Browser } = await import('@capacitor/browser');
              await Browser.close().catch(() => {});
            } catch (e) {}
          }, 500);
          handleCustomUrl(data.url);
        }).then((handle) => {
          appListenerCleanup = () => handle.remove();
        });
      }).catch(() => {});

      // ── Get existing session on mount ──
      client!.auth.getSession().then(async ({ data }) => {
        if (data.session?.user) {
          accessTokenRef.current = data.session.access_token;
          await handleWorkerSession(data.session.user);
        }
        setIsAuthLoading(false);
      }).catch(err => {
        console.error("Auth error:", err);
        setIsAuthLoading(false);
      });

      // ── Listen for auth state changes (fires on SIGNED_IN after deep link) ──
      const { data: { subscription } } = client!.auth.onAuthStateChange(async (event, session) => {
        console.log('[WorkerAuth] onAuthStateChange:', event, !!session);
        if (session) {
          accessTokenRef.current = session.access_token;
        } else {
          accessTokenRef.current = null;
        }
        if (event === 'SIGNED_IN' && session?.user) {
          await handleWorkerSession(session.user);
        } else if (event === 'SIGNED_OUT' || !session) {
          setWorker(null);
          setActiveBookings([]);
          setCompletedBookings([]);
          setIsOnline(false);
          localStorage.removeItem('nt_worker');
          localStorage.removeItem('nt_worker_online');
        }
        setIsAuthLoading(false);
      });

      return () => {
        subscription.unsubscribe();
        if (appListenerCleanup) appListenerCleanup();
      };
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('nt_worker_settings', JSON.stringify(settings));
  }, [settings]);

  // Toast
  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now().toString(), message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  // Bookings
  const refreshBookings = useCallback(async () => {
    if (!worker) return;
    setIsLoading(true);
    const active = await fetchActiveBookings(worker.id);
    const history = await fetchBookingHistory(worker.id);
    setActiveBookings(active);
    setCompletedBookings(history);
    setIsLoading(false);
  }, [worker]);

  useEffect(() => {
    if (!worker) return;
    refreshBookings();

    // Fetch any existing pending offers on mount
    fetchPendingOffers(worker.id).then(pending => {
      if (pending && pending.length > 0) {
        setOffers(pending);
      }
    });

    // Real-time subscription to Booking Offers
    const alertSynth = new CallAudioSynthesizer();
    const channel = subscribeToBookingOffers(worker.id, (newOffer) => {
      // Auto dismiss after 30s happens in the UI component, but we add it to state here
      setOffers(prev => {
        // avoid duplicates
        if (prev.find(o => o.id === newOffer.id)) return prev;
        return [newOffer, ...prev];
      });

      const customerName = newOffer.booking?.customer_name || 'Customer';
      const categoryName = newOffer.booking?.category_name || 'Service';
      const addressText = newOffer.booking?.address_text || 'Nearby Location';

      // 1. Play loud attention-grabbing arpeggio and speech (when in foreground)
      try {
        alertSynth.playNewBookingAlert(customerName, categoryName);
      } catch (e) {}

      // 2. Trigger native Android notification with sound & vibration (works in background & pocket)
      WorkerOnlinePlugin.triggerBookingAlert({
        title: `🚨 New ${categoryName} Booking Request!`,
        message: `${customerName} wants to book you (${addressText}). Tap to view and accept!`,
        bookingId: newOffer.booking_id,
      }).catch((err) => {
        console.warn('[Alert] Native alert fallback:', err);
      });

      // 3. Show in-app toast
      showToast(`🔔 New ${categoryName} offer from ${customerName}!`, 'info');
    });
    realtimeRef.current = channel;
    return () => {
      alertSynth.stop();
      channel?.unsubscribe();
    };
  }, [worker, refreshBookings, showToast]);

  // Auth
  const loginWorker = useCallback((phone: string, authUserId: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if worker profile exists in DB (by ID or phone)
    fetchWorkerProfile(authUserId, cleanPhone).then(profile => {
      if (profile && profile.full_name && profile.full_name.trim() !== '' && profile.full_name !== 'Deleted User') {
        const savedOnline = typeof window !== 'undefined' ? localStorage.getItem('nt_worker_online') : null;
        const effectiveOnline = savedOnline !== null ? JSON.parse(savedOnline) : profile.is_online;
        setWorker({ ...profile, is_online: effectiveOnline, phone: cleanPhone });
        setIsOnline(effectiveOnline);
        setIsNewWorker(false);
        return;
      } else {
        // Profile exists with name, just needs skills selection
        setWorker({ ...profile, phone: cleanPhone } as WorkerProfile);
        setIsNewWorker(true);
        return;
      }
    });
  }, [showToast]);

  const completeOnboarding = useCallback(async (name: string, categoryIds: string[], phone?: string) => {
    if (!worker?.id) return;
    const effectivePhone = phone || worker.phone;
    
    const success = await createWorkerProfile({
      id: worker.id,
      name: name,
      categoryIds,
      phone: effectivePhone
    });
    
    if (success) {
      const profile = await fetchWorkerProfile(worker.id, effectivePhone);
      if (profile) setWorker({ ...profile, phone: effectivePhone });
      setIsNewWorker(false);
      showToast('Profile created! You\'re ready to take bookings 🎉');
    } else {
      showToast('Failed to create profile. Try again.', 'error');
    }
  }, [worker, showToast]);

  const updateProfileData = useCallback(async (name: string, categoryIds: string[]) => {
    if (!worker?.id) return false;
    const success = await updateWorkerProfileData(worker.id, name, categoryIds);
    if (success) {
      const profile = await fetchWorkerProfile(worker.id);
      if (profile) setWorker({ ...profile, phone: worker.phone });
      showToast('Profile updated successfully! ✅');
      return true;
    } else {
      showToast('Failed to update profile.', 'error');
      return false;
    }
  }, [worker, showToast]);

  const logoutWorker = useCallback(() => {
    realtimeRef.current?.unsubscribe();
    
    // Stop foreground service and set offline in DB
    stopForegroundService().catch(() => {});
    const savedWorker = typeof window !== 'undefined' ? localStorage.getItem('nt_worker') : null;
    if (savedWorker) {
      try {
        const parsed = JSON.parse(savedWorker);
        if (parsed && parsed.id) {
          import('../lib/supabase').then(({ setWorkerOnline }) => {
            setWorkerOnline(parsed.id, false, null, null).catch(() => {});
          });
        }
      } catch (e) {}
    }

    setWorker(null);
    setActiveBookings([]);
    setCompletedBookings([]);
    setIsOnline(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nt_worker');
      localStorage.removeItem('nt_worker_online');
    }
    
    const client = getClient();
    if (client) {
      client.auth.signOut().catch(() => {});
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!worker?.id) return;
    const success = await deleteWorkerAccount(worker.id);
    if (success) {
      logoutWorker();
      showToast('Account deleted successfully.');
    } else {
      showToast('Failed to delete account.', 'error');
    }
  }, [worker, logoutWorker, showToast]);

  // Online toggle & Location Stream (Strict GPS Required)
  const toggleOnline = useCallback(async (): Promise<boolean> => {
    if (!worker) return false;
    const next = !isOnline;

    if (next) {
      // ── Going Online: STRICT LOCATION ENFORCEMENT ──
      if (typeof window === 'undefined' || !navigator.geolocation) {
        showToast('📍 Live GPS is required. Your device does not support GPS.', 'error');
        return false;
      }

      showToast('Acquiring high-accuracy GPS lock… 🛰️', 'info');

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
          );
        });

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setIsOnline(true);
        setWorker(prev => prev ? { ...prev, is_online: true, location: { lat, lng } } : null);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nt_worker_online', JSON.stringify(true));
        }

        // 1. Register FCM token (so backend can send push when app is closed)
        registerFcmToken(worker.id).catch(() => {});

        // 2. Start foreground service (keeps process alive in pocket/background)
        startForegroundService().catch(() => {});

        // 3. Update location + online status in DB
        await setWorkerOnline(worker.id, true, lat, lng);
        showToast("You're online with live GPS broadcast! 🟢", 'success');
        return true;
      } catch (geoError: any) {
        console.warn('Strict GPS required error:', geoError);
        setIsOnline(false);
        setWorker(prev => prev ? { ...prev, is_online: false } : null);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nt_worker_online', JSON.stringify(false));
        }
        await setWorkerOnline(worker.id, false, null, null);
        
        let msg = '📍 Strict Location Required: Please enable GPS/Location permissions to go Online.';
        if (geoError?.code === 1) {
          msg = '📍 Permission Denied: You must grant Location access in your phone settings to receive customer jobs.';
        } else if (geoError?.code === 2) {
          msg = '📍 GPS Signal Unavailable: Please turn ON your device GPS/Location and try again.';
        } else if (geoError?.code === 3) {
          msg = '📍 GPS Timed Out: Please ensure you have GPS signal and try again.';
        }
        showToast(msg, 'error');
        return false;
      }
    } else {
      // ── Going Offline ─────────────────────────────────────────
      setIsOnline(false);
      setWorker(prev => prev ? { ...prev, is_online: false } : null);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nt_worker_online', JSON.stringify(false));
      }
      stopForegroundService().catch(() => {});
      await setWorkerOnline(worker.id, false, null, null);
      showToast("You're offline", 'info');
      return true;
    }
  }, [isOnline, worker, showToast]);

  // Offer actions
  const acceptOffer = useCallback(async (offerId: string, bookingId: string) => {
    const ok = await respondToOffer(offerId, bookingId, 'accepted');
    if (ok) {
      // Remove offer from queue
      setOffers(prev => prev.filter(o => o.id !== offerId));
      await refreshBookings();
      showToast('Booking accepted! Head to the location. 🚗');
    } else {
      showToast('Failed to accept booking. It may have expired.', 'error');
    }
  }, [showToast, refreshBookings]);

  const declineOffer = useCallback(async (offerId: string, bookingId: string, status: 'declined' | 'timed_out' = 'declined') => {
    await respondToOffer(offerId, bookingId, status);
    setOffers(prev => prev.filter(o => o.id !== offerId));
    showToast(status === 'declined' ? 'Booking declined.' : 'Booking offer timed out.', 'info');
  }, [showToast]);

  // Active Job Lifecycle
  const updateJobStatus = useCallback(async (id: string, status: Booking['status'], finalPrice?: number) => {
    const ok = await updateBookingStatus(id, status, finalPrice);
    if (ok) {
      if (status === 'completed' || status === 'cancelled') {
        const netAmt = finalPrice ? Math.round(finalPrice * (1 - COMMISSION_RATE)) : null;
        showToast(
          status === 'completed' 
            ? `🎉 Job marked complete! ${netAmt ? `+₹${netAmt} added to earnings.` : 'Earnings updated. 💰'}` 
            : 'Job cancelled.', 
          'success'
        );
        await refreshBookings(); // will move it to history and recalculate earnings
      } else {
        // Update local state for in-progress / on_the_way
        setActiveBookings(prev => prev.map(b => b.id === id ? { ...b, status, ...(finalPrice ? { final_price: finalPrice } : {}) } : b));
        showToast(`Job status updated to ${status.replace('_', ' ')}`);
      }
    } else {
      showToast('Failed to update job status', 'error');
    }
  }, [showToast, refreshBookings]);

  // Settings
  const setLanguage = useCallback((lang: WorkerSettings['language']) => {
    setSettings(s => ({ ...s, language: lang }));
  }, []);
  
  const toggleSound = useCallback(() => {
    setSettings(s => ({ ...s, sounds: !s.sounds }));
  }, []);

  // Derived
  const earnings = calcEarnings(completedBookings, earningsPeriod);

  return (
    <WorkerContext.Provider value={{
      worker, isLoggedIn: !!worker && !isNewWorker, isNewWorker, isAuthLoading, categories,
      loginWorker, completeOnboarding, logoutWorker, deleteAccount, updateProfileData,
      isOnline, toggleOnline,
      offers, activeBookings, completedBookings,
      isLoading, refreshBookings,
      acceptOffer, declineOffer, updateJobStatus,
      earnings, earningsPeriod, setEarningsPeriod,
      settings, setLanguage, toggleSound,
      toast, showToast, dismissToast,
      webrtc,
    }}>
      <WorkerLocationProvider>
        <CallOverlay webrtc={webrtc} />
        {children}
      </WorkerLocationProvider>
    </WorkerContext.Provider>
  );
};
