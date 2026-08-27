import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useLocation } from '../../context/LocationContext';
import { LanguageCode } from '../../lib/types';
import { 
  User, Globe, Volume2, VolumeX, LogOut, ChevronRight, Shield, HelpCircle, 
  Bell, ShieldCheck, MapPin, Home, Briefcase, Heart, Plus, Edit3, 
  Check, RefreshCw, Navigation, Building2, Trash2, Crosshair
} from 'lucide-react';
import PrivacyPolicyModal from '../PrivacyPolicyModal';

export interface SavedAddress {
  id: string;
  type: 'home' | 'work' | 'parents' | 'other';
  title: string;
  address: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

const DEFAULT_PRESETS: SavedAddress[] = [
  {
    id: 'addr_home',
    type: 'home',
    title: 'Home',
    address: 'Flat / House address not set',
    landmark: '',
  },
  {
    id: 'addr_work',
    type: 'work',
    title: 'Work',
    address: 'Office / Workplace address not set',
    landmark: '',
  },
  {
    id: 'addr_parents',
    type: 'parents',
    title: "Parents' House",
    address: 'Address not set',
    landmark: '',
  }
];

const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English',   native: 'English'  },
  { code: 'hi', label: 'Hindi',     native: 'हिंदी'     },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ'     },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు'    },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்'     },
  { code: 'mr', label: 'Marathi',   native: 'मराठी'     },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা'     },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી'   },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം'    },
  { code: 'pa', label: 'Punjabi',   native: 'ਪੰਜਾਬੀ'    },
];

export default function ProfileScreen() {
  const { user, logoutUser, deleteAccount, settings, setLanguage, toggleSounds, toggleVoice, bookings, showToast } = useApp();
  const { userLocation, locationStatus, requestLocation } = useLocation();

  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(DEFAULT_PRESETS);
  const [activeAddressId, setActiveAddressId] = useState<string>('live_gps');
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);
  const [liveResolvedAddress, setLiveResolvedAddress] = useState<string>('');

  // Draft form for editing address
  const [draftTitle, setDraftTitle] = useState('');
  const [draftAddress, setDraftAddress] = useState('');
  const [draftLandmark, setDraftLandmark] = useState('');
  const [draftType, setDraftType] = useState<'home' | 'work' | 'parents' | 'other'>('home');

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const totalSpent = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const selectedLang = LANGUAGES.find(l => l.code === settings.language) ?? LANGUAGES[0];

  // Load saved addresses and active selection from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nt_saved_addresses');
      if (stored) {
        setSavedAddresses(JSON.parse(stored));
      }
      const activeId = localStorage.getItem('nt_active_address_id');
      if (activeId) setActiveAddressId(activeId);
    } catch {}
  }, []);

  // Reverse geocode live GPS location
  useEffect(() => {
    if (!userLocation) return;
    let isCancelled = false;
    const fetchAddressName = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&zoom=18&addressdetails=1`, {
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (isCancelled) return;
          const addr = data.address;
          const parts = [
            addr?.suburb || addr?.neighbourhood || addr?.residential || addr?.road,
            addr?.city || addr?.town || addr?.village || addr?.county,
            addr?.state
          ].filter(Boolean);
          if (parts.length > 0) {
            setLiveResolvedAddress(parts.join(', '));
            return;
          }
          if (data.display_name) {
            setLiveResolvedAddress(data.display_name.split(',').slice(0, 3).join(', '));
            return;
          }
        }
      } catch {}
      if (!isCancelled) {
        setLiveResolvedAddress(`${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E`);
      }
    };
    fetchAddressName();
    return () => { isCancelled = true; };
  }, [userLocation]);

  const handleRefreshGps = async () => {
    setIsRefreshingGps(true);
    try {
      const coords = await requestLocation();
      if (coords) {
        showToast('📍 Live GPS location refreshed!', 'success');
      } else {
        showToast('Could not fetch GPS location. Check permissions.', 'info');
      }
    } catch {
      showToast('Error refreshing GPS.', 'error');
    } finally {
      setIsRefreshingGps(false);
    }
  };

  const handleSelectActiveAddress = (addrId: string, title: string) => {
    setActiveAddressId(addrId);
    try {
      localStorage.setItem('nt_active_address_id', addrId);
    } catch {}
    showToast(`Active address set to ${title} 📍`, 'success');
  };

  const handleOpenEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setDraftTitle(addr.title);
    setDraftAddress(addr.address === 'Address not set' || addr.address.includes('not set') ? '' : addr.address);
    setDraftLandmark(addr.landmark || '');
    setDraftType(addr.type);
  };

  const handleSaveAddress = () => {
    if (!editingAddress) return;
    const updated: SavedAddress = {
      ...editingAddress,
      title: draftTitle.trim() || (draftType === 'home' ? 'Home' : draftType === 'work' ? 'Work' : draftType === 'parents' ? "Parents' House" : 'Other'),
      address: draftAddress.trim() || 'Address not set',
      landmark: draftLandmark.trim(),
      type: draftType,
      lat: editingAddress.lat || userLocation?.lat,
      lng: editingAddress.lng || userLocation?.lng,
    };

    const exists = savedAddresses.some(a => a.id === updated.id);
    const newAddresses = exists 
      ? savedAddresses.map(a => a.id === updated.id ? updated : a)
      : [...savedAddresses, updated];

    setSavedAddresses(newAddresses);
    try {
      localStorage.setItem('nt_saved_addresses', JSON.stringify(newAddresses));
    } catch {}

    setEditingAddress(null);
    showToast(`Address "${updated.title}" saved! ✅`, 'success');
  };

  const handleAutoFillFromGps = () => {
    if (liveResolvedAddress) {
      setDraftAddress(prev => prev ? `${prev}, ${liveResolvedAddress}` : liveResolvedAddress);
      showToast('Filled address from live GPS 📍', 'info');
    } else if (userLocation) {
      setDraftAddress(`${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`);
      showToast('Filled GPS coordinates', 'info');
    } else {
      handleRefreshGps();
    }
  };

  const getAddressIcon = (type: SavedAddress['type'], size = 18) => {
    switch (type) {
      case 'home': return <Home size={size} color="#0B3D66" />;
      case 'work': return <Briefcase size={size} color="#0B3D66" />;
      case 'parents': return <Heart size={size} color="#E11D48" />;
      default: return <MapPin size={size} color="#0B3D66" />;
    }
  };

  function SettingRow({ icon, label, right, onClick }: { icon: React.ReactNode; label: string; right: React.ReactNode; onClick?: () => void }) {
    return (
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: '14px 0', background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{label}</span>
        <div style={{ flexShrink: 0 }}>{right}</div>
      </button>
    );
  }

  return (
    <div style={{ background: '#F0F7FF', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '28px 20px 56px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.3px' }}>
          My Profile
        </h2>
      </div>

      {/* Avatar + Name card */}
      <div style={{ margin: '0 16px', marginTop: -40, position: 'relative', zIndex: 2 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, flexShrink: 0,
            background: 'linear-gradient(135deg, #0B3D66, #041B30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 900, color: 'white',
            border: '3px solid rgba(11,61,102,0.1)',
          }}>
            {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 2, letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name ?? 'Guest'}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              +91 {user?.phone}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, background: '#F0F7FF', borderRadius: 20, padding: '2px 8px' }}>
              <Shield size={10} color="#0B3D66" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0B3D66' }}>
                {user?.role === 'owner' ? 'Owner Account' : 'Verified Customer'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '16px 16px 0' }}>
        {[
          { label: 'Bookings', value: totalBookings, emoji: '📋' },
          { label: 'Completed', value: completedBookings, emoji: '✅' },
          { label: 'Total Spent', value: `₹${totalSpent}`, emoji: '💰' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14, padding: '14px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.emoji}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{stat.value}</div>
            <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Live Location & Saved Addresses */}
      <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 20, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
            Live GPS & Saved Addresses
          </p>
          <button
            onClick={() => handleOpenEdit({
              id: `addr_${Date.now()}`,
              type: 'other',
              title: '',
              address: '',
              landmark: '',
            })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0F7FF', border: 'none',
              padding: '4px 10px', borderRadius: 12, color: '#0B3D66', fontSize: 11, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <Plus size={13} />
            <span>Add New</span>
          </button>
        </div>

        {/* Live GPS Active Card */}
        <div 
          onClick={() => handleSelectActiveAddress('live_gps', 'Current Live GPS')}
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: activeAddressId === 'live_gps' ? '#ECFDF5' : '#F8FAFC',
            border: `1.5px solid ${activeAddressId === 'live_gps' ? '#10B981' : '#E2E8F0'}`,
            marginBottom: 10,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Current GPS Location</span>
              {activeAddressId === 'live_gps' && (
                <span style={{ fontSize: 9, fontWeight: 800, background: '#10B981', color: 'white', padding: '1px 6px', borderRadius: 10 }}>
                  ACTIVE
                </span>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleRefreshGps(); }}
              title="Refresh GPS"
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}
            >
              <RefreshCw size={13} style={{ animation: isRefreshingGps ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#475569', fontWeight: 500, lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {liveResolvedAddress || (userLocation ? `${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E` : 'Tap to detect location')}
          </div>
        </div>

        {/* Saved Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {savedAddresses.map((addr) => {
            const isActive = activeAddressId === addr.id;
            const isNotConfigured = !addr.address || addr.address.includes('not set');

            return (
              <div
                key={addr.id}
                onClick={() => {
                  if (isNotConfigured) {
                    handleOpenEdit(addr);
                  } else {
                    handleSelectActiveAddress(addr.id, addr.title);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 14,
                  background: isActive ? '#F0F7FF' : 'white',
                  border: `1.5px solid ${isActive ? '#0B3D66' : '#F1F5F9'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: isActive ? 'rgba(11,61,102,0.1)' : '#F8FAFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getAddressIcon(addr.type, 18)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{addr.title}</span>
                    {isActive && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: '#0B3D66', color: 'white', padding: '1px 6px', borderRadius: 10 }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 11, color: isNotConfigured ? '#94A3B8' : '#64748B',
                    fontWeight: isNotConfigured ? 600 : 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {isNotConfigured ? '+ Tap to set address' : addr.address}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(addr); }}
                  title="Edit Address"
                  style={{
                    background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                    padding: '6px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center'
                  }}
                >
                  <Edit3 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings */}
      <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 20, padding: '4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 0 4px' }}>
          Preferences
        </p>

        <div style={{ borderBottom: '1px solid #F1F5F9' }}>
          <SettingRow
            icon={<Globe size={18} color="#0B3D66" />}
            label="Language"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0B3D66' }}>{selectedLang.native}</span>
                <ChevronRight size={14} color="#94A3B8" />
              </div>
            }
            onClick={() => setShowLangPicker(true)}
          />
        </div>

        <div style={{ borderBottom: '1px solid #F1F5F9' }}>
          <SettingRow
            icon={settings.sounds ? <Volume2 size={18} color="#0B3D66" /> : <VolumeX size={18} color="#94A3B8" />}
            label="Sound Effects"
            right={
              <div
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: settings.sounds ? '#0B3D66' : '#E2E8F0',
                  position: 'relative', transition: 'background 0.2s ease',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, left: settings.sounds ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s ease',
                }} />
              </div>
            }
            onClick={toggleSounds}
          />
        </div>

        <SettingRow
          icon={<Bell size={18} color={settings.voice ? '#0B3D66' : '#94A3B8'} />}
          label="Voice Guidance"
          right={
            <div
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                background: settings.voice ? '#0B3D66' : '#E2E8F0',
                position: 'relative', transition: 'background 0.2s ease',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: settings.voice ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s ease',
              }} />
            </div>
          }
          onClick={toggleVoice}
        />
      </div>



      {/* Help & Policies */}
      <div style={{ margin: '12px 16px 0', background: 'white', borderRadius: 20, padding: '4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 0 4px' }}>
          Support & Trust
        </p>
        <SettingRow
          icon={<ShieldCheck size={18} color="#0B3D66" />}
          label="Privacy Policy & Data Rights"
          right={<ChevronRight size={14} color="#94A3B8" />}
          onClick={() => setShowPrivacyModal(true)}
        />
        <div style={{ borderBottom: '1px solid #F1F5F9' }} />
        <SettingRow
          icon={<HelpCircle size={18} color="#0B3D66" />}
          label="Help & FAQ"
          right={<ChevronRight size={14} color="#94A3B8" />}
          onClick={() => showToast('Help center coming soon!', 'info')}
        />
      </div>

      {/* Logout & Delete */}
      <div style={{ margin: '12px 16px 0', background: 'white', borderRadius: 20, padding: '4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <SettingRow
          icon={<LogOut size={18} color="#EF4444" />}
          label="Log Out"
          right={<ChevronRight size={14} color="#94A3B8" />}
          onClick={() => setShowLogoutConfirm(true)}
        />
        <div style={{ borderBottom: '1px solid #F1F5F9' }} />
        <SettingRow
          icon={<Shield size={18} color="#EF4444" />}
          label="Delete Account"
          right={<ChevronRight size={14} color="#94A3B8" />}
          onClick={() => setShowDeleteConfirm(true)}
        />
      </div>

      <p 
        onClick={() => setShowPrivacyModal(true)}
        style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '24px 0 100px', cursor: 'pointer', textDecoration: 'underline' }}
      >
        Hands of ShramiXs v2.0 · DPDP Act 2023 compliant
      </p>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />

      {/* Language Picker Modal */}
      {showLangPicker && (
        <div 
          className="modal-backdrop" 
          onClick={() => setShowLangPicker(false)}
          onTouchEnd={e => { if (e.target === e.currentTarget) setShowLangPicker(false); }}
        >
          <div 
            className="modal-sheet" 
            onClick={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
          >
            <div className="modal-handle" />
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 16 }}>
              Choose Language
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {LANGUAGES.map(lang => (
                <button
                  type="button"
                  key={lang.code}
                  onClick={(e) => { 
                    e.stopPropagation();
                    setLanguage(lang.code); 
                    setShowLangPicker(false); 
                    showToast(`Language changed to ${lang.label}`); 
                  }}
                  style={{
                    padding: '14px 16px', borderRadius: 14, textAlign: 'left',
                    background: settings.language === lang.code ? '#0B3D66' : '#F8FAFC',
                    border: `2px solid ${settings.language === lang.code ? '#0B3D66' : '#E2E8F0'}`,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, color: settings.language === lang.code ? 'white' : '#0F172A' }}>
                    {lang.native}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: settings.language === lang.code ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>
                    {lang.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Log Out?</h3>
              <p style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                You'll be signed out of your account.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); logoutUser(); }}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#EF4444', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Delete Account?</h3>
              <p style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                This action is permanent and cannot be undone. All your data will be erased.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => { 
                  setShowDeleteConfirm(false); 
                  const success = await deleteAccount(); 
                  if (!success) showToast('Failed to delete account.', 'error');
                }}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#EF4444', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {editingAddress && (
        <div className="modal-backdrop" onClick={() => setEditingAddress(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-handle" />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                {editingAddress.title ? `Edit ${editingAddress.title}` : 'Add New Address'}
              </h3>
              {savedAddresses.length > 3 && editingAddress.type === 'other' && (
                <button
                  onClick={() => {
                    const newAddresses = savedAddresses.filter(a => a.id !== editingAddress.id);
                    setSavedAddresses(newAddresses);
                    try { localStorage.setItem('nt_saved_addresses', JSON.stringify(newAddresses)); } catch {}
                    setEditingAddress(null);
                    showToast('Address deleted.', 'info');
                  }}
                  style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {/* Address Type Selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Address Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { type: 'home', label: 'Home', icon: <Home size={15} /> },
                  { type: 'work', label: 'Work', icon: <Briefcase size={15} /> },
                  { type: 'parents', label: 'Parents', icon: <Heart size={15} /> },
                  { type: 'other', label: 'Other', icon: <MapPin size={15} /> },
                ].map(item => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setDraftType(item.type as any);
                      if (!draftTitle || draftTitle === 'Home' || draftTitle === 'Work' || draftTitle === "Parents' House") {
                        setDraftTitle(item.label);
                      }
                    }}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 12,
                      border: `1.5px solid ${draftType === item.type ? '#0B3D66' : '#E2E8F0'}`,
                      background: draftType === item.type ? '#F0F7FF' : 'white',
                      color: draftType === item.type ? '#0B3D66' : '#64748B',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Label / Name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Address Name / Label
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                placeholder="e.g. Home, Office 3rd Floor"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #E2E8F0',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Flat / House No / Street Address */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Full Address & Street
                </label>
                <button
                  type="button"
                  onClick={handleAutoFillFromGps}
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #10B981',
                    borderRadius: 8,
                    padding: '3px 8px',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#059669',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <Crosshair size={11} />
                  <span>Use Live GPS</span>
                </button>
              </div>
              <textarea
                value={draftAddress}
                onChange={e => setDraftAddress(e.target.value)}
                rows={3}
                placeholder="e.g. Flat 304, Green Palms Apt, 5th Cross, Gandhi Nagar"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #E2E8F0',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Landmark (Optional) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={draftLandmark}
                onChange={e => setDraftLandmark(e.target.value)}
                placeholder="e.g. Behind City Hospital, Near Water Tank"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #E2E8F0',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setEditingAddress(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 14,
                  border: '1.5px solid #E2E8F0',
                  background: 'white',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #0B3D66, #041B30)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(11,61,102,0.25)'
                }}
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
