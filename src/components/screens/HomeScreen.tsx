'use client';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SearchWithVoice } from '../SearchWithVoice';
import { WorkerProfile } from '../../lib/types';
import { findNearbyWorkers } from '../../lib/supabase';
import { detectIntent } from '../../lib/intentEngine';
import { Zap, Droplet, Hammer, Paintbrush, Wind, HardHat, Bug, Sparkles, Wrench, Scissors, Wrench as Tool, Volume2, RefreshCw, MapPin, X, VolumeX, Star } from 'lucide-react';

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

const CategoryIcon = ({ slug, size = 32 }: { slug: string, size?: number }) => {
  switch (slug.toLowerCase()) {
    case 'electrician': return <Zap size={size} color="#F59E0B" />;
    case 'plumber': return <Wrench size={size} color="#94A3B8" />;
    case 'carpenter': return <Hammer size={size} color="#94A3B8" />;
    case 'painter': return <Paintbrush size={size} color="#94A3B8" />;
    case 'house-cleaning': return <Sparkles size={size} color="#94A3B8" />;
    default: return <Tool size={size} color="#94A3B8" />;
  }
};

const PRESET_CHIPS = [
  { label: '⚡ Light repair',   query: 'Light is not working'          },
  { label: '🚰 Water leakage',  query: 'Water tap leaking'             },
  { label: '🧹 Cleaning maid',  query: 'House cleaning helper needed'  },
  { label: '🔧 Motor pump',     query: 'Borewell motor pump repair'    },
  { label: '🪚 Carpenter',      query: 'Door lock repair carpenter'    },
  { label: '🎨 Wall painting',  query: 'Wall paint color work'         },
];

function ProviderSkeleton() {
  return (
    <div style={{
      background: 'white', border: '1px solid #E2E8F0', borderRadius: 18,
      overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', minWidth: 240, flexShrink: 0
    }}>
      <div className="shimmer-loading" style={{ width: '100%', height: 140 }} />
      <div style={{ padding: '16px' }}>
        <div className="shimmer-loading" style={{ height: 18, borderRadius: 9, marginBottom: 8, width: '70%' }} />
        <div className="shimmer-loading" style={{ height: 13, borderRadius: 6, marginBottom: 16, width: '40%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="shimmer-loading" style={{ height: 13, borderRadius: 6, width: '30%' }} />
            <div className="shimmer-loading" style={{ height: 16, borderRadius: 8, width: '25%' }} />
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen({ 
  onSelectCategory,
  onSelectWorker
}: { 
  onSelectCategory: (categoryId: string) => void;
  onSelectWorker?: (workerId: string, categoryId: string) => void;
}) {
  const { categories, user, settings, setLanguage, toggleVoice, userLocation, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const currentLangObj = LANGUAGES.find(l => l.code === settings?.language) || LANGUAGES[0];
  
  // Specialists state
  const [nearbyWorkers, setNearbyWorkers] = useState<WorkerProfile[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

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

  const roundedLat = userLocation.lat ? Math.round(userLocation.lat * 100) / 100 : 0;
  const roundedLng = userLocation.lng ? Math.round(userLocation.lng * 100) / 100 : 0;
  const hasFetchedRef = React.useRef(false);

  const handleRefresh = async () => {
    if (!roundedLat || categories.length === 0) return;
    setIsLoadingWorkers(true);
    const promises = categories.slice(0,3).map(c => findNearbyWorkers(c.id, roundedLat, roundedLng));
    const results = await Promise.all(promises);
    const allWorkers = results.flat();
    const unique = Array.from(new Map(allWorkers.map(w => [w.worker_id, w])).values());
    setNearbyWorkers(unique);
    setIsLoadingWorkers(false);
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchWorkers() {
      if (!roundedLat) return;
      
      if (!hasFetchedRef.current) {
        setIsLoadingWorkers(true);
      }

      // Fetch all workers to show on home screen
      const promises = categories.slice(0,3).map(c => findNearbyWorkers(c.id, roundedLat, roundedLng));
      const results = await Promise.all(promises);
      const allWorkers = results.flat();
      const unique = Array.from(new Map(allWorkers.map(w => [w.worker_id, w])).values());
      
      if (isMounted) {
        setNearbyWorkers(unique);
        setIsLoadingWorkers(false);
        hasFetchedRef.current = true;
      }
    }
    if (categories.length > 0) fetchWorkers();
    return () => { isMounted = false; };
  }, [categories, roundedLat, roundedLng]);

  const filteredWorkers = React.useMemo(() => {
    if (!searchQuery.trim()) return nearbyWorkers;
    const intent = detectIntent(searchQuery);
    const categoryMatch = intent?.category.toLowerCase() || searchQuery.toLowerCase();
    
    return nearbyWorkers.filter(w => {
      const cat = categories.find(c => c.id === w.category_id)?.name_en?.toLowerCase() || '';
      return w.full_name?.toLowerCase().includes(categoryMatch) || cat.includes(categoryMatch);
    });
  }, [nearbyWorkers, searchQuery, categories]);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon';
  
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
              {user?.full_name?.split(' ')[0] || 'jj'} 👋
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
        
        {/* ─── All Services Section (Very Dark) ─── */}
        <div style={{ background: '#0F172A', paddingBottom: '24px' }}>
          {/* All Services Title */}
          <div style={{ padding: '24px 20px 16px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: 0 }}>
              All Services
            </h2>
          </div>

          {/* Categories Grid (Dark Theme) */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '0 20px' 
          }}>
            {categories.slice(0, 4).map(cat => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer',
                  background: 'transparent', border: 'none', padding: 0
                }}
              >
                <div style={{ 
                  width: '100%', aspectRatio: '1/1', borderRadius: 20, 
                  background: '#1E293B', border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  <CategoryIcon slug={cat.slug} />
                </div>
                <span style={{ 
                  fontSize: 12, fontWeight: 700, color: '#94A3B8', 
                  textAlign: 'center', lineHeight: 1.2 
                }}>
                  {cat.name_en === 'House Cleaning' ? 'Home Clean' : cat.name_en}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bottom Section (Light Gray) ─── */}
      <div style={{ background: '#F8FAFC', flex: 1, paddingBottom: 100 }}>
        
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '16px 20px', background: 'white', borderBottom: '1px solid #F1F5F9', scrollbarWidth: 'none' }}>
          {['All', '⭐ Top Rated', '📅 Available Now', '💰 Under ₹350'].map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              background: activeFilter === f ? '#0B3D66' : '#F1F5F9',
              color: activeFilter === f ? 'white' : '#334155',
              border: 'none', borderRadius: 20, padding: '8px 16px',
              fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0
            }}>
              {f}
            </button>
          ))}
        </div>

        {/* Specialists Near You */}
        <div style={{ padding: '24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                Specialists Near You
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 16 }}>📈</span> {filteredWorkers.length} verified specialist{filteredWorkers.length !== 1 ? 's' : ''} found
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
              <RefreshCw size={14} className={isLoadingWorkers ? 'animate-spin' : ''} /> {isLoadingWorkers ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Specialist Cards Horizontal Scroll */}
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 16 }}>
            {isLoadingWorkers ? (
              <>
                <ProviderSkeleton />
                <ProviderSkeleton />
                <ProviderSkeleton />
              </>
            ) : filteredWorkers.length > 0 ? filteredWorkers.map(worker => (
              <div 
                key={worker.worker_id} 
                onClick={() => onSelectWorker?.(worker.worker_id, worker.category_id)}
                style={{
                  background: 'white', borderRadius: 24, overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative',
                  minWidth: 260, maxWidth: 300, flexShrink: 0, cursor: 'pointer'
                }}
              >
                {/* Card Header Image Area */}
                <div style={{ 
                  height: 140, background: '#FEF3C7', position: 'relative',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {/* Dummy SVG Avatar */}
                  <svg viewBox="0 0 100 100" style={{ width: 140, height: 140, marginBottom: -20 }}>
                    <path d="M20,100 Q20,60 50,60 Q80,60 80,100" fill="#B45309" />
                    <circle cx="50" cy="45" r="25" fill="#D97706" />
                    <path d="M35,35 Q50,15 65,35" fill="none" stroke="#78350F" strokeWidth="4" />
                    <circle cx="40" cy="40" r="4" fill="white" />
                    <circle cx="60" cy="40" r="4" fill="white" />
                  </svg>

                  {/* Volume Icon Float */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const categoryName = categories.find(c => c.id === worker.category_id)?.name_en || 'Specialist';
                      speakText(
                        `${worker.full_name}, ${categoryName}. ` +
                        `Rate: ${worker.hourly_rate} rupees per hour. ` +
                        `Rating: ${worker.avg_rating?.toFixed(1) || '5.0'} stars. ` +
                        `Distance: ${worker.distance_km?.toFixed(1) || '0'} kilometres.`
                      );
                    }}
                    style={{ 
                      position: 'absolute', top: 12, right: 12, width: 32, height: 32, 
                      borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#0B3D66'
                    }}>
                    <Volume2 size={16} />
                  </button>

                  {/* TOP PRO badge */}
                  {worker.featured && (
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                      color: '#92400E', fontSize: 10, fontWeight: 900,
                      padding: '4px 10px', borderRadius: 20, letterSpacing: '0.4px',
                      display: 'flex', alignItems: 'center', gap: 4,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                      <Sparkles size={12} color="#92400E" /> TOP PRO
                    </div>
                  )}

                  {/* Presence indicator */}
                  <div style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: worker.is_online ? 'rgba(16,185,129,0.92)' : 'rgba(100,116,139,0.8)',
                    color: 'white', padding: '4px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 4,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(6px)'
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                    {worker.is_online ? 'Available' : 'Offline'}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#0F172A', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {worker.full_name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#FEF3C7', padding: '2px 8px', borderRadius: 12 }}>
                          <Star size={12} color="#D97706" fill="#D97706" style={{ marginRight: 4 }} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#92400E' }}>{worker.avg_rating?.toFixed(1) || '4.5'}</span>
                        </div>
                        <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                          ({worker.total_jobs || 0} jobs)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p style={{
                    fontSize: 13, color: '#64748B', margin: '0 0 16px', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {worker.description || `${categories.find(c => c.id === worker.category_id)?.name_en || 'Service'} Specialist`}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 13, fontWeight: 600 }}>
                      <MapPin size={14} />
                      {worker.distance_km ? `${worker.distance_km.toFixed(1)} km` : 'Near you'}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                      ₹{worker.hourly_rate || 350}<span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>/hr</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '20px', color: '#64748B', fontSize: 14, textAlign: 'center', width: '100%' }}>
                No specialists found nearby.
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
