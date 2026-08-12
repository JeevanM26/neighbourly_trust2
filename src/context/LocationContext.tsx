'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.2090 };

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
  const geoWatchRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if (locationStatus === 'granted') {
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
      
      geoWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
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

  const _executeLocationRequest = useCallback(async (): Promise<{lat: number, lng: number} | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('denied');
      return null;
    }
    setLocationStatus('loading');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          setLocationStatus('granted');
          resolve(coords);
        },
        (err) => {
          setLocationStatus('denied');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 60000, maximumAge: 10000 }
      );
    });
  }, []);

  const requestLocation = useCallback(async (): Promise<{lat: number, lng: number} | null> => {
    if (hasLocationPermission || locationStatus === 'granted') {
      return _executeLocationRequest();
    }
    
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'granted') {
          setHasLocationPermission(true);
          return _executeLocationRequest();
        }
      } catch (e) {}
    }

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
