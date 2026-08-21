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
import { CallAudioSynthesizer } from '../lib/callEngine';
import { MapPin } from 'lucide-react';
import { WorkerLocationProvider } from './WorkerLocationContext';

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
      client!.auth.getSession().then(async ({ data }) => {
        if (data.session?.user) {
          accessTokenRef.current = data.session.access_token;
          const authUser = data.session.user;
          const prof = await fetchWorkerProfile(authUser.id);
          if (prof && prof.full_name && prof.full_name.trim() !== '' && prof.full_name !== 'Deleted User') {
            const savedOnline = typeof window !== 'undefined' ? localStorage.getItem('nt_worker_online') : null;
            const effectiveOnline = savedOnline !== null ? JSON.parse(savedOnline) : prof.is_online;
            setWorker({ ...prof, is_online: effectiveOnline, phone: authUser.phone || prof.phone || '' });
            setIsOnline(effectiveOnline);
          } else {
            const savedWorker = localStorage.getItem('nt_worker');
            if (savedWorker) {
              try { setWorker(JSON.parse(savedWorker)); } catch {}
            }
          }
        }
        setIsAuthLoading(false);
      }).catch(err => {
        console.error("Auth error:", err);
        setIsAuthLoading(false);
      });

      const { data: { subscription } } = client!.auth.onAuthStateChange((event, session) => {
        if (session) {
          accessTokenRef.current = session.access_token;
        } else {
          accessTokenRef.current = null;
        }
        if (event === 'SIGNED_OUT' || !session) {
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
    const alertSynth = new CallAudioSynthesizer();
    const channel = subscribeToBookingOffers(worker.id, (newOffer) => {
      // Auto dismiss after 30s happens in the UI component, but we add it to state here
      setOffers(prev => {
        // avoid duplicates
        if (prev.find(o => o.id === newOffer.id)) return prev;
        return [newOffer, ...prev];
      });

      // Play loud attention-grabbing arpeggio and trigger urgent phone vibration
      alertSynth.playNewBookingAlert(
        newOffer.booking?.customer_name || 'Customer',
        newOffer.booking?.category_name || 'Job'
      );

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
        if (profile.categories && profile.categories.length > 0) {
          setWorker({ ...profile, phone: cleanPhone });
          showToast(`Welcome back, ${profile.full_name.split(' ')[0]}! 👋`);
          setIsNewWorker(false);
          return;
        } else {
          // Profile exists with name, just needs skills selection
          setWorker({ ...profile, phone: cleanPhone });
          setIsNewWorker(true);
          return;
        }
      }
      
      // New worker — needs onboarding
      setWorker({
        id: authUserId,
        full_name: '', // Will be set during onboarding
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
    });
  }, [showToast]);

  const completeOnboarding = useCallback(async (name: string, categoryIds: string[]) => {
    if (!worker?.id) return;
    
    const success = await createWorkerProfile({
      id: worker.id,
      name: name,
      categoryIds,
      phone: worker.phone
    });
    
    if (success) {
      const profile = await fetchWorkerProfile(worker.id, worker.phone);
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

  // Online toggle & Location Stream
  const toggleOnline = useCallback(async () => {
    if (!worker) return;
    const next = !isOnline;

    setIsOnline(next);
    setWorker(prev => prev ? { ...prev, is_online: next } : null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nt_worker_online', JSON.stringify(next));
    }

    if (next) {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await setWorkerOnline(worker.id, true, pos.coords.latitude, pos.coords.longitude);
          },
          async () => {
            await setWorkerOnline(worker.id, true, null, null);
          },
          { timeout: 8000 }
        );
      } else {
        await setWorkerOnline(worker.id, true, null, null);
      }
      showToast("You're online — ready for bookings! ✅", 'success');
    } else {
      // Offline
      await setWorkerOnline(worker.id, false, null, null);
      showToast("You're offline", 'info');
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
      <WorkerLocationProvider>
        <CallOverlay webrtc={webrtc} />
        {children}
      </WorkerLocationProvider>
    </WorkerContext.Provider>
  );
};
