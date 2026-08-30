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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('nt_last_location');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          // Avoid sticking to default Delhi if cached accidentally
          const isDelhi = Math.abs(parsed.lat - DEFAULT_LOCATION.lat) < 0.01 && Math.abs(parsed.lng - DEFAULT_LOCATION.lng) < 0.01;
          if (!isDelhi) return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [searchLocation, setSearchLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'idle'>('idle');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const locationPromiseRef = useRef<{resolve: (val: any) => void, reject: () => void} | null>(null);
  const isWatchingRef = useRef(false);

  const saveLocationCache = (coords: { lat: number; lng: number }) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nt_last_location', JSON.stringify(coords));
      }
    } catch {}
  };

  const updateLocation = useCallback((coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
    saveLocationCache(coords);
    setLocationStatus('granted');
  }, []);

  const _executeLocationRequest = useCallback(async (): Promise<{lat: number, lng: number} | null> => {
    setLocationStatus('loading');
    
    // 1. Native Capacitor Geolocation for Android/iOS
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await Geolocation.requestPermissions();
        if (perm.location === 'granted' || perm.location === 'prompt-with-rationale' || (perm as any).coarseLocation === 'granted') {
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
          if (pos?.coords) {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            updateLocation(coords);
            return coords;
          }
        }
      } catch (nativeErr) {
        console.warn("Native Geolocation error, falling back to web:", nativeErr);
      }
    }

    // 2. Standard Web Browser Geolocation
    if (typeof window !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            updateLocation(coords);
            resolve(coords);
          },
          async (err) => {
            console.warn("Web Geolocation initial error, trying IP fallback:", err.message);
            // 3. Fast IP Location Fallback if GPS is blocked or timed out
            try {
              const res = await fetch('https://ipwho.is/');
              if (res.ok) {
                const ipData = await res.json();
                if (ipData.success && ipData.latitude && ipData.longitude) {
                  const ipCoords = { lat: ipData.latitude, lng: ipData.longitude };
                  updateLocation(ipCoords);
                  resolve(ipCoords);
                  return;
                }
              }
            } catch {}

            setLocationStatus('denied');
            resolve(userLocation || DEFAULT_LOCATION);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    }

    setLocationStatus('denied');
    return userLocation || DEFAULT_LOCATION;
  }, [updateLocation, userLocation]);

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

  // Continuous watchPosition listener
  useEffect(() => {
    requestLocation();

    if (typeof window !== 'undefined' && navigator.geolocation && !isWatchingRef.current) {
      isWatchingRef.current = true;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          updateLocation(coords);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
        isWatchingRef.current = false;
      };
    }
  }, []);

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
