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

export const T: Record<string, Record<string, string>> = {
  en: {
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    searchPlaceholder: "Search 'electrician', 'water leak'...",
    allServices: 'All Services',
    specialistsNearYou: 'Specialists Near You',
    refresh: 'Refresh',
    filterAll: 'All',
    filterTopRated: '⭐ Top Rated',
    filterAvailableNow: '📅 Available Now',
    filterUnder350: '💰 Under ₹350',
    noSpecialistsFound: 'No specialists found nearby.',
    verifiedSpecialistFound: 'verified specialist found',
    verifiedSpecialistsFound: 'verified specialists found',
    refreshing: 'Refreshing...',
    listening: 'Listening... बोलिए...',
    findService:    'Find a Service',
    nearbyWorkers:  'Verified Specialists Near You',
    myBookings:     'My Bookings',
    profile:        'My Profile',
    bookNow:        'Book Now',
    bookingSuccess: 'Booking Confirmed!',
    loading:        'Loading…',
    noProviders:    'No specialists found in your area yet.',
    noBookings:     'No bookings yet. Book your first service!',
  },
  hi: {
    goodMorning: 'सुप्रभात',
    goodAfternoon: 'शुभ दोपहर',
    searchPlaceholder: "'इलेक्ट्रीशियन', 'पानी का रिसाव' खोजें...",
    allServices: 'सभी सेवाएं',
    specialistsNearYou: 'आपके आस-पास के विशेषज्ञ',
    refresh: 'रिफ्रेश',
    filterAll: 'सभी',
    filterTopRated: '⭐ टॉप रेटेड',
    filterAvailableNow: '📅 अभी उपलब्ध',
    filterUnder350: '💰 ₹350 से कम',
    noSpecialistsFound: 'आस-पास कोई विशेषज्ञ नहीं मिला।',
    verifiedSpecialistFound: 'सत्यापित विशेषज्ञ मिला',
    verifiedSpecialistsFound: 'सत्यापित विशेषज्ञ मिले',
    refreshing: 'रीफ़्रेश हो रहा है...',
    listening: 'सुन रहा हूँ... बोलिए...',
    findService:    'सेवा खोजें',
    nearbyWorkers:  'आपके आस-पास के विशेषज्ञ',
    myBookings:     'मेरी बुकिंग',
    profile:        'मेरी प्रोफ़ाइल',
    bookNow:        'अभी बुक करें',
    bookingSuccess: 'बुकिंग की पुष्टि हो गई!',
    loading:        'लोड हो रहा है…',
    noProviders:    'आपके क्षेत्र में कोई विशेषज्ञ नहीं मिला।',
    noBookings:     'कोई बुकिंग नहीं। अपनी पहली सेवा बुक करें!',
  },
  kn: {
    goodMorning: 'ಶುಭೋದಯ',
    goodAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    searchPlaceholder: "'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್', 'ನೀರು ಸೋರುವಿಕೆ' ಹುಡುಕಿ...",
    allServices: 'ಎಲ್ಲಾ ಸೇವೆಗಳು',
    specialistsNearYou: 'ನಿಮ್ಮ ಹತ್ತಿರದ ತಜ್ಞರು',
    refresh: 'ರಿಫ್ರೆಶ್',
    filterAll: 'ಎಲ್ಲಾ',
    filterTopRated: '⭐ ಟಾಪ್ ರೇಟೆಡ್',
    filterAvailableNow: '📅 ಈಗ ಲಭ್ಯವಿದೆ',
    filterUnder350: '💰 ₹350 ಕ್ಕಿಂತ ಕಡಿಮೆ',
    noSpecialistsFound: 'ಹತ್ತಿರದಲ್ಲಿ ಯಾವುದೇ ತಜ್ಞರು ಕಂಡುಬಂದಿಲ್ಲ.',
    verifiedSpecialistFound: 'ಪರಿಶೀಲಿಸಿದ ತಜ್ಞರು ಕಂಡುಬಂದಿದ್ದಾರೆ',
    verifiedSpecialistsFound: 'ಪರಿಶೀಲಿಸಿದ ತಜ್ಞರು ಕಂಡುಬಂದಿದ್ದಾರೆ',
    refreshing: 'ರಿಫ್ರೆಶ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    listening: 'ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಮಾತನಾಡಿ...',
    findService:    'ಸೇವೆ ಹುಡುಕಿ',
    nearbyWorkers:  'ನಿಮ್ಮ ಹತ್ತಿರದ ತಜ್ಞರು',
    myBookings:     'ನನ್ನ ಬುಕಿಂಗ್‌ಗಳು',
    profile:        'ನನ್ನ ಪ್ರೊಫೈಲ್',
    bookNow:        'ಈಗ ಬುಕ್ ಮಾಡಿ',
    bookingSuccess: 'ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ!',
    loading:        'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
    noProviders:    'ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಯಾವುದೇ ತಜ್ಞರು ಕಂಡುಬಂದಿಲ್ಲ.',
    noBookings:     'ಯಾವುದೇ ಬುಕಿಂಗ್ ಇಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಸೇವೆಯನ್ನು ಬುಕ್ ಮಾಡಿ!',
  }
};

function t(key: string, lang: LanguageCode): string {
  return T[lang]?.[key] ?? T['en'][key] ?? key;
}

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

  // Location
  userLocation: { lat: number; lng: number };
  setUserLocation: (loc: { lat: number; lng: number }) => void;
  searchLocation: { lat: number; lng: number } | null;
  setSearchLocation: (loc: { lat: number; lng: number } | null) => void;
  locationStatus: 'loading' | 'granted' | 'denied' | 'idle';
  requestLocation: () => Promise<{lat: number, lng: number} | null>;
  webrtc: ReturnType<typeof useWebRTC>;

  workers: WorkerProfile[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<AppSettings>({ language: 'en', sounds: true, voice: false });
  const webrtc = useWebRTC(user?.id || '');

  // Load initial settings and auth
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('nt_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch {}



    const client = getClient();
    if (client) {
      client!.auth.getSession().then(async ({ data }) => {
        if (data.session?.user) {
          const authUser = data.session.user;
          // check if profile exists
          const { data: profileData } = await client!.from('profiles').select('*').eq('id', authUser.id).single();
          if (profileData && profileData.role === 'customer') {
            setUser({
              id: authUser.id,
              full_name: profileData.full_name,
              phone: authUser.phone || '',
              role: 'customer',
              language: profileData.preferred_language as LanguageCode || 'en',
              consent_given: true,
            });
          }
        }
        setIsAuthLoading(false);
      }).catch(() => setIsAuthLoading(false));

      const { data: { subscription } } = client!.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setBookings([]);
          localStorage.removeItem('nt_user');
        }
      });
      return () => subscription.unsubscribe();
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [searchLocation, setSearchLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'idle'>('idle');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const locationPromiseRef = useRef<{resolve: (val: any) => void, reject: () => void} | null>(null);
  const geoWatchRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) localStorage.setItem('nt_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('nt_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if (locationStatus === 'granted') {
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
      
      geoWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          console.log(`Real-time location updated: ${pos.coords.latitude}, ${pos.coords.longitude} (Accuracy: ${pos.coords.accuracy} meters)`);
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Real-time location watch error:", err);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }

    return () => {
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
    };
  }, [locationStatus]);

  // Internal request location function
  const _executeLocationRequest = useCallback(async (): Promise<{lat: number, lng: number} | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('denied');
      return null;
    }
    setLocationStatus('loading');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log(`Initial location: ${pos.coords.latitude}, ${pos.coords.longitude} (Accuracy: ${pos.coords.accuracy} meters)`);
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          setLocationStatus('granted');
          resolve(coords);
        },
        (err) => {
          console.warn("Initial location fetch error:", err);
          setLocationStatus('denied');
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
      );
    });
  }, []);

  // Public request location function wrapped with Modal
  const requestLocation = useCallback(async (): Promise<{lat: number, lng: number} | null> => {
    if (hasLocationPermission || locationStatus === 'granted') {
      return _executeLocationRequest();
    }
    
    // Check if permission is already granted via permissions API (modern browsers)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'granted') {
          setHasLocationPermission(true);
          return _executeLocationRequest();
        }
      } catch (e) {}
    }

    // Show modal and wait for user action
    setShowLocationModal(true);
    return new Promise((resolve, reject) => {
      locationPromiseRef.current = { resolve, reject };
    });
  }, [hasLocationPermission, locationStatus, _executeLocationRequest]);

  const handleLocationAllow = () => {
    setShowLocationModal(false);
    setHasLocationPermission(true);
    _executeLocationRequest().then(res => {
      if (locationPromiseRef.current) locationPromiseRef.current.resolve(res);
    });
  };

  const handleLocationDeny = () => {
    setShowLocationModal(false);
    setLocationStatus('denied');
    if (locationPromiseRef.current) locationPromiseRef.current.resolve(null);
  };

  // Fetch initial data
  useEffect(() => {
    fetchServiceCategories().then(setCategories);
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshBookings = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await fetchCustomerBookings(user.id);
    setBookings(data);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { if (user) refreshBookings(); }, [user, refreshBookings]);

  // Real-time booking updates
  useEffect(() => {
    if (!isConfigured() || !user?.id) return;
    const channel = subscribeToBookingStatus(user.id, (updatedBooking) => {
      setBookings(prev => {
        const exists = prev.find(b => b.id === updatedBooking.id);
        if (!exists) return [updatedBooking, ...prev];
        return prev.map(b => b.id === updatedBooking.id ? updatedBooking : b);
      });
      
      const status = updatedBooking.status;
      if (status === 'accepted') {
        showToast('✅ Your worker is on the way!', 'success');
        try { confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ['#10B981', '#0B3D66'] }); } catch {}
      } else if (status === 'completed') {
        showToast('🎉 Job completed!', 'success');
      } else if (status === 'cancelled') {
        showToast('Booking cancelled.', 'error');
      }
    });

    const offerChannel = subscribeToCustomerOffers(user.id, (offer) => {
      // If we see a declined offer, we notify the customer that a specific worker passed.
      if (offer.status === 'declined') {
        showToast('A worker declined your request. Finding another...', 'error');
      }
    });

    return () => { 
      channel?.unsubscribe(); 
      offerChannel?.unsubscribe();
    };
  }, [user?.id]); // eslint-disable-line

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
    const success = await deleteCustomerAccount();
    if (success) {
      setUser(null);
      if (typeof window !== 'undefined') localStorage.removeItem('nt_user');
      return true;
    }
    return false;
  }, []);

  const bookWorker = useCallback(async (categoryId: string, workerId: string, exactLocation?: { lat: number, lng: number }) => {
    if (!user) return null;
    // ensure we have latest location
    let loc = exactLocation || searchLocation || userLocation;
    if (!exactLocation && !searchLocation && locationStatus !== 'granted') {
      const newLoc = await requestLocation();
      if (newLoc) loc = newLoc;
    }
    
    // Fallback if loc is still somehow empty
    if (!loc || !loc.lat) {
      loc = { lat: 12.9715987, lng: 77.5945627 };
    }
    
    const id = await createBooking({
      customerId: user.id,
      categoryId,
      workerId,
      lat: loc.lat,
      lng: loc.lng
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
  }, [user, userLocation, locationStatus, requestLocation, refreshBookings, showToast]);

  const setLanguage = useCallback((lang: LanguageCode) => setSettings(s => ({ ...s, language: lang })), []);
  const toggleSounds = useCallback(() => setSettings(s => ({ ...s, sounds: !s.sounds })), []);
  const toggleVoice = useCallback(() => setSettings(s => ({ ...s, voice: !s.voice })), []);
  const translate = useCallback((key: string) => t(key, settings.language), [settings.language]);

  return (
    <AppContext.Provider value={{
      user, isLoggedIn: !!user, isAuthLoading, loginUser, logoutUser, deleteAccount,
      categories, bookings, isLoading, refreshBookings,
      bookWorker,
      settings, setLanguage, toggleSounds, toggleVoice,
      toast, showToast, dismissToast, translate, t: translate,
      userLocation, setUserLocation, searchLocation, setSearchLocation, locationStatus, requestLocation, webrtc,
      workers: [], // Provide empty array to satisfy type
    }}>
      {children}
      <CallOverlay webrtc={webrtc} />
      <PermissionModal 
        isOpen={showLocationModal}
        title="Allow Location Access"
        description="Neighborly Trust needs location access to find verified specialists near you and guide them to your doorstep accurately."
        icon={<MapPin className="w-8 h-8" />}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
