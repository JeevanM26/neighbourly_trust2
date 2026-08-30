'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useApp, calcDistance } from '../../context/AppContext';
import { WorkerProfile, ServiceCategory, DEFAULT_LOCATION } from '../../lib/types';
import { 
  Navigation, Crosshair, Search, X, MapPin, Star, ShieldCheck, 
  ChevronRight, Clock, Sparkles, Zap, Droplet, Hammer, Paintbrush, 
  Flame, Scissors, Car, Check, RefreshCw, Layers
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { findNearbyWorkers, subscribeToLiveWorkers, parseWorkerCoords, calcWorkerDistance } from '../../lib/supabase';

// Category metadata helper
function getCategoryInfo(slug: string = '') {
  const s = slug.toLowerCase();
  if (s.includes('elec')) return { icon: '⚡', label: 'Electrician', color: '#F59E0B' };
  if (s.includes('plumb')) return { icon: '🚰', label: 'Plumber', color: '#0284C7' };
  if (s.includes('carp')) return { icon: '🪚', label: 'Carpenter', color: '#EA580C' };
  if (s.includes('paint')) return { icon: '🎨', label: 'Painter', color: '#9333EA' };
  if (s.includes('ac') || s.includes('appliance')) return { icon: '❄️', label: 'AC & Appliance', color: '#2563EB' };
  if (s.includes('pest')) return { icon: '🪲', label: 'Pest Control', color: '#DC2626' };
  if (s.includes('clean')) return { icon: '🧹', label: 'House Cleaning', color: '#059669' };
  if (s.includes('salon')) return { icon: '✂️', label: 'Home Salon', color: '#DB2777' };
  if (s.includes('mason')) return { icon: '🧱', label: 'Masonry', color: '#78350F' };
  if (s.includes('mech') || s.includes('auto')) return { icon: '🚗', label: 'Mechanic', color: '#4F46E5' };
  return { icon: '🔧', label: 'Specialist', color: '#0B3D66' };
}

// ─── Map Screen ───────────────────────────────────────────
export default function MapScreen({ categoryId, onBack, onSelectWorker, onClearCategory, onSelectCategory }: {
  categoryId: string | null;
  onBack?: () => void;
  onSelectWorker?: (workerId: string, categoryId?: string) => void;
  onClearCategory?: () => void;
  onSelectCategory?: (categoryId: string) => void;
}) {
  const { categories, showToast } = useApp();
  const { userLocation, locationStatus, requestLocation, searchLocation, setSearchLocation } = useLocation();
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [resolvedCenterAddress, setResolvedCenterAddress] = useState<string>('');

  // Address Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Active category filter
  const activeFilter = categoryId || 'All';
  const selectedCatObj = useMemo(() => categories.find(c => c.id === activeFilter), [categories, activeFilter]);

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
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Error fetching address:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  // Reverse geocode map center when dragging stops
  useEffect(() => {
    if (!isEditMode || !mapCenter) return;
    let isCancelled = false;
    const fetchAreaName = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapCenter.lat}&lon=${mapCenter.lng}&zoom=18&addressdetails=1`, {
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (isCancelled) return;
          const addr = data.address;
          const parts = [
            addr?.suburb || addr?.neighbourhood || addr?.residential || addr?.road,
            addr?.city || addr?.town || addr?.village,
          ].filter(Boolean);
          if (parts.length > 0) {
            setResolvedCenterAddress(parts.join(', '));
            return;
          }
          if (data.display_name) {
            setResolvedCenterAddress(data.display_name.split(',').slice(0, 2).join(', '));
            return;
          }
        }
      } catch {}
      if (!isCancelled) {
        setResolvedCenterAddress(`${mapCenter.lat.toFixed(4)}°N, ${mapCenter.lng.toFixed(4)}°E`);
      }
    };

    fetchAreaName();
    return () => { isCancelled = true; };
  }, [mapCenter, isEditMode]);

  // ── Load Leaflet ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;
    import('leaflet').then((LModule) => {
      if (isMounted) {
        (window as any).L = LModule.default || LModule;
        setLeafletLoaded(true);
      }
    }).catch(err => console.error('Failed to load Leaflet:', err));
    return () => { isMounted = false; };
  }, []);

  // ── Init Map ──
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const initialLat = searchLocation ? searchLocation.lat : (userLocation?.lat || 13.9299);
    const initialLng = searchLocation ? searchLocation.lng : (userLocation?.lng || 75.5681);

    mapRef.current = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    });

    // Google Maps Roadmap tile layer
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(mapRef.current);

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    // Track map dragging
    mapRef.current.on('movestart', () => setIsDragging(true));
    mapRef.current.on('moveend', () => {
      setIsDragging(false);
      if (mapRef.current) {
        const center = mapRef.current.getCenter();
        setMapCenter({ lat: center.lat, lng: center.lng });
      }
    });

    return () => {
      resizeObserver.disconnect();
      if (markersRef.current) {
        markersRef.current.forEach(m => {
          try { m.remove(); } catch {}
        });
        markersRef.current = [];
      }
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch {}
        userMarkerRef.current = null;
      }
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // ── Sync User Location Marker & Initial Auto-Center ──
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;

    const userIcon = L.divIcon({
      html: `
        <div class="user-pulse-marker" style="width: 22px; height: 22px; border-radius: 50%; background: #0B3D66; border: 3px solid white; box-shadow: 0 0 12px rgba(11,61,102,0.6); position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(11,61,102,0.25); animation: pulse-ring 2s infinite; pointer-events: none;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
        </div>
      `,
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (!userLocation) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup('<b style="font-family:system-ui;color:#0B3D66;">Your Location</b>');
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }

    // Only auto-center ONCE on initial load so the user can freely pan and drag the map
    if (!hasCenteredRef.current) {
      const target = searchLocation || userLocation;
      if (target) {
        mapRef.current.setView([target.lat, target.lng], 15);
        setMapCenter({ lat: target.lat, lng: target.lng });
        hasCenteredRef.current = true;
      }
    }
  }, [leafletLoaded, userLocation, searchLocation]);

  // ── Center Map on User & Reset to Live GPS ──
  const centerOnUser = async () => {
    let loc = userLocation;
    if (!loc) {
      loc = await requestLocation();
    }
    if (!loc) {
      showToast('Could not fetch live GPS. Please enable location permissions.', 'error');
      return;
    }

    // Reset manual changed area / search location back to real device GPS
    setSearchLocation(null);
    setMapCenter({ lat: loc.lat, lng: loc.lng });
    setIsEditMode(false);
    setSearchQuery('');
    setSearchResults([]);

    if (mapRef.current && leafletLoaded) {
      mapRef.current.flyTo([loc.lat, loc.lng], 15, { duration: 1.0 });
    }
    showToast('Reset to your live GPS location 📍', 'info');
  };

  // ── Fetch Workers with Continuous Real-Time Updates & Polling ──
  useEffect(() => {
    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;
    let initialTimer: NodeJS.Timeout | null = null;

    async function loadWorkers(showLoading = false) {
      if (showLoading) setIsLoadingWorkers(true);
      const searchLat = isEditMode && mapCenter ? mapCenter.lat : (searchLocation?.lat || userLocation?.lat);
      const searchLng = isEditMode && mapCenter ? mapCenter.lng : (searchLocation?.lng || userLocation?.lng);
      if (!searchLat || !searchLng) {
        if (showLoading) setIsLoadingWorkers(false);
        return;
      }
      
      let results: any[] = [];
      if (activeFilter === 'All') {
        results = await findNearbyWorkers('all', searchLat, searchLng);
      } else {
        const res = await findNearbyWorkers(activeFilter, searchLat, searchLng);
        results = res.map(w => ({ ...w, __categoryId: activeFilter }));
      }

      if (isMounted) {
        const unique = Array.from(new Map(results.map(w => [w.worker_id, w])).values());
        setVisibleProviders(unique);
        if (showLoading) setIsLoadingWorkers(false);
      }
    }

    if (categories.length > 0) {
      initialTimer = setTimeout(() => { loadWorkers(true); }, 300);
    }

    // 1. Instant Realtime WebSocket Subscription on worker_profiles
    const channel = subscribeToLiveWorkers((payload) => {
      if (!isMounted) return;
      const newRecord = payload?.new;
      const eventType = payload?.eventType;

      // Worker went offline or profile deleted
      if (eventType === 'DELETE' || (newRecord && newRecord.is_online === false)) {
        const workerId = payload?.old?.profile_id || newRecord?.profile_id;
        if (workerId) {
          setVisibleProviders(prev => prev.filter(w => w.worker_id !== workerId));
        }
        return;
      }

      // Worker updated location or came online
      if (newRecord && newRecord.is_online === true) {
        const parsedLoc = parseWorkerCoords(newRecord.location);
        const searchLat = isEditMode && mapCenter ? mapCenter.lat : (searchLocation?.lat || userLocation?.lat);
        const searchLng = isEditMode && mapCenter ? mapCenter.lng : (searchLocation?.lng || userLocation?.lng);

        if (parsedLoc && searchLat && searchLng) {
          const dist = calcWorkerDistance(searchLat, searchLng, parsedLoc.lat, parsedLoc.lng);
          const radius = Number(newRecord.service_radius_km) || 15;

          if (dist <= radius) {
            setVisibleProviders(prev => {
              const existingIdx = prev.findIndex(w => w.worker_id === newRecord.profile_id);
              if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = {
                  ...updated[existingIdx],
                  location: parsedLoc,
                  distance_km: Math.round(dist * 10) / 10,
                  is_online: true,
                };
                return updated;
              } else {
                // New nearby worker entered range / went online
                loadWorkers(false);
                return prev;
              }
            });
            return;
          }
        }
      }

      // Default refresh for other events
      loadWorkers(false);
    });

    // 2. Resilient polling fallback (every 15 seconds)
    pollTimer = setInterval(() => {
      loadWorkers(false);
    }, 15000);
    
    return () => { 
      isMounted = false; 
      if (initialTimer) clearTimeout(initialTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (channel) channel.unsubscribe();
    };
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
      const catInfo = getCategoryInfo(cat?.slug);

      const avatarHtml = provider.avatar_url
        ? `<img src="${provider.avatar_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #0B3D66; color: white; border-radius: 50%; font-size: 14px; font-weight: bold;">${provider.full_name.charAt(0)}</div>`;

      const workerHtml = `
        <div class="map-worker-pin" style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.18)); transition: transform 0.2s ease;">
          <!-- Rating Badge -->
          <div style="position: absolute; top: -14px; background: white; border: 1.5px solid #0B3D66; border-radius: 10px; padding: 1px 6px; display: flex; align-items: center; gap: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.12); font-family: system-ui; font-size: 10px; font-weight: 800; color: #0F172A; white-space: nowrap; z-index: 20;">
            <span style="color: #F59E0B;">★</span><span>${Number(provider.avg_rating || 4.9).toFixed(1)}</span>
          </div>
          
          <!-- Outer Pin Shape -->
          <div style="width: 38px; height: 38px; border-radius: 50% 50% 50% 0; background: linear-gradient(135deg, #0B3D66, #041B30); border: 2.5px solid white; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
            <div style="width: 100%; height: 100%; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 50%;">
              ${avatarHtml}
            </div>
          </div>
          
          <!-- Category Badge -->
          <div style="position: absolute; bottom: -2px; right: -2px; width: 20px; height: 20px; border-radius: 50%; background: #F59E0B; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px; z-index: 15; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
            ${catInfo.icon}
          </div>
        </div>
      `;

      const workerIcon = L.divIcon({
        html: workerHtml,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 40],
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

    if (!isEditMode && searchLocation) {
      const pickupHtml = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25));">
          <div style="width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: #0F172A; border: 2.5px solid white; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="width: 9px; height: 9px; background: #10B981; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        </div>
      `;
      const pickupIcon = L.divIcon({
        html: pickupHtml,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 30],
      });
      const pickupMarker = L.marker([searchLocation.lat, searchLocation.lng], { icon: pickupIcon, zIndexOffset: -100 })
        .addTo(mapRef.current)
        .bindPopup('<b style="font-family:system-ui;color:#0F172A;">Service Location</b>');
      markersRef.current.push(pickupMarker);
    }
  }, [visibleProviders, leafletLoaded, onSelectWorker, categories, isEditMode, searchLocation]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      
      {/* ─── MAP CANVAS (FULL BLEED) ─── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

        {/* Uber-style Center Pin in Location Pick Mode */}
        {leafletLoaded && isEditMode && (
          <div style={{
            position: 'absolute',
            top: 'calc(50% - 40px)',
            left: '50%',
            transform: 'translate(-50%, -100%)',
            zIndex: 400,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
            marginTop: isDragging ? '-14px' : '0px',
            filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.25))'
          }}>
            {/* Address Pill floating above pin */}
            <div style={{
              background: '#041B30',
              color: 'white',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 4,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              opacity: isDragging ? 0.6 : 1,
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <MapPin size={12} color="#10B981" />
              <span>{isDragging ? 'Dragging Map...' : (resolvedCenterAddress || 'Adjusting Pin...')}</span>
            </div>

            {/* Custom SVG Location Pin */}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C7.58172 2 4 5.58172 4 10C4 11.8919 4.40209 13.1304 5.5 15L12 22L18.5 15C19.5979 13.1304 20 11.8919 20 10C20 5.58172 16.4183 2 12 2ZM12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" fill="#0B3D66"/>
            </svg>
            
            {/* Shadow Dot */}
            <div style={{
              width: 10, height: 5, background: 'rgba(0,0,0,0.35)', borderRadius: '50%',
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
            <p style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Loading map & specialists…</p>
          </div>
        )}
      </div>

      {/* ─── TOP FLOATING BAR (VIEW MODE) ─── */}
      {!isEditMode && (
        <div style={{
          position: 'absolute', top: maxSafe(14), left: 16, right: 16, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          pointerEvents: 'none'
        }}>
          {/* Provider Count Pill */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
            borderRadius: 24, padding: '8px 14px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8,
            pointerEvents: 'auto', border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.2px' }}>
              {visibleProviders.length} {visibleProviders.length === 1 ? 'Specialist' : 'Specialists'} Nearby
            </span>
          </div>

          {/* Change Location Button */}
          <button
            onClick={() => setIsEditMode(true)}
            style={{
              background: 'white', color: '#0B3D66', border: '1px solid #E2E8F0',
              padding: '8px 14px', borderRadius: 24, fontSize: 13, fontWeight: 800,
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)', cursor: 'pointer',
              pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <MapPin size={14} color="#0B3D66" />
            <span>Change Area</span>
          </button>
        </div>
      )}

      {/* ─── ADDRESS SEARCH & EDIT BAR (EDIT MODE) ─── */}
      {isEditMode && (
        <div style={{ position: 'absolute', top: maxSafe(14), left: 16, right: 16, zIndex: 500 }}>
          <div style={{
            background: 'white', borderRadius: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '1.5px solid #0B3D66',
            overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '4px 12px'
          }}>
            <Search size={18} color="#64748B" style={{ flexShrink: 0, marginRight: 8 }} />
            <input
              type="text"
              placeholder="Search area, landmark or street..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                flex: 1, padding: '10px 0', border: 'none',
                fontSize: 14, fontWeight: 600, outline: 'none', color: '#0F172A'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => { setIsEditMode(false); setSearchResults([]); }}
              style={{
                background: '#F1F5F9', border: 'none', borderRadius: 12,
                padding: '6px 12px', fontSize: 12, fontWeight: 700,
                color: '#475569', cursor: 'pointer', marginLeft: 6
              }}
            >
              Cancel
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: 8, background: 'white', borderRadius: 16,
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)', overflow: 'hidden',
              maxHeight: 240, overflowY: 'auto', border: '1px solid #E2E8F0'
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
                    setSearchQuery(result.display_name.split(',')[0]);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid #F1F5F9',
                    cursor: 'pointer', fontSize: 13, color: '#0F172A',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <MapPin size={15} color="#0B3D66" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.display_name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── FLOATING GPS BUTTON (ANCHORED ABOVE BOTTOM SHEET) ─── */}
      <div style={{ 
        position: 'absolute', 
        bottom: isEditMode ? 120 : 340, 
        right: 16, 
        zIndex: 25, 
        transition: 'bottom 0.2s ease' 
      }}>
        <button
          onClick={centerOnUser}
          title="Locate Me"
          style={{ 
            width: 48, height: 48, borderRadius: 24, 
            background: 'white', border: '1.5px solid #E2E8F0',
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: locationStatus === 'granted' ? '#10B981' : '#0B3D66'
          }}
        >
          <Crosshair size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* ─── EDIT MODE CONFIRMATION ACTION BAR ─── */}
      {isEditMode && (
        <div style={{
          position: 'absolute', bottom: 20, left: 16, right: 16, zIndex: 50,
          background: 'white', borderRadius: 20, padding: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0',
          display: 'flex', flexDirection: 'column', gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="#0B3D66" />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {resolvedCenterAddress || 'Center map on your service spot'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setIsEditMode(false); setSearchResults([]); }}
              style={{
                flex: 1, padding: '12px', borderRadius: 14,
                border: '1.5px solid #E2E8F0', background: 'white',
                color: '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (mapCenter) {
                  setSearchLocation(mapCenter);
                  showToast('Service location set! 📍', 'success');
                  setJustConfirmed(true);
                  setTimeout(() => {
                    setJustConfirmed(false);
                    setIsEditMode(false);
                  }, 400);
                }
              }}
              style={{
                flex: 2, padding: '12px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #0B3D66, #041B30)',
                color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(11,61,102,0.3)'
              }}
            >
              <Check size={16} />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── BOTTOM SHEET (VIEW MODE) ─── */}
      {!isEditMode && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: '16px 20px 24px', zIndex: 20,
          boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
          maxHeight: '48vh', overflowY: 'auto'
        }}>
          {/* Handle */}
          <div style={{ width: 36, height: 4, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 14px' }} />

          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
              What do you need help with?
            </h2>
            {activeFilter !== 'All' && (
              <button
                onClick={() => onClearCategory?.()}
                style={{ background: 'none', border: 'none', color: '#0B3D66', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Category Filter Chips Carousel */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '0 20px 8px' }}>
            {/* All Category Pill */}
            <button
              onClick={() => onClearCategory?.()}
              style={{
                padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                background: activeFilter === 'All' ? 'linear-gradient(135deg, #0B3D66, #041B30)' : '#F8FAFC',
                border: activeFilter === 'All' ? '1.5px solid #0B3D66' : '1px solid #E2E8F0',
                color: activeFilter === 'All' ? 'white' : '#0F172A',
                fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
                boxShadow: activeFilter === 'All' ? '0 4px 10px rgba(11, 61, 102, 0.2)' : 'none',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s ease'
              }}
            >
              <span>⚡</span>
              <span>All Services</span>
            </button>

            {categories.map(c => {
              const isActive = activeFilter === c.id;
              const info = getCategoryInfo(c.slug);

              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCategory?.(c.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                    background: isActive ? 'linear-gradient(135deg, #0B3D66, #041B30)' : '#F8FAFC',
                    border: isActive ? '1.5px solid #0B3D66' : '1px solid #E2E8F0',
                    color: isActive ? 'white' : '#0F172A',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
                    boxShadow: isActive ? '0 4px 10px rgba(11, 61, 102, 0.2)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{info.icon}</span>
                  <span>{c.name_en}</span>
                </button>
              );
            })}
          </div>

          {/* Specialists Carousel */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Available Specialists
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>
                ⚡ Fast Arrival
              </span>
            </div>

            {visibleProviders.length === 0 ? (
              <div style={{
                background: '#F8FAFC', borderRadius: 16, padding: '24px 16px',
                textAlign: 'center', border: '1.5px dashed #E2E8F0'
              }}>
                <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  No specialists in this exact spot
                </p>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748B' }}>
                  Try switching categories or zooming out slightly.
                </p>
                <button
                  onClick={() => onClearCategory?.()}
                  style={{
                    background: '#0B3D66', color: 'white', border: 'none',
                    borderRadius: 12, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  View All Services
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '0 20px 4px' }}>
                {visibleProviders.map(worker => {
                  const catId = (worker as any).__categoryId || worker.category_id;
                  const cat = categories.find(c => c.id === catId);
                  const catInfo = getCategoryInfo(cat?.slug);

                  const targetCoords = searchLocation || (mapCenter && !isEditMode ? mapCenter : (userLocation || { lat: 28.6139, lng: 77.2090 }));
                  const dist = (worker.location && targetCoords)
                    ? calcDistance(targetCoords.lat, targetCoords.lng, worker.location.lat, worker.location.lng)
                    : (worker.distance_km ?? 1.2);
                  const estMins = Math.max(8, Math.round(dist * 4 + 4));

                  return (
                    <div
                      key={worker.worker_id}
                      onClick={() => onSelectWorker?.(worker.worker_id, catId)}
                      style={{
                        minWidth: 260,
                        background: 'white',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: 18,
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      {/* Specialist Info Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                          <img
                            src={worker.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.full_name)}&background=0B3D66&color=fff`}
                            alt={worker.full_name}
                            style={{ width: 48, height: 48, borderRadius: 16, objectFit: 'cover', border: '1.5px solid #E2E8F0' }}
                          />
                          <div style={{
                            position: 'absolute', bottom: -3, right: -3,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#10B981', border: '2px solid white',
                            boxShadow: '0 0 4px #10B981'
                          }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontWeight: 900, fontSize: 15, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {worker.full_name}
                            </span>
                            <ShieldCheck size={14} color="#059669" />
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 800, color: '#0F172A', background: '#FEF3C7', padding: '1px 6px', borderRadius: 8, fontSize: 11 }}>
                              <Star size={10} fill="#F59E0B" color="#F59E0B" /> {Number(worker.avg_rating || 4.9).toFixed(1)}
                            </span>
                            <span>•</span>
                            <span style={{ fontWeight: 600 }}>{cat?.name_en || catInfo.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Distance Row */}
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        background: '#F8FAFC', padding: '8px 10px', borderRadius: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#059669' }}>
                          <Clock size={12} />
                          <span>~{estMins} mins ({dist.toFixed(1)} km)</span>
                        </div>
                      </div>

                      {/* Book CTA Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorker?.(worker.worker_id, catId);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'linear-gradient(135deg, #0B3D66, #041B30)',
                          color: 'white',
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 4px 10px rgba(11,61,102,0.2)'
                        }}
                      >
                        <span>Book Specialist</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  );
                })}
                <div style={{ width: 8, flexShrink: 0 }} />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 
          0% { transform: scale(1); opacity: 0.6; } 
          100% { transform: scale(2.8); opacity: 0; } 
        }
      `}</style>
    </div>
  );
}

// Helper to handle safe area top
function maxSafe(val: number) {
  return `max(${val}px, env(safe-area-inset-top))`;
}
