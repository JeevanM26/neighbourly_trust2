'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.2090 };

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  searchLocation: { lat: number; lng: number } | null;
  setSearchLocation: (loc: { lat: number; lng: number } | null) => void;
  locationStatus: 'loading' | 'granted' | 'denied' | 'idle';
  requestLocation: () => Promise<{lat: number, lng: number} | null>;
  showLocationModal: boolean;
  handleLocationAllow: () => void;
  handleLocationDeny: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Instant 0ms cached location on startup
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCATION;
    try {
      const cached = localStorage.getItem('nt_last_location');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_LOCATION;
  });

  const [searchLocation, setSearchLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'idle'>('idle');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const locationPromiseRef = useRef<{resolve: (val: any) => void, reject: () => void} | null>(null);

  const saveLocationCache = (coords: { lat: number; lng: number }) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nt_last_location', JSON.stringify(coords));
      }
    } catch {}
  };

  const _executeLocationRequest = useCallback(async (): Promise<{lat: number, lng: number} | null> => {
    setLocationStatus('loading');
    
    // Native Capacitor Geolocation for Android/iOS
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await Geolocation.requestPermissions();
        if (perm.location === 'granted' || perm.location === 'prompt-with-rationale' || (perm as any).coarseLocation === 'granted') {
          // Fast coarse position first (returns in < 1s)
          try {
            const fastPos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 3000, maximumAge: 30000 });
            if (fastPos?.coords) {
              const coords = { lat: fastPos.coords.latitude, lng: fastPos.coords.longitude };
              setUserLocation(coords);
              saveLocationCache(coords);
              setLocationStatus('granted');
            }
          } catch {}

          // Precise background GPS fix
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          saveLocationCache(coords);
          setLocationStatus('granted');
          return coords;
        }
      } catch (nativeErr) {
        console.warn("Native Geolocation error, falling back to web:", nativeErr);
      }
    }

    // Web Geolocation: Two-stage fast resolution
    if (typeof window !== 'undefined' && navigator.geolocation) {
      // 1. Fast coarse position first (< 200ms)
      navigator.geolocation.getCurrentPosition(
        (fastPos) => {
          const coords = { lat: fastPos.coords.latitude, lng: fastPos.coords.longitude };
          setUserLocation(coords);
          saveLocationCache(coords);
          setLocationStatus('granted');
        },
        () => {},
        { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 }
      );

      // 2. High-accuracy GPS refinement
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(coords);
            saveLocationCache(coords);
            setLocationStatus('granted');
            resolve(coords);
          },
          (err) => {
            console.warn("Web Geolocation error:", err);
            // Keep existing cached location instead of reverting to null
            setLocationStatus('denied');
            resolve(userLocation || DEFAULT_LOCATION);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
      });
    }

    setLocationStatus('denied');
    return userLocation || DEFAULT_LOCATION;
  }, [userLocation]);

  const requestLocation = useCallback(async (): Promise<{lat: number, lng: number} | null> => {
    return _executeLocationRequest();
  }, [_executeLocationRequest]);

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

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <LocationContext.Provider value={{
      userLocation, setUserLocation,
      searchLocation, setSearchLocation,
      locationStatus, requestLocation,
      showLocationModal, handleLocationAllow, handleLocationDeny
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
};
