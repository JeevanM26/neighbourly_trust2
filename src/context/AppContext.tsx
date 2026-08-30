'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserProfile, WorkerProfile, Booking, AppSettings, LanguageCode, ToastState,
  DEFAULT_LOCATION, OWNER_PHONES, ServiceCategory
} from '../lib/types';
import { fetchCustomerBookings, createBooking, upsertProfile, isConfigured, getClient, subscribeToBookingStatus, fetchServiceCategories, deleteCustomerAccount, subscribeToCustomerOffers } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { useWebRTC } from '../hooks/useWebRTC';
import { CallOverlay } from '../components/CallOverlay';
import { PermissionModal } from '../components/PermissionModal';
import { MapPin } from 'lucide-react';

import { getTranslation } from '../lib/i18n';
import { sendLocalNotification, requestNotificationPermission } from '../lib/notifications';
import { registerFcmToken } from '../lib/firebase';

export function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface AppContextType {
  // Auth
  user: UserProfile | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  loginUser: (phone: string, name: string, authUserId: string) => void;
  logoutUser: () => void;
  deleteAccount: () => Promise<boolean>;

  // Data
  categories: ServiceCategory[];
  bookings: Booking[];
  isLoading: boolean;
  refreshBookings: () => Promise<void>;

  // Actions
  bookWorker: (categoryId: string, workerId: string, exactLocation?: { lat: number, lng: number }) => Promise<string | null>;

  // Settings
  settings: AppSettings;
  setLanguage: (lang: LanguageCode) => void;
  toggleSounds: () => void;
  toggleVoice: () => void;

  // UI
  toast: ToastState | null;
  showToast: (message: string, type?: ToastState['type']) => void;
  dismissToast: () => void;
  translate: (key: string) => string;
  t: (key: string) => string;
  
  webrtc: ReturnType<typeof useWebRTC>;

  workers: WorkerProfile[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('nt_user') ?? 'null'); } catch { return null; }
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return { language: 'en', sounds: true, voice: false };
    try { return JSON.parse(localStorage.getItem('nt_settings') ?? 'null') ?? { language: 'en', sounds: true, voice: false }; }
    catch { return { language: 'en', sounds: true, voice: false }; }
  });
  const webrtc = useWebRTC(user?.id || '');

  // Load initial settings and auth
  useEffect(() => {
    const errorHandler = (e: any) => {
      showToast(e.detail || 'An unexpected error occurred.', 'error');
    };
    window.addEventListener('app-error', errorHandler);



    const client = getClient();
    if (client) {
      const handleUserSession = async (authUser: any) => {
        try {
          const { data: profileData } = await client!.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
          const name = profileData?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Hands of Heros User';
          const userPhone = authUser.phone || authUser.user_metadata?.phone || profileData?.phone || '';
          
          const userEmail = authUser.email || profileData?.email || '';
          const userAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || profileData?.avatar_url || null;
          
          if (!profileData || !profileData.email) {
            try {
              await client!.from('profiles').upsert({
                id: authUser.id,
                full_name: name,
                phone: userPhone,
                email: userEmail,
                avatar_url: userAvatar,
                role: 'customer',
                consent_given: true,
                updated_at: new Date().toISOString(),
              });
            } catch {}
          }

          const savedLang = (() => {
            if (typeof window === 'undefined') return null;
            try { return JSON.parse(localStorage.getItem('nt_settings') || '{}')?.language; } catch { return null; }
          })();
          const effectiveLang = (savedLang || profileData?.preferred_language || profileData?.language || settings.language || 'en') as LanguageCode;

          setUser({
            id: authUser.id,
            full_name: name,
            phone: userPhone,
            email: userEmail,
            avatar_url: userAvatar || undefined,
            role: 'customer',
            language: effectiveLang,
            consent_given: true,
          });
        } catch (e) {
          console.error('[Auth Profile Init Error]', e);
        }
      };

      client!.auth.getSession().then(async ({ data }) => {
        if (data.session?.user) {
          await handleUserSession(data.session.user);
        }
        setIsAuthLoading(false);
      }).catch(() => setIsAuthLoading(false));

      const { data: { subscription } } = client!.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserSession(session.user);
        } else if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setBookings([]);
          localStorage.removeItem('nt_user');
        }
      });

      // Native Deep Link Listener for Google OAuth Return
      if (typeof window !== 'undefined') {
        const handleCustomUrl = async (urlStr: string) => {
          try {
            if (!urlStr || !client) return;

            // ── 1. Query-string params (PKCE flow: ?code=... or ?access_token=...) ──
            const qIndex = urlStr.indexOf('?');
            if (qIndex !== -1) {
              const queryPart = urlStr.substring(qIndex + 1).split('#')[0];
              const qParams = new URLSearchParams(queryPart);
              const code = qParams.get('code');
              if (code) {
                const { data } = await client.auth.exchangeCodeForSession(code);
                if (data?.user) {
                  await handleUserSession(data.user);
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
                  await handleUserSession(data.user);
                  return;
                }
              }
            }

            // ── 2. Hash fragment (Implicit flow: #access_token=... or #code=...) ──
            const hashIndex = urlStr.indexOf('#');
            if (hashIndex !== -1) {
              const hash = urlStr.substring(hashIndex + 1);
              const params = new URLSearchParams(hash);
              const code = params.get('code');
              if (code) {
                const { data } = await client.auth.exchangeCodeForSession(code);
                if (data?.user) {
                  await handleUserSession(data.user);
                  return;
                }
              }
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              if (accessToken && refreshToken && client) {
                await client.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
              }
            }
          } catch (err) {
            console.warn('[DeepLink Auth Error]', err);
          }
        };

        // Handle case where app was opened via deep link with auth params
        if (window.location.hash.includes('access_token') || window.location.href.includes('code=')) {
          handleCustomUrl(window.location.href);
        }

        import('@capacitor/app').then(({ App }) => {
          App.addListener('appUrlOpen', async (data) => {
            setTimeout(async () => {
              try {
                const { Browser } = await import('@capacitor/browser');
                await Browser.close().catch(() => {});
              } catch (e) {}
            }, 500);
            handleCustomUrl(data.url);
          });
        }).catch(() => {});
      }


      return () => {
        subscription.unsubscribe();
        window.removeEventListener('app-error', errorHandler);
      };
    } else {
      setIsAuthLoading(false);
      return () => {
        window.removeEventListener('app-error', errorHandler);
      };
    }
  }, []);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const realtimeOfferRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem('nt_user', JSON.stringify(user));
      registerFcmToken(user.id).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('nt_settings', JSON.stringify(settings)); } catch {}
  }, [settings]);

  // Fetch initial categories and subscribe to live updates
  useEffect(() => {
    fetchServiceCategories().then(setCategories);

    const client = getClient();
    if (!client) return;

    const channel = client
      .channel('public:service_categories_customer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_categories' }, () => {
        fetchServiceCategories().then(setCategories);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const refreshBookings = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await fetchCustomerBookings(user.id);
    setBookings(data);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { if (user) refreshBookings(); }, [user, refreshBookings]);

  // Real-time booking updates & Cross-tab sync
  useEffect(() => {
    if (!user?.id) return;
    
    // Clean up existing subscriptions if any
    if (realtimeChannelRef.current) realtimeChannelRef.current.unsubscribe();
    if (realtimeOfferRef.current) realtimeOfferRef.current.unsubscribe();
    
    if (isConfigured()) {
      realtimeChannelRef.current = subscribeToBookingStatus(user.id, (updatedBooking) => {
        setBookings(prev => {
          const exists = prev.find(b => b.id === updatedBooking.id);
          if (!exists) return [updatedBooking, ...prev];
          return prev.map(b => b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b);
        });
        
        const status = updatedBooking.status;
        if (status === 'accepted') {
          showToast('✅ Your worker is on the way!', 'success');
          sendLocalNotification('✅ Specialist On The Way!', { body: 'Your specialist has accepted and is on the way.' });
          try { confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ['#10B981', '#0B3D66'] }); } catch {}
        } else if (status === 'completed') {
          showToast('🎉 Job completed! Please rate your experience.', 'success');
          sendLocalNotification('🎉 Job Completed!', { body: 'Your service is complete. Please rate your experience.' });
          try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } }); } catch {}
        } else if (status === 'cancelled') {
          showToast('Booking cancelled.', 'error');
        }
      });

      realtimeOfferRef.current = subscribeToCustomerOffers(user.id, (offer) => {
        if (offer.status === 'declined') {
          showToast('A worker declined your request. Finding another...', 'error');
        }
      });
    }

    // Cross-tab / Cross-window instant sync via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('hero_hand_booking_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'STATUS_UPDATE' || event.data?.status) {
          const { bookingId, status } = event.data;
          setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
          refreshBookings();
          if (status === 'completed') {
            showToast('🎉 Job completed by specialist! Thank you.', 'success');
            try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } }); } catch {}
          }
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hero_hand_booking_sync' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data?.bookingId && data?.status) {
            setBookings(prev => prev.map(b => b.id === data.bookingId ? { ...b, status: data.status } : b));
            refreshBookings();
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => { 
      if (realtimeChannelRef.current) realtimeChannelRef.current.unsubscribe(); 
      if (realtimeOfferRef.current) realtimeOfferRef.current.unsubscribe();
      realtimeChannelRef.current = null;
      realtimeOfferRef.current = null;
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [user?.id, refreshBookings]);

  // Periodic background refresh for active bookings
  useEffect(() => {
    if (!user?.id) return;
    const hasActive = bookings.some(b => ['searching', 'pending', 'accepted', 'on_the_way', 'in_progress'].includes(b.status));
    if (!hasActive) return;

    const pollInterval = setInterval(() => {
      refreshBookings();
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [user?.id, bookings, refreshBookings]);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now().toString(), message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const loginUser = useCallback((phone: string, name: string, authUserId: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const profile: UserProfile = {
      id: authUserId,
      full_name: name,
      phone: cleanPhone,
      role: 'customer',
      language: settings.language,
      consent_given: true,
    };
    setUser(profile);
    localStorage.setItem('nt_user', JSON.stringify(profile));
    showToast(`Welcome, ${name.split(' ')[0]}! 👋`);

    upsertProfile({
      id: authUserId,
      full_name: name,
      phone: cleanPhone,
      language: settings.language,
      consent_given: true,
    }).catch(() => {});
  }, [settings.language, showToast]);

  const logoutUser = useCallback(() => {
    setUser(null);
    setBookings([]);
    if (typeof window !== 'undefined') localStorage.removeItem('nt_user');
    const client = getClient();
    if (client) client.auth.signOut().catch(() => {});
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user?.id) {
      setUser(null);
      if (typeof window !== 'undefined') localStorage.removeItem('nt_user');
      return true;
    }
    await deleteCustomerAccount(user.id);
    setUser(null);
    setBookings([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nt_user');
      localStorage.removeItem('nt_settings');
    }
    showToast('Your account and all personal data have been permanently deleted.', 'info');
    return true;
  }, [user?.id, showToast]);

  const bookWorker = useCallback(async (categoryId: string, workerId: string, exactLocation?: { lat: number, lng: number }) => {
    if (!user) return null;
    
    // Caller must provide exact location
    if (!exactLocation || !exactLocation.lat) {
      showToast('Location is required to book a worker.', 'error');
      return null;
    }
    
    const id = await createBooking({
      customerId: user.id,
      categoryId,
      workerId,
      lat: exactLocation.lat,
      lng: exactLocation.lng
    });
    
    if (id) {
      try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#0B3D66', '#F59E0B', '#10B981'] }); } catch {}
      showToast('Booking request sent! Waiting for acceptance.', 'success');
      refreshBookings();
      return id;
    } else {
      showToast('Failed to create booking.', 'error');
      return null;
    }
  }, [user, refreshBookings, showToast]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setSettings(s => ({ ...s, language: lang }));
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('nt_settings', JSON.stringify({ ...settings, language: lang })); } catch {}
    }
    if (user?.id) {
      const client = getClient();
      if (client) {
        client.from('profiles').update({ preferred_language: lang }).eq('id', user.id).then(() => {}).catch(() => {});
      }
    }
  }, [user?.id, settings]);
  const toggleSounds = useCallback(() => setSettings(s => ({ ...s, sounds: !s.sounds })), []);
  const toggleVoice = useCallback(() => setSettings(s => ({ ...s, voice: !s.voice })), []);
  const translate = useCallback((key: string) => getTranslation(settings.language, key), [settings.language]);

  return (
    <AppContext.Provider value={{
      user, isLoggedIn: !!user, isAuthLoading, loginUser, logoutUser, deleteAccount,
      categories, bookings, isLoading, refreshBookings,
      bookWorker,
      settings, setLanguage, toggleSounds, toggleVoice,
      toast, showToast, dismissToast, translate, t: translate,
      webrtc,
      workers: [], // Provide empty array to satisfy type
    }}>
      {children}
      <CallOverlay webrtc={webrtc} />
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
