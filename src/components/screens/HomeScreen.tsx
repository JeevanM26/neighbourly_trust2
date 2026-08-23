'use client';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLocation } from '../../context/LocationContext';
import { WorkerProfile } from '../../lib/types';
import { findNearbyWorkers } from '../../lib/supabase';
import { detectIntent } from '../../lib/intentEngine';
import { SearchWithVoice } from '../SearchWithVoice';
import { 
  Zap, Droplet, Hammer, Paintbrush, Sparkles, Wrench as Tool, 
  Volume2, VolumeX, RefreshCw, MapPin, Star, X, 
  Flame, Bug, Scissors, Car, ChevronRight 
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English',  native: 'English',  flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi',    native: 'हिन्दी',   flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada',  native: 'ಕನ್ನಡ',    flag: '🇮🇳' },
  { code: 'te', name: 'Telugu',   native: 'తెలుగు',   flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil',    native: 'தமிழ்',    flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi',  native: 'मराठी',    flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali',  native: 'বাংলা',    flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી',  flag: '🇮🇳' },
];

const isCategoryMatch = (catName: string, intentCat: string) => {
  const normCat = catName.toLowerCase();
  const normIntent = intentCat.toLowerCase();
  if (normCat === normIntent) return true;
  if (normCat === 'house cleaning' && normIntent === 'home clean') return true;
  if (normCat === 'home clean' && normIntent === 'house cleaning') return true;
  if (normCat === 'pest control' && normIntent === 'pest control') return true;
  return false;
};

export const getAssetPath = (path: string): string => {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    return `/neighbourly_trust2${cleanPath}`;
  }
  return cleanPath;
};

const getCategory3DImage = (slug: string = ''): string => {
  const s = slug.toLowerCase();
  let img = '/categories/electrician.png';
  if (s.includes('elec')) img = '/categories/electrician.png';
  else if (s.includes('plumb')) img = '/categories/plumber.png';
  else if (s.includes('carp')) img = '/categories/carpenter.png';
  else if (s.includes('paint')) img = '/categories/painter.png';
  else if (s.includes('clean')) img = '/categories/cleaning.png';
  else if (s.includes('pest')) img = '/categories/pestcontrol.png';
  else if (s.includes('ac') || s.includes('appliance')) img = '/categories/acrepair.png';
  else if (s.includes('salon') || s.includes('barber')) img = '/categories/salon.png';
  else if (s.includes('mason')) img = '/categories/mason.png';
  else if (s.includes('mechanic') || s.includes('auto')) img = '/categories/mechanic.png';
  return getAssetPath(img);
};

const getCategoryFallbackIcon = (slug: string = '') => {
  const s = slug.toLowerCase();
  if (s.includes('elec')) return <Zap size={28} className="text-amber-400" />;
  if (s.includes('plumb')) return <Droplet size={28} className="text-sky-400" />;
  if (s.includes('carp')) return <Hammer size={28} className="text-orange-400" />;
  if (s.includes('paint')) return <Paintbrush size={28} className="text-purple-400" />;
  if (s.includes('clean')) return <Sparkles size={28} className="text-teal-400" />;
  if (s.includes('pest')) return <Bug size={28} className="text-rose-400" />;
  if (s.includes('ac')) return <Flame size={28} className="text-blue-400" />;
  if (s.includes('salon')) return <Scissors size={28} className="text-pink-400" />;
  if (s.includes('mechanic')) return <Car size={28} className="text-emerald-400" />;
  return <Tool size={28} className="text-amber-400" />;
};

const CategoryIcon = ({ slug, size = 58 }: { slug: string, size?: number }) => {
  const [hasError, setHasError] = useState(false);
  const imgPath = getCategory3DImage(slug);

  if (hasError) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}
      >
        {getCategoryFallbackIcon(slug)}
      </div>
    );
  }

  return (
    <img 
      src={imgPath} 
      alt={slug} 
      onError={() => setHasError(true)}
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'contain',
        filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }} 
    />
  );
};

const PRESET_CHIPS = [
  { label: '⚡ Light repair',   query: 'Light is not working'          },
  { label: '🚰 Water leakage',  query: 'Water tap leaking'             },
  { label: '🧹 Cleaning maid',  query: 'House cleaning helper needed'  },
  { label: '🔧 Motor pump',     query: 'Borewell motor pump repair'    },
  { label: '🪚 Carpenter',      query: 'Door lock repair carpenter'    },
  { label: '🎨 Wall painting',  query: 'Wall paint color work'         },
];

export default function HomeScreen({ 
  onSelectCategory,
  onSelectWorker
}: { 
  onSelectCategory: (categoryId: string) => void;
  onSelectWorker?: (workerId: string, categoryId: string) => void;
}) {
  const { categories, user, settings, toggleVoice, t, setLanguage, showToast } = useApp();
  const { userLocation, locationStatus, requestLocation, searchLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const currentLangObj = LANGUAGES.find(l => l.code === settings?.language) || LANGUAGES[0];
  
  // Specialists state
  const [nearbyWorkers, setNearbyWorkers] = useState<WorkerProfile[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    // Automatically prompt for location when the user lands on the Home Screen
    // so they can actually find workers near their real GPS coordinates
    if (locationStatus === 'idle') {
      requestLocation().catch(() => {});
    }
  }, [locationStatus, requestLocation]);

  const speakText = React.useCallback((text: string) => {
    if (!settings.voice || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95;
      utt.lang = currentLangObj.code === 'hi' ? 'hi-IN' : 'en-IN'; 
      window.speechSynthesis.speak(utt);
    } catch { /* non-fatal */ }
  }, [settings.voice, currentLangObj.code]);

  const activeLoc = searchLocation || userLocation || { lat: 28.6139, lng: 77.2090 };
  const roundedLat = activeLoc.lat;
  const roundedLng = activeLoc.lng;
  const hasFetchedRef = React.useRef(false);

  const handleRefresh = async () => {
    if (categories.length === 0) return;
    setIsLoadingWorkers(true);
    let results: any[] = [];
    if (activeCategory) {
      results = await findNearbyWorkers(activeCategory, roundedLat, roundedLng);
    } else {
      const catPromises = categories.map(cat => findNearbyWorkers(cat.id, roundedLat, roundedLng));
      const allRes = await Promise.all(catPromises);
      results = Array.from(new Map(allRes.flat().map(w => [w.worker_id, w])).values());
    }
    setNearbyWorkers(results);
    setIsLoadingWorkers(false);
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const intent = detectIntent(searchQuery);
      if (intent?.category) {
        const matchedCat = categories.find(c => isCategoryMatch(c.name_en, intent.category));
        if (matchedCat) {
          setActiveCategory(matchedCat.id);
        }
      }
    }
  }, [searchQuery, categories]);

  useEffect(() => {
    let isMounted = true;
    async function fetchWorkers() {
      if (!hasFetchedRef.current) {
        setIsLoadingWorkers(true);
      }

      let results: any[] = [];
      if (activeCategory) {
        results = await findNearbyWorkers(activeCategory, roundedLat, roundedLng);
      } else {
        const catPromises = categories.map(cat => findNearbyWorkers(cat.id, roundedLat, roundedLng));
        const allRes = await Promise.all(catPromises);
        results = Array.from(new Map(allRes.flat().map(w => [w.worker_id, w])).values());
      }
      
      if (isMounted) {
        setNearbyWorkers(results);
        setIsLoadingWorkers(false);
        hasFetchedRef.current = true;
      }
    }
    if (categories.length > 0) fetchWorkers();
    return () => { isMounted = false; };
  }, [categories, roundedLat, roundedLng, activeCategory]);

  const filteredWorkers = React.useMemo(() => {
    let result = nearbyWorkers;
    
    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const intent = detectIntent(searchQuery);
      result = result.filter(w => {
        const catName = categories.find(c => c.id === w.category_id)?.name_en || '';
        const nameMatch = w.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const catMatch = intent?.category 
          ? isCategoryMatch(catName, intent.category) 
          : catName.toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || catMatch;
      });
    }

    // 2. Active Pill Filter
    if (activeFilter === 'Top Rated') {
      result = result.filter(w => (w.avg_rating || 0) >= 4.8);
    } else if (activeFilter === 'Available Now') {
      result = result.filter(w => w.is_online);
    } else if (activeFilter === 'Under ₹350') {
      result = result.filter(w => (w.hourly_rate || 350) < 350);
    }

    return result;
  }, [nearbyWorkers, searchQuery, categories, activeFilter]);

  const greeting = new Date().getHours() < 12 ? t('goodMorning') : t('goodAfternoon');
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F1F5F9', overflowY: 'auto' }}>
      
      {/* ─── Top Section (Dark Blue) ─── */}
      <div style={{ 
        background: '#0B2942', // Dark navy background
        color: 'white',
      }}>
        <div style={{ padding: '24px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 500 }}>
              {greeting},
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: '2px 0 0', letterSpacing: '-0.5px' }}>
              {user?.full_name?.split(' ')[0] || 'Friend'} 👋
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              onClick={() => toggleVoice()}
              style={{ width: 40, height: 40, borderRadius: '50%', background: settings.voice ? '#0F5762' : 'rgba(255,255,255,0.1)', border: `1px solid ${settings.voice ? '#147B88' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: settings.voice ? '#2DD4BF' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              {settings.voice ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button onClick={() => setShowLangPicker(true)} style={{ cursor: 'pointer', height: 40, padding: '0 16px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', color: 'white', fontSize: 14, fontWeight: 700, gap: 4 }}>
              <span>{currentLangObj.flag}</span><span style={{ fontSize: 13 }}>{currentLangObj.native}</span>
            </button>
          </div>
        </div>

        {/* Search Component Wrapper */}
        <div style={{ padding: '0 20px', position: 'relative' }}>
          {/* We wrap SearchWithVoice to hide its hardcoded padding and styles if possible, or just render it */}
          <SearchWithVoice 
            value={searchQuery}
            onSearchChange={setSearchQuery} 
            selectedLanguage={settings?.language === 'hi' ? 'hi-IN' : 'en-IN'}
            placeholder={t('searchPlaceholder')}
            listeningPlaceholder={t('listening')}
          />
        </div>

        {/* Quick Chips */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '16px 20px 24px', scrollbarWidth: 'none' }}>
          {PRESET_CHIPS.map((chip, idx) => (
            <button key={idx} 
              onClick={() => setSearchQuery(chip.query)}
              style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'white', padding: '8px 16px', borderRadius: 20, fontSize: 13,
              fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer'
            }}>
              {chip.label}
            </button>
          ))}
        </div>
        
        {/* ─── All Services Section (Sleek Horizontal Scroll Row) ─── */}
        <div style={{ background: '#081B2C', padding: '16px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Section Header */}
          <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.2px' }}>
              {t('allServices')}
            </h2>
            <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
              Swipe to explore →
            </span>
          </div>

          {/* Horizontal Scroll Row */}
          <div style={{ 
            display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 20px 8px', scrollbarWidth: 'none',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch'
          }}>
            {categories.map(cat => {
              const isSelected = (searchQuery.toLowerCase() === cat.name_en.toLowerCase()) || activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSearchQuery(isSelected ? '' : cat.name_en);
                    setActiveCategory(isSelected ? null : cat.id);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer',
                    background: isSelected 
                      ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.22) 0%, rgba(56, 189, 248, 0.08) 100%)' 
                      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    border: isSelected ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: '8px 4px 10px', minWidth: 88, width: 88, flexShrink: 0,
                    scrollSnapAlign: 'start',
                    boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.4)' : '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ 
                    width: 60, height: 60, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    <CategoryIcon slug={cat.slug} size={58} />
                  </div>
                  <span style={{ 
                    fontSize: 12, fontWeight: 800, 
                    color: isSelected ? '#38BDF8' : 'rgba(255,255,255,0.9)', 
                    textAlign: 'center', lineHeight: 1.2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%',
                    transition: 'color 0.2s ease'
                  }}>
                    {cat.name_en === 'House Cleaning' ? 'Cleaning' : cat.name_en === 'AC & Appliance Repair' ? 'AC Repair' : cat.name_en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Bottom Section (Light Gray) ─── */}
      <div style={{ background: '#F8FAFC', flex: 1, paddingBottom: 100 }}>
        
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '16px 20px', background: 'white', borderBottom: '1px solid #F1F5F9', scrollbarWidth: 'none' }}>
          {[
            { id: 'All', label: t('filterAll') }, 
            { id: 'Top Rated', label: t('filterTopRated') }, 
            { id: 'Available Now', label: t('filterAvailableNow') }, 
            { id: 'Under ₹350', label: t('filterUnder350') }
          ].map((f) => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
              background: activeFilter === f.id ? '#0B3D66' : '#F1F5F9',
              color: activeFilter === f.id ? 'white' : '#334155',
              border: 'none', borderRadius: 20, padding: '8px 16px',
              fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Specialists Near You */}
        <div style={{ padding: '24px 20px' }}>
          <div style={{ padding: '24px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                {t('specialistsNearYou')}
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} /> {filteredWorkers.length} {filteredWorkers.length === 1 ? t('verifiedSpecialistFound') : t('verifiedSpecialistsFound')}
              </p>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={isLoadingWorkers}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 6, background: 'white', 
                border: '1px solid #E2E8F0', borderRadius: 20, padding: '6px 14px',
                fontSize: 13, fontWeight: 700, color: isLoadingWorkers ? '#94A3B8' : '#0B3D66', 
                cursor: isLoadingWorkers ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <RefreshCw size={14} className={isLoadingWorkers ? 'animate-spin' : ''} /> {isLoadingWorkers ? t('refreshing') : t('refresh')}
            </button>
          </div>

          {/* Specialist Cards Horizontal Scroll */}
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 0 16px', scrollSnapType: 'x mandatory' }}>
            {isLoadingWorkers ? (
              <>
                <ProviderSkeleton />
                <ProviderSkeleton />
                <ProviderSkeleton />
              </>
            ) : filteredWorkers.length > 0 ? filteredWorkers.map(worker => {
              const cat = categories.find(c => c.id === worker.category_id);
              const catName = cat?.name_en || 'Specialist';
              const avatar = worker.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.full_name)}&background=0B3D66&color=fff&size=200`;

              return (
                <div 
                  key={worker.worker_id} 
                  onClick={() => onSelectWorker?.(worker.worker_id, worker.category_id || '')}
                  style={{
                    background: 'white', borderRadius: 22, overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)', position: 'relative',
                    width: 270, minWidth: 270, flexShrink: 0, cursor: 'pointer',
                    scrollSnapAlign: 'start',
                    display: 'flex', flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Card Header Image Area */}
                  <div style={{ 
                    height: 150, background: '#0F172A', position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={avatar} 
                      alt={worker.full_name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 50%, transparent 100%)'
                    }} />

                    {/* TOP PRO badge */}
                    {worker.featured && (
                      <div style={{
                        position: 'absolute', top: 10, left: 10,
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: 'white', fontSize: 10, fontWeight: 900,
                        padding: '3px 8px', borderRadius: 14, letterSpacing: '0.4px',
                        display: 'flex', alignItems: 'center', gap: 4,
                        boxShadow: '0 2px 8px rgba(245,158,11,0.4)'
                      }}>
                        <Sparkles size={11} color="white" /> TOP PRO
                      </div>
                    )}

                    {/* Volume Audio Intro Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(
                          `${worker.full_name}, ${catName}. ` +
                          `Rating: ${Number(worker.avg_rating || 4.9).toFixed(1)} stars. ` +
                          `Completed ${worker.total_jobs || 2} verified jobs.`
                        );
                      }}
                      style={{ 
                        position: 'absolute', top: 10, right: 10, width: 32, height: 32, 
                        borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: '#0B3D66',
                        backdropFilter: 'blur(4px)'
                      }}>
                      <Volume2 size={15} />
                    </button>

                    {/* Name & Verification on image */}
                    <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.2px', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                          {worker.full_name}
                        </h3>
                        <span style={{ background: '#10B981', color: 'white', fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 10 }}>
                          ✓ KYC
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 600, marginTop: 2 }}>
                        {catName} Specialist
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '14px 14px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Ratings & Jobs Metas */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#FEF3C7', padding: '3px 7px', borderRadius: 10 }}>
                          <Star size={12} color="#D97706" fill="#D97706" style={{ marginRight: 3 }} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#92400E' }}>
                            {Number(worker.avg_rating || 4.9).toFixed(1)}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                          ({worker.total_jobs || 2} jobs)
                        </span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: 8 }}>
                        {worker.years_experience ? `${worker.years_experience}y exp` : '8y exp'}
                      </div>
                    </div>
                    
                    {/* Distance Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: '#F8FAFC', padding: '8px 10px', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 12, fontWeight: 600 }}>
                        <MapPin size={13} color="#0B3D66" />
                        {worker.distance_km ? `${Number(worker.distance_km).toFixed(1)} km away` : '0.6 km away'}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 8 }}>
                        Available
                      </div>
                    </div>

                    {/* 1-Tap Book Button CTA */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWorker?.(worker.worker_id, worker.category_id || '');
                      }}
                      style={{
                        width: '100%', background: 'linear-gradient(135deg, #041B30 0%, #0B3D66 100%)',
                        color: 'white', border: 'none', borderRadius: 12, padding: '9px',
                        fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: '0 4px 10px rgba(11,61,102,0.2)'
                      }}
                    >
                      Book Specialist ➔
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '20px', color: '#64748B', fontSize: 14, textAlign: 'center', width: '100%' }}>
                {t('noSpecialistsFound')}
              </div>
            )}
          </div>
          
        </div>
      </div>

      {showLangPicker && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(4,27,48,0.72)',
            backdropFilter: 'blur(4px)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowLangPicker(false); }}
        >
          <div style={{ background: 'white', borderRadius: 24, padding: 22, width: '100%', maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                🌐 Choose Language / भाषा चुनें
              </h3>
              <button
                onClick={() => setShowLangPicker(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as any);
                    setShowLangPicker(false);
                    showToast(`Language: ${lang.name} (${lang.native})`, 'success');
                  }}
                  style={{
                    background: currentLangObj.code === lang.code ? '#0B3D66' : '#F8FAFC',
                    color: currentLangObj.code === lang.code ? 'white' : '#0F172A',
                    border: `1.5px solid ${currentLangObj.code === lang.code ? '#0B3D66' : '#E2E8F0'}`,
                    borderRadius: 14, padding: '10px 12px', textAlign: 'left',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontSize: 12 }}>{lang.native}</div>
                    <div style={{ fontSize: 9, opacity: 0.65 }}>{lang.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shimmer-loading {
          background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @keyframes shimmer { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function ProviderSkeleton() {
  return (
    <div style={{
      background: 'white', borderRadius: 24, padding: 16,
      minWidth: 260, maxWidth: 300, flexShrink: 0,
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
    }}>
      <div className="shimmer-loading" style={{ width: '100%', height: 140, borderRadius: 16, marginBottom: 12 }} />
      <div className="shimmer-loading" style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 8 }} />
      <div className="shimmer-loading" style={{ width: '40%', height: 12, borderRadius: 4, marginBottom: 16 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="shimmer-loading" style={{ width: '30%', height: 14, borderRadius: 4 }} />
        <div className="shimmer-loading" style={{ width: '25%', height: 18, borderRadius: 4 }} />
      </div>
    </div>
  );
}
