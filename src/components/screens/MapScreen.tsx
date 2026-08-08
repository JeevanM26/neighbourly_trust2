'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkerProfile, ServiceCategory } from '../../lib/types';
import { Navigation, Crosshair } from 'lucide-react';

import { findNearbyWorkers } from '../../lib/supabase';

// ─── Map Screen ───────────────────────────────────────────
export default function MapScreen({
  categoryId,
  onSelectWorker,
  onClearCategory
}: {
  categoryId: string | null;
  onSelectWorker?: (workerId: string, categoryId?: string) => void;
  onClearCategory?: () => void;
}) {
  const { categories, userLocation, locationStatus, requestLocation } = useApp();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [visibleProviders, setVisibleProviders] = useState<WorkerProfile[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

  // Sync prop categoryId to active filter state if needed, but since we are driven by props:
  const activeFilter = categoryId || 'All';
  const filters = ['All', ...categories.map(c => c.id)];

  // ── Load Leaflet ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).L) { setLeafletLoaded(true); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ── Init Map ──
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;
    const L = (window as any).L;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 15,
      zoomControl: false, // Removed zoom controls for cleaner ride-hailing look
      attributionControl: false,
    });

    // Premium ride-hailing map style (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; CartoDB'
    }).addTo(mapRef.current);

    // Resize observer to handle window resizing
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    // User location marker
    const userIcon = L.divIcon({
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#0B3D66;border:3px solid white;box-shadow:0 0 0 4px rgba(11,61,102,0.2); position:relative;">
               <div style="position:absolute; inset:0; border-radius:50%; background:#0B3D66; animation:pulse-ring 2s infinite;"></div>
             </div>`,
      className: '', iconSize: [20, 20], iconAnchor: [10, 10],
    });
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapRef.current)
      .bindPopup('Your location');

    return () => {
      resizeObserver.disconnect();
    };
  }, [leafletLoaded, userLocation]);

  // ── Center Map on User ──
  const centerOnUser = () => {
    if (!mapRef.current || !leafletLoaded) return;
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.5 });
  };

  // ── Fetch Workers ──
  useEffect(() => {
    let isMounted = true;
    async function fetchWorkers() {
      setIsLoadingWorkers(true);
      if (activeFilter === 'All') {
        const promises = categories.map(c => findNearbyWorkers(c.id, userLocation.lat, userLocation.lng).then(workers => workers.map(w => ({...w, __categoryId: c.id}))));
        const results = await Promise.all(promises);
        const allWorkers = results.flat();
        const unique = Array.from(new Map(allWorkers.map(w => [w.worker_id, w])).values());
        if (isMounted) {
          setVisibleProviders(unique);
          setIsLoadingWorkers(false);
        }
        return;
      }
      const workers = await findNearbyWorkers(activeFilter, userLocation.lat, userLocation.lng);
      const taggedWorkers = workers.map(w => ({...w, __categoryId: activeFilter}));
      if (isMounted) {
        setVisibleProviders(taggedWorkers);
        setIsLoadingWorkers(false);
      }
    }
    if (categories.length > 0) fetchWorkers();
    return () => { isMounted = false; };
  }, [activeFilter, userLocation.lat, userLocation.lng, categories]);

  // ── Update Provider Markers ──
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    visibleProviders.forEach(provider => {
      // Create a prominent pin, similar to ride-hailing vehicle markers
      const workerIcon = L.divIcon({
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#F59E0B;border:3px solid white;box-shadow:0 4px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;color:white; position:relative;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>`,
        className: '', iconSize: [28, 28], iconAnchor: [14, 14],
      });
      if (provider.location && provider.location.lat !== undefined && provider.location.lng !== undefined) {
        const marker = L.marker([provider.location.lat, provider.location.lng], { icon: workerIcon })
          .addTo(mapRef.current)
          .on('click', () => {
          if (onSelectWorker) onSelectWorker(provider.worker_id, (provider as any).__categoryId);
        });
        markersRef.current.push(marker);
      }
    });

  }, [visibleProviders, leafletLoaded, onSelectWorker]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      
      {/* Map Container (Full Bleed) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

        {!leafletLoaded && (
          <div style={{
            position: 'absolute', inset: 0, background: '#F0F7FF',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
            zIndex: 1
          }}>
            <div style={{ width: 40, height: 40, border: '3px solid #0B3D66', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Loading map…</p>
          </div>
        )}
      </div>

      {/* Top Floating Badge (Providers Count) */}
      <div style={{
        position: 'absolute', top: maxSafe(16), left: 16, zIndex: 10,
        background: 'white', borderRadius: 24, padding: '8px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
          {visibleProviders.length} Specialists Online
        </span>
      </div>

      {/* Floating GPS Button */}
      <div style={{ position: 'absolute', bottom: 180, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => {
            requestLocation();
            centerOnUser();
          }}
          style={{ 
            width: 48, height: 48, borderRadius: '50%', background: 'white', border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: locationStatus === 'granted' ? '#10B981' : '#0F172A'
          }}
        >
          <Crosshair size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom Sheet Overlay (Categories) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '24px 20px', zIndex: 10,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.08)'
      }}>
        <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 20px' }} />
        
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0', letterSpacing: '-0.4px' }}>
          What do you need help with?
        </h2>

        {/* Category filter chips */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, margin: '0 -20px', padding: '0 20px' }}>
          {filters.map(f => {
            const fc = categories.find(c => c.id === f);
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => {
                  if (f === 'All') {
                    if (onClearCategory) onClearCategory();
                  } else {
                    // Alerting for now since MapScreen doesn't usually switch categories directly
                    // It expects the prop to change.
                    alert("Please select category from Home screen.");
                  }
                }}
                style={{
                  padding: '10px 16px', borderRadius: 24, whiteSpace: 'nowrap',
                  background: isActive ? '#0B3D66' : '#F8FAFC',
                  border: isActive ? '1px solid #0B3D66' : '1px solid #E2E8F0', 
                  color: isActive ? 'white' : '#0F172A',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  boxShadow: isActive ? '0 4px 10px rgba(11, 61, 102, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {fc ? `${fc.icon_url || '🔧'} ${fc.name_en}` : '🌍 All Categories'}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 
          0% { transform: scale(1); opacity: 0.5; } 
          100% { transform: scale(3); opacity: 0; } 
        }
      `}</style>
    </div>
  );
}

// Helper to handle safe area top
function maxSafe(val: number) {
  return `max(${val}px, env(safe-area-inset-top))`;
}
