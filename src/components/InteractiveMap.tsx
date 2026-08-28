'use client';

import React, { useEffect, useRef } from 'react';
import { WorkerProfile } from '../lib/types';

interface InteractiveMapProps {
  userLoc: { lat: number; lng: number };
  workers: WorkerProfile[];
  onSelectWorker?: (worker: WorkerProfile) => void;
}

export default function InteractiveMap({ userLoc, workers, onSelectWorker }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Dynamically load Leaflet to avoid SSR issues in Next.js
    import('leaflet').then((L) => {
      // Fix default marker icon issues in Leaflet Webpack/Next builds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current as HTMLElement).setView([userLoc.lat, userLoc.lng], 13);

        // OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap.current);
      } else {
        leafletMap.current.setView([userLoc.lat, userLoc.lng], 13);
      }

      // Add customer live location marker (pulsing circle)
      const userMarker = L.circleMarker([userLoc.lat, userLoc.lng], {
        radius: 9,
        fillColor: '#2563EB',
        color: '#FFFFFF',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(leafletMap.current);
      userMarker.bindPopup('<b>Your Live Location</b>');

      // Add provider markers
      workers.forEach((w) => {
        // We use any assertions here to allow compilation for fields not in WorkerProfile yet (Phase 2 constraint)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const workerAny = w as any;
        if (!workerAny.lat || !workerAny.lng) return; // Skip if no coords
        
        const markerColor = workerAny.featured ? '#F5A623' : '#0B3D66';
        const providerMarker = L.circleMarker([workerAny.lat, workerAny.lng], {
          radius: 8,
          fillColor: markerColor,
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(leafletMap.current);

        const popupContent = `
          <div style="font-family: system-ui; text-align: center; padding: 2px;">
            <b style="color: #0B3D66; font-size: 13px;">${w.full_name}</b><br/>
            <span style="font-size: 11px; color: #475569;">${workerAny.role || 'Pro'}</span><br/>
            <button id="book-btn-${w.worker_id}" style="margin-top: 6px; background: #072A4A; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">
              View & Book
            </button>
          </div>
        `;

        providerMarker.bindPopup(popupContent);

        providerMarker.on('popupopen', () => {
          const btn = document.getElementById(`book-btn-${w.worker_id}`);
          if (btn && onSelectWorker) {
            btn.onclick = () => onSelectWorker(w);
          }
        });
      });
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [userLoc, workers]);

  return (
    <div className="w-full h-full min-h-[220px] rounded-2xl overflow-hidden shadow-inner relative border border-slate-200">
      <div ref={mapRef} className="w-full h-full min-h-[220px] z-0" />
    </div>
  );
}
