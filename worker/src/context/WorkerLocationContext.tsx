'use client';
import React, { createContext, useEffect, useRef } from 'react';
import { useWorker } from './WorkerContext';
import { setWorkerOnline } from '../lib/supabase';

const WorkerLocationContext = createContext<null>(null);

export const WorkerLocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { worker, isOnline, activeBookings } = useWorker();
  const geoWatchRef = useRef<number | null>(null);
  const activeBookingsRef = useRef(activeBookings);

  useEffect(() => {
    activeBookingsRef.current = activeBookings;
  }, [activeBookings]);

  useEffect(() => {
    if (!worker) return;

    if (isOnline) {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await setWorkerOnline(worker.id, true, pos.coords.latitude, pos.coords.longitude);
        }, () => {
          setWorkerOnline(worker.id, true, null, null);
        }, { timeout: 10000 });

        let lastUpdate = 0;
        geoWatchRef.current = navigator.geolocation.watchPosition(async (pos) => {
          const now = Date.now();
          if (now - lastUpdate > 20000) {
            lastUpdate = now;
            let lat = pos.coords.latitude;
            let lng = pos.coords.longitude;
            const isActivelyAssigned = activeBookingsRef.current.some(b => b.status === 'accepted' || b.status === 'on_the_way' || b.status === 'in_progress');
            if (!isActivelyAssigned) {
              lat = Math.round(lat * 1000) / 1000;
              lng = Math.round(lng * 1000) / 1000;
            }
            await setWorkerOnline(worker.id, true, lat, lng);
          }
        }, (err) => {
          console.warn("Location watch error", err);
        }, {
          enableHighAccuracy: true,
          maximumAge: 10000,
        });
      }
    } else {
      if (geoWatchRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
    }

    return () => {
      if (geoWatchRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
    };
  }, [isOnline, worker?.id]);

  return <WorkerLocationContext.Provider value={null}>{children}</WorkerLocationContext.Provider>;
};
