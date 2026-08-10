'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkerProfile, ServiceCategory, DEFAULT_LOCATION } from '../../lib/types';
import { Navigation, Crosshair } from 'lucide-react';

import { findNearbyWorkers } from '../../lib/supabase';

// ─── Map Screen ───────────────────────────────────────────
export default function MapScreen({
  categoryId,
  onSelectWorker,
  onSelectCategory,
  onClearCategory,
  onLocationConfirmed
}: {
  categoryId: string | null;
  onSelectWorker?: (workerId: string, categoryId?: string) => void;
  onSelectCategory?: (categoryId: string) => void;
  onClearCategory?: () => void;
  onLocationConfirmed?: () => void;
}) {
  const { categories, userLocation, locationStatus, requestLocation, searchLocation, setSearchLocation, showToast } = useApp();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const hasCenteredRef = useRef(false);
  const [visibleProviders, setVisibleProviders] = useState<WorkerProfile[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  
  // Uber-style draggable map state
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!searchLocation);

  // Address Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Address Search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Error fetching address:', err);
      } finally {
        setIsSearching(false);
      }
    }, 600);
  };

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

    // Google Maps Roadmap tile layer
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(mapRef.current);

    // Resize observer to handle window resizing
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    // Track map dragging
    mapRef.current.on('movestart', () => {
      setIsDragging(true);
    });
    mapRef.current.on('move', () => {
      setIsDragging(true);
    });
    mapRef.current.on('moveend', () => {
      setIsDragging(false);
      const center = mapRef.current.getCenter();
      setMapCenter({ lat: center.lat, lng: center.lng });
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [leafletLoaded]);

  // ── Sync User Location Marker ──
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;

    const userIcon = L.divIcon({
      html: `
        <div class="user-pulse-marker" style="width: 22px; height: 22px; border-radius: 50%; background: #3B82F6; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.6); position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(59,130,246,0.3); animation: pulse-ring 2s infinite; pointer-events: none;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
        </div>
      `,
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup('<b style="font-family:system-ui;color:#1E3A8A;">You</b>');
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }

    // Auto-center map on user's real location when first retrieved (non-default coordinates)
    const isDefault = userLocation.lat === DEFAULT_LOCATION.lat && userLocation.lng === DEFAULT_LOCATION.lng;
    if (!isDefault && !hasCenteredRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
      setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
      hasCenteredRef.current = true;
    }
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
      // If we are in edit mode, search around the map center. Otherwise search around the confirmed searchLocation.
      const searchLat = isEditMode ? (mapCenter ? mapCenter.lat : userLocation?.lat) : searchLocation?.lat;
      const searchLng = isEditMode ? (mapCenter ? mapCenter.lng : userLocation?.lng) : searchLocation?.lng;
      if (!searchLat || !searchLng) return;

      if (activeFilter === 'All') {
        const promises = categories.map(c => findNearbyWorkers(c.id, searchLat, searchLng).then(workers => workers.map(w => ({...w, __categoryId: c.id}))));
        const results = await Promise.all(promises);
        const allWorkers = results.flat();
        const unique = Array.from(new Map(allWorkers.map(w => [w.worker_id, w])).values());
        if (isMounted) {
          setVisibleProviders(unique);
          setIsLoadingWorkers(false);
        }
        return;
      }
      const workers = await findNearbyWorkers(activeFilter, searchLat, searchLng);
      const taggedWorkers = workers.map(w => ({...w, __categoryId: activeFilter}));
      if (isMounted) {
        setVisibleProviders(taggedWorkers);
        setIsLoadingWorkers(false);
      }
    }
    if (categories.length > 0) fetchWorkers();
    return () => { isMounted = false; };
  }, [activeFilter, mapCenter, userLocation?.lat, userLocation?.lng, categories, isEditMode, searchLocation?.lat, searchLocation?.lng]);

  // ── Update Provider Markers ──
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    visibleProviders.forEach(provider => {
      const catId = (provider as any).__categoryId;
      const cat = categories.find(c => c.id === catId);
      const catSlug = cat ? cat.slug : '';

      // Match category slug to category emojis
      let categoryIconHtml = '🔧';
      if (catSlug === 'electrician') categoryIconHtml = '⚡';
      else if (catSlug === 'plumbing' || catSlug === 'plumber') categoryIconHtml = '🚰';
      else if (catSlug === 'carpenter') categoryIconHtml = '🪚';
      else if (catSlug === 'home-clean' || catSlug === 'house-cleaning') categoryIconHtml = '✨';

      // Worker avatar or placeholder
      const avatarHtml = provider.avatar_url
        ? `<img src="${provider.avatar_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #0B3D66; color: white; border-radius: 50%; font-size: 14px; font-weight: bold;">${provider.full_name.charAt(0)}</div>`;

      // Custom Blinkit/Zomato/Rapido style HTML pin
      const workerHtml = `
        <div class="map-worker-pin" style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15)); transition: transform 0.2s ease;">
          <!-- Rating Badge -->
          <div style="position: absolute; top: -14px; background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1px 4px; display: flex; align-items: center; gap: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-family: system-ui; font-size: 9px; font-weight: 800; color: #0F172A; white-space: nowrap; z-index: 20;">
            <span style="color: #F59E0B;">★</span><span>${Number(provider.avg_rating || 4.9).toFixed(1)}</span>
          </div>
          
          <!-- Outer Pin Shape (rotated at -45deg) -->
          <div style="width: 36px; height: 36px; border-radius: 50% 50% 50% 0; background: #F59E0B; border: 2.5px solid white; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
            <!-- Inner Avatar Content (rotated +45deg to render straight) -->
            <div style="width: 100%; height: 100%; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 50%;">
              ${avatarHtml}
            </div>
          </div>
          
          <!-- Category Badge -->
          <div style="position: absolute; bottom: 0px; right: 0px; width: 18px; height: 18px; border-radius: 50%; background: #0B3D66; border: 1.5px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; z-index: 15; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${categoryIconHtml}
          </div>
        </div>
      `;

      const workerIcon = L.divIcon({
        html: workerHtml,
        className: '',
        iconSize: [42, 42],
        iconAnchor: [21, 38],
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

    // Add Confirmed Pickup Location Marker in View Mode
    if (!isEditMode && searchLocation) {
      const pickupHtml = `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">
          <div style="width: 24px; height: 24px; border-radius: 50% 50% 50% 0; background: #0F172A; border: 2px solid white; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        </div>
      `;
      const pickupIcon = L.divIcon({
        html: pickupHtml,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 28],
      });
      const pickupMarker = L.marker([searchLocation.lat, searchLocation.lng], { icon: pickupIcon, zIndexOffset: -100 })
        .addTo(mapRef.current)
        .bindPopup('<b style="font-family:system-ui;color:#0F172A;">Confirmed Pickup</b>');
      markersRef.current.push(pickupMarker);
    }

  }, [visibleProviders, leafletLoaded, onSelectWorker, categories, isEditMode, searchLocation]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      
      {/* Map Container (Full Bleed) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

        {/* Uber-style Center Pin (Only in Edit Mode) */}
        {leafletLoaded && isEditMode && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -100%)',
            zIndex: 400,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
            marginTop: isDragging ? '-12px' : '0px',
            filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.2))'
          }}>
            <button 
              onClick={() => {
                if (mapCenter) {
                  setSearchLocation(mapCenter);
                  showToast('Pickup location set!', 'success');
                  setJustConfirmed(true);
                  setTimeout(() => {
                    setJustConfirmed(false);
                    setIsEditMode(false);
                  }, 1000);
                }
              }}
              style={{
              pointerEvents: 'auto',
              background: justConfirmed ? '#10B981' : '#0F172A',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 4,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              opacity: isDragging ? 0.5 : 1,
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: justConfirmed ? '2px solid #10B981' : '2px solid white',
              transform: 'translateY(0) scale(1)'
            }}>
              {isDragging ? 'Moving...' : justConfirmed ? '✓ Confirmed!' : 'Confirm Location'}
            </button>
            {/* Custom SVG Pin */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C7.58172 2 4 5.58172 4 10C4 11.8919 4.40209 13.1304 5.5 15L12 22L18.5 15C19.5979 13.1304 20 11.8919 20 10C20 5.58172 16.4183 2 12 2ZM12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" fill="#0F172A"/>
            </svg>
            {/* Shadow Dot */}
            <div style={{
              width: 8, height: 4, background: 'rgba(0,0,0,0.3)', borderRadius: '50%',
              position: 'absolute', bottom: -2, zIndex: -1,
              transform: isDragging ? 'scale(0.5)' : 'scale(1)', transition: 'transform 0.15s'
            }} />
          </div>
        )}

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

      {/* Top Floating Bar */}
      <div style={{
        position: 'absolute', top: maxSafe(16), left: 16, right: 16, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none' // Allow clicks to pass through the container itself
      }}>
        {/* Providers Count Badge */}
        {!isEditMode && (
          <div style={{
            background: 'white', borderRadius: 24, padding: '8px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8,
            pointerEvents: 'auto'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
              {visibleProviders.length} Specialists
            </span>
          </div>
        )}

        {/* Change Location Button (View Mode) */}
        {!isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            style={{
              background: 'white', color: '#0F172A', border: '1px solid #E2E8F0',
              padding: '8px 16px', borderRadius: 24, fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          >
            Change Location
          </button>
        )}
      </div>

      {/* Address Search Bar (Only in Edit Mode) */}
      {isEditMode && (
        <div style={{ position: 'absolute', top: maxSafe(16), left: 16, right: 16, zIndex: 500 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search for a city or address..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                borderRadius: 24,
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: 15,
                outline: 'none',
                color: '#0F172A'
              }}
            />
            <div style={{ position: 'absolute', left: 14, top: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            {isSearching && (
              <div style={{ position: 'absolute', right: 16, top: 14 }}>
                <div style={{ width: 16, height: 16, border: '2px solid #0B3D66', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
          </div>

          {/* Dropdown Results */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: 8,
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              maxHeight: 250,
              overflowY: 'auto'
            }}>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (!mapRef.current) return;
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    mapRef.current.flyTo([lat, lon], 15);
                    setSearchResults([]);
                    setSearchQuery(result.display_name.split(',')[0]); // Just show the first part
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid #F1F5F9',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#0F172A'
                  }}
                >
                  {result.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State Warning */}
      {!isLoadingWorkers && visibleProviders.length === 0 && (
        <div style={{
          position: 'absolute', top: maxSafe(isEditMode ? 80 : 70), left: 16, right: 16, zIndex: 400,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none'
        }}>
          <div style={{
            background: '#FEF2F2', border: '1px solid #F87171', borderRadius: 16,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 12px rgba(248, 113, 113, 0.2)'
          }}>
            <span style={{ fontSize: 18 }}>😕</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
              No specialists found. Try zooming out or moving the map!
            </span>
          </div>
        </div>
      )}

      {/* Floating GPS Button */}
      <div style={{ position: 'absolute', bottom: 180, right: 16, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => {
            requestLocation();
            centerOnUser();
            setIsEditMode(true); // Switch to edit mode so they can confirm it
          }}
          style={{ 
            height: 44, padding: '0 16px', borderRadius: 22, background: 'white', border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: locationStatus === 'granted' ? '#10B981' : '#0F172A', gap: 8
          }}
        >
          <Crosshair size={20} strokeWidth={2.5} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Live Location</span>
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
                    if (onSelectCategory) onSelectCategory(f);
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
