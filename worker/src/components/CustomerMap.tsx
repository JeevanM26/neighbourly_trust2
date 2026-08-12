'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface CustomerMapProps {
  customerLoc: { lat: number; lng: number };
}

export default function CustomerMap({ customerLoc }: CustomerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    import('leaflet').then((L) => {
      // Fix default marker icon issues in Leaflet Webpack/Next builds
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current as HTMLElement, {
          zoomControl: false,
          dragging: true,
        }).setView([customerLoc.lat, customerLoc.lng], 15);

        // OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap.current);

        // Add customer pin
        const customerHtml = `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">
            <div style="width: 24px; height: 24px; border-radius: 50% 50% 50% 0; background: #059669; border: 2px solid white; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; position: relative;">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          </div>
        `;
        const customerIcon = L.divIcon({
          html: customerHtml,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 28],
        });

        markerRef.current = L.marker([customerLoc.lat, customerLoc.lng], { icon: customerIcon })
          .addTo(leafletMap.current)
          .bindPopup('<b style="font-family:system-ui;color:#0F172A;">Customer Location</b>');
      } else {
        leafletMap.current.setView([customerLoc.lat, customerLoc.lng], 15);
        if (markerRef.current) {
          markerRef.current.setLatLng([customerLoc.lat, customerLoc.lng]);
        }
      }
    });

    return () => {
      // Cleanup to prevent memory leaks in strict mode / re-renders
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [customerLoc.lat, customerLoc.lng]);

  return (
    <div style={{ width: '100%', height: '180px', borderRadius: 12, overflow: 'hidden', position: 'relative', marginTop: 12 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
    </div>
  );
}
