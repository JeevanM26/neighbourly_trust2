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
  updateWorkerProfileData, fetchServiceCategories
} from '../lib/supabase';
import { useWebRTC } from '../hooks/useWebRTC';
import { CallOverlay } from '../components/CallOverlay';
import { MapPin } from 'lucide-react';

// ─── Context Shape ─────────────────────────────────────────
interface WorkerContextType {
  worker: WorkerProfile | null;
  isLoggedIn: boolean;
  isNewWorker: boolean;
  categories: ServiceCategory[];
  isAuthLoading: boolean;
  loginWorker: (phone: string, name: string, authUserId: string) => void;
  completeOnboarding: (categoryIds: string[]) => void;
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
  updateJobStatus: (id: string, status: Booking['status']) => Promise<void>;

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

// ─── Earnings Calculator ───────────────────────────────────
function calcEarnings(bookings: Booking[], period: 'today' | 'week' | 'month'): EarningsSummary {
  const now = new Date();
  const start = new Date();
  if (period === 'today') start.setHours(0, 0, 0, 0);
  else if (period === 'week') start.setDate(now.getDate() - 7);
  else start.setMonth(now.getMonth() - 1);

  const filtered = bookings.filter(b =>
    b.status === 'completed' && new Date(b.created_at) >= start
  );

  const gross = filtered.reduce((s, b) => s + (b.final_price || b.price_estimate || 0), 0);
  const commission = gross * COMMISSION_RATE;

  const byCat: Record<string, { amount: number; count: number }> = {};
  filtered.forEach(b => {
    const key = b.category_name || b.category_id;
    if (!byCat[key]) byCat[key] = { amount: 0, count: 0 };
    const price = b.final_price || b.price_estimate || 0;
    byCat[key].amount += price * (1 - COMMISSION_RATE);
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
  const [isOnline, setIsOnline] = useState(false);
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
  const geoWatchRef = useRef<number | null>(null);
  const persistentNotifRef = useRef<Notification | null>(null);


  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const webrtc = useWebRTC(worker?.id || '');

  // Persist & Supabase Auth Session
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('nt_worker', JSON.stringify(worker));
    if (worker) setIsOnline(worker.is_online);
  }, [worker]);

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
      client!.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const savedWorker = localStorage.getItem('nt_worker');
          if (savedWorker) {
            try { setWorker(JSON.parse(savedWorker)); } catch {}
          }
        }
        setIsAuthLoading(false);
      }).catch(err => {
        console.error("Auth error:", err);
        setIsAuthLoading(false);
      });

      const { data: { subscription } } = client!.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setWorker(null);
          setActiveBookings([]);
          setCompletedBookings([]);
          localStorage.removeItem('nt_worker');
          if (geoWatchRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.clearWatch(geoWatchRef.current);
            geoWatchRef.current = null;
          }
        }
        setIsAuthLoading(false);
      });

      const handleBeforeUnload = () => {
        const savedWorker = localStorage.getItem('nt_worker');
        if (savedWorker) {
          try {
            const parsed = JSON.parse(savedWorker);
            if (parsed && parsed.id) {
              // Fire-and-forget fetch with keepalive to ensure it reaches Supabase
              fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/worker_profiles?profile_id=eq.${parsed.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ is_online: false }),
                keepalive: true
              }).catch(() => {});
            }
          } catch (e) {}
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', handleBeforeUnload);
      }

      return () => {
        subscription.unsubscribe();
        if (typeof window !== 'undefined') {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        }
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

    // Real-time subscription to Booking Offers
    const channel = subscribeToBookingOffers(worker.id, (newOffer) => {
      // Auto dismiss after 30s happens in the UI component, but we add it to state here
      setOffers(prev => {
        // avoid duplicates
        if (prev.find(o => o.id === newOffer.id)) return prev;
        return [newOffer, ...prev];
      });
      showToast(`🔔 New ${newOffer.booking?.category_name || 'Job'} offer!`, 'info');
      // Browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Job Offer!', {
          body: `A new job is waiting for you to accept.`,
          icon: '/icon-192.png',
        });
      }
    });
    realtimeRef.current = channel;
    return () => { channel?.unsubscribe(); };
  }, [worker, refreshBookings, showToast]);

  // Auth
  const loginWorker = useCallback((phone: string, name: string, authUserId: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if worker profile exists in DB
    fetchWorkerProfile(authUserId).then(profile => {
      if (profile && profile.full_name !== 'Deleted User') {
        setWorker({ ...profile, phone: cleanPhone });
        showToast(`Welcome back, ${profile.full_name.split(' ')[0]}! 👋`);
      } else {
        // New worker — needs onboarding
        setWorker({
          id: authUserId,
          full_name: name,
          phone: cleanPhone,
          language: 'en',
          is_online: false,
          is_verified: false,
          rating: 5.0,
          total_jobs: 0,
          years_experience: 0,
          service_radius_km: 8,
          categories: [],
        });
        setIsNewWorker(true);
      }
    });
  }, [showToast]);

  const completeOnboarding = useCallback(async (categoryIds: string[]) => {
    if (!worker?.id) return;
    
    const success = await createWorkerProfile({
      id: worker.id,
      name: worker.full_name,
      categoryIds
    });
    
    if (success) {
      const profile = await fetchWorkerProfile(worker.id);
      if (profile) setWorker({ ...profile, phone: worker.phone });
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
    
    // Set offline in DB
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
    if (typeof window !== 'undefined') localStorage.removeItem('nt_worker');
    
    if (geoWatchRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(geoWatchRef.current);
      geoWatchRef.current = null;
    }
    
    if (persistentNotifRef.current) {
      persistentNotifRef.current.close();
      persistentNotifRef.current = null;
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

  // Online toggle & Location Stream
  const toggleOnline = useCallback(async () => {
    if (!worker) return;
    const next = !isOnline;

    setIsOnline(next);
    setWorker(prev => prev ? { ...prev, is_online: next } : null);

    if (next && typeof window !== 'undefined' && navigator.geolocation) {
      // Request notification permission when going online
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // First position update immediately
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await setWorkerOnline(worker.id, true, pos.coords.latitude, pos.coords.longitude);
      }, () => {
        setWorkerOnline(worker.id, true, null, null);
      }, { timeout: 10000 });

      // Start watching position (foreground streaming)
      let lastUpdate = 0;
      geoWatchRef.current = navigator.geolocation.watchPosition(async (pos) => {
        const now = Date.now();
        // Throttle updates to Supabase (e.g. max once every 20s)
        if (now - lastUpdate > 20000) {
          lastUpdate = now;
          await setWorkerOnline(worker.id, true, pos.coords.latitude, pos.coords.longitude);
        }
      }, (err) => {
        console.warn("Location watch error", err);
      }, {
        enableHighAccuracy: true,
        maximumAge: 10000,
      });

      // Show persistent notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        persistentNotifRef.current = new Notification('Neighborly Trust', {
          body: "You're online and visible to nearby customers",
          icon: '/icon-192.png',
          requireInteraction: true,
          tag: 'nt-worker-online'
        });
      }

      showToast('You\'re online — ready for bookings! ✅', 'success');
    } else {
      // Offline
      if (geoWatchRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
      if (persistentNotifRef.current) {
        persistentNotifRef.current.close();
        persistentNotifRef.current = null;
      }
      await setWorkerOnline(worker.id, false, null, null);
      showToast('You\'re offline', 'info');
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
  const updateJobStatus = useCallback(async (id: string, status: Booking['status']) => {
    const ok = await updateBookingStatus(id, status);
    if (ok) {
      if (status === 'completed' || status === 'cancelled') {
        showToast(status === 'completed' ? 'Job marked complete! Earnings updated. 💰' : 'Job cancelled.', 'success');
        await refreshBookings(); // will move it to history
      } else {
        // Update local state for in-progress / on_the_way
        setActiveBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
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
      <CallOverlay webrtc={webrtc} />
      {children}
    </WorkerContext.Provider>
  );
};
