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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchLocation, setSearchLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'idle'>('idle');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const locationPromiseRef = useRef<{resolve: (val: any) => void, reject: () => void} | null>(null);

  const _executeLocationRequest = useCallback(async (): Promise<{lat: number, lng: number} | null> => {
    setLocationStatus('loading');
    
    // Native Capacitor Geolocation for Android/iOS - triggers system permission popup
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await Geolocation.requestPermissions();
        if (perm.location === 'granted' || perm.location === 'prompt-with-rationale' || (perm as any).coarseLocation === 'granted') {
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          setLocationStatus('granted');
          return coords;
        }
      } catch (nativeErr) {
        console.warn("Native Geolocation error, falling back to web:", nativeErr);
      }
    }

    // Web Geolocation Fallback
    if (typeof window !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(coords);
            setLocationStatus('granted');
            resolve(coords);
          },
          (err) => {
            console.warn("Web Geolocation error:", err);
            setLocationStatus('denied');
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    }

    setLocationStatus('denied');
    return null;
  }, []);

  const requestLocation = useCallback(async (): Promise<{lat: number, lng: number} | null> => {
    // If native platform, directly invoke native system permission dialog
    if (Capacitor.isNativePlatform()) {
      return _executeLocationRequest();
    }

    if (hasLocationPermission || locationStatus === 'granted') {
      return _executeLocationRequest();
    }
    
    if (typeof window !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'granted') {
          setHasLocationPermission(true);
          return _executeLocationRequest();
        }
      } catch (e) {}
    }

    return _executeLocationRequest();
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
