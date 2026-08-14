'use client';
import React, { useState, useEffect } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { ServiceCategory } from '../../lib/types';
import { fetchServiceCategories } from '../../lib/supabase';
import { 
  Star, Volume2, Globe, Shield, LogOut, Trash2, Edit3, Check, X, 
  Zap, Droplet, Hammer, Paintbrush, Wind, HardHat, Bug, Sparkles, 
  Wrench, Scissors, MapPin, IndianRupee, Phone, CheckCircle2, 
  ShieldCheck, Award, ChevronRight, QrCode, AlertTriangle
} from 'lucide-react';

const CategoryIcon = ({ slug, size = 20 }: { slug: string, size?: number }) => {
  switch (slug.toLowerCase()) {
    case 'electrician': return <Zap size={size} color="#F59E0B" />;
    case 'plumber': return <Droplet size={size} color="#0284C7" />;
    case 'carpenter': return <Hammer size={size} color="#D97706" />;
    case 'painter': return <Paintbrush size={size} color="#8B5CF6" />;
    case 'ac-appliance-repair': return <Wind size={size} color="#06B6D4" />;
    case 'mason-construction': return <HardHat size={size} color="#EAB308" />;
    case 'pest-control': return <Bug size={size} color="#EC4899" />;
    case 'house-cleaning': return <Sparkles size={size} color="#10B981" />;
    case 'mechanic': return <Wrench size={size} color="#64748B" />;
    case 'home-salon': return <Scissors size={size} color="#F43F5E" />;
    default: return <Wrench size={size} color="#059669" />;
  }
};

const CATEGORY_RATES: Record<string, number> = {
  electrician: 350,
  plumber: 350,
  carpenter: 400,
  painter: 600,
  'house-cleaning': 500,
  'pest-control': 750,
  'ac-appliance-repair': 450,
  mechanic: 400,
  'home-salon': 500,
  'mason-construction': 550,
};

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

export default function WorkerProfileScreen() {
  const { 
    worker, logoutWorker, deleteAccount, updateProfileData, 
    settings, setLanguage, toggleSound, completedBookings, 
    showToast, isOnline 
  } = useWorker();
  
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftRadius, setDraftRadius] = useState(5);
  const [draftUpi, setDraftUpi] = useState('jeevan@upi');
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [draftCategories, setDraftCategories] = useState<Set<string>>(new Set());
  const [availableCategories, setAvailableCategories] = useState<ServiceCategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServiceCategories().then(data => setAvailableCategories(data));
  }, []);

  useEffect(() => {
    if (worker && !isEditing) {
      setDraftName(worker.full_name || 'Specialist');
      setDraftRadius(worker.service_radius_km || 5);
      setDraftCategories(new Set((worker.categories || []).map(c => c.id)));
    }
  }, [worker, isEditing]);

  if (!worker) return null;

  const totalJobsCount = Math.max(worker.total_jobs || 0, completedBookings.length);

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to permanently delete your worker partner account? This action cannot be undone.')) {
      await deleteAccount();
    }
  };

  const handleSave = async () => {
    if (!draftName.trim()) {
      showToast('Please enter your name.', 'error');
      return;
    }
    if (draftCategories.size === 0) {
      showToast('Please select at least 1 skill category.', 'error');
      return;
    }
    setSaving(true);
    const success = await updateProfileData(draftName.trim(), Array.from(draftCategories));
    if (success) {
      setIsEditing(false);
      showToast('Profile updated successfully! ✅', 'success');
    } else {
      showToast('Failed to update profile.', 'error');
    }
    setSaving(false);
  };

  const toggleDraftCategory = (catId: string) => {
    setDraftCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      
      {/* ── Premium Gradient Hero Header ── */}
      <div style={{ 
        background: 'linear-gradient(160deg, #064E3B 0%, #065F46 60%, #059669 100%)', 
        padding: '24px 20px 32px',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        boxShadow: '0 10px 25px rgba(6,78,59,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          
          {/* Avatar with Verified Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ 
              width: 72, height: 72, borderRadius: 22, 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))', 
              backdropFilter: 'blur(10px)',
              border: '2.5px solid rgba(255,255,255,0.4)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 30, fontWeight: 900, color: 'white',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
            }}>
              {draftName[0]?.toUpperCase() || 'J'}
            </div>
            <div style={{ 
              position: 'absolute', bottom: -4, right: -4, 
              width: 22, height: 22, borderRadius: '50%', 
              background: isOnline ? '#10B981' : '#94A3B8', 
              border: '3px solid #064E3B', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }} />
          </div>

          {/* Profile Name & Phone */}
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input 
                type="text" 
                value={draftName} 
                onChange={e => setDraftName(e.target.value)} 
                placeholder="Full Name"
                style={{ 
                  width: '100%', background: 'rgba(255,255,255,0.2)', 
                  border: '1.5px solid rgba(255,255,255,0.6)', color: 'white', 
                  borderRadius: 10, padding: '6px 10px', fontSize: 18, 
                  fontWeight: 900, marginBottom: 4, outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                  {worker.full_name}
                </h2>
                <button 
                  onClick={() => setIsEditing(true)} 
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Edit3 size={13} color="white" />
                </button>
              </div>
            )}
            
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '2px 0 8px', fontWeight: 600 }}>
              +91 {worker.phone || '7975182162'}
            </p>

            {/* Badges Bar */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '3px 8px' }}>
                <Star size={12} color="#FCD34D" fill="#FCD34D" />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{worker.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '3px 8px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{totalJobsCount} jobs done</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 12, padding: '3px 8px' }}>
                <ShieldCheck size={12} color="#6EE7B7" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#6EE7B7' }}>Verified Pro</span>
              </div>
            </div>

          </div>
        </div>

        {/* Quick Edit Save/Cancel Bar */}
        {isEditing && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <button 
              onClick={() => setIsEditing(false)} 
              style={{ padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              style={{ padding: '10px', borderRadius: 12, border: 'none', background: 'white', color: '#065F46', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              {saving ? 'Saving…' : <><Check size={14} color="#065F46" /> Save Changes</>}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '18px 16px' }}>

        {/* ── My Active Services Section ── */}
        <div style={{ 
          background: 'white', borderRadius: 22, padding: '18px', marginBottom: 16, 
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                My Skills & Services
              </h3>
              <p style={{ fontSize: 11, color: '#64748B', fontWeight: 500, margin: '2px 0 0' }}>
                {isEditing ? 'Tap to select or remove categories' : 'Active job categories you receive bookings for'}
              </p>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 4, 
                  background: '#ECFDF5', border: '1px solid #A7F3D0', 
                  borderRadius: 10, padding: '6px 12px', cursor: 'pointer' 
                }}
              >
                <Edit3 size={12} color="#059669" />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>Manage</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!isEditing ? (
              (worker.categories || []).map(cat => {
                const basePrice = CATEGORY_RATES[cat.slug] || 350;
                return (
                  <div 
                    key={cat.id} 
                    style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      padding: '12px 14px', borderRadius: 14, background: '#F8FAFC', 
                      border: '1px solid #E2E8F0' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ 
                        width: 38, height: 38, borderRadius: 10, 
                        background: '#FFFFFF', border: '1px solid #E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}>
                        {cat.slug && <CategoryIcon slug={cat.slug} size={20} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{cat.name_en}</div>
                        <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>₹{basePrice} base rate · ₹{Math.round(basePrice * 0.92)} net</div>
                      </div>
                    </div>
                    <div style={{ background: '#ECFDF5', borderRadius: 20, padding: '3px 8px', border: '1px solid #A7F3D0' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#059669' }}>Active ✓</span>
                    </div>
                  </div>
                );
              })
            ) : (
              availableCategories.map(cat => {
                const selected = draftCategories.has(cat.id);
                const basePrice = CATEGORY_RATES[cat.slug] || 350;
                return (
                  <button 
                    key={cat.id} 
                    onClick={() => toggleDraftCategory(cat.id)} 
                    style={{ 
                      width: '100%', textAlign: 'left', 
                      background: selected ? '#ECFDF5' : 'white', 
                      border: `2px solid ${selected ? '#059669' : '#E2E8F0'}`, 
                      borderRadius: 16, padding: '12px 14px', 
                      display: 'flex', alignItems: 'center', gap: 12, 
                      cursor: 'pointer', transition: 'all 0.2s ease' 
                    }}
                  >
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 12, 
                      background: selected ? '#D1FAE5' : '#F1F5F9', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      {cat.slug && <CategoryIcon slug={cat.slug} size={22} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: selected ? '#065F46' : '#334155' }}>
                        {cat.name_en}
                      </div>
                      <div style={{ fontSize: 11, color: selected ? '#059669' : '#94A3B8', fontWeight: 600 }}>
                        ₹{basePrice} base rate
                      </div>
                    </div>
                    <div style={{ 
                      width: 26, height: 26, borderRadius: '50%', 
                      background: selected ? '#059669' : '#F1F5F9', 
                      border: `1.5px solid ${selected ? '#059669' : '#CBD5E1'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                    }}>
                      {selected ? <Check size={14} color="white" strokeWidth={3} /> : <span style={{ fontSize: 14, color: '#94A3B8' }}>+</span>}
                    </div>
                  </button>
                );
              })
            )}

            {!isEditing && (!worker.categories || worker.categories.length === 0) && (
              <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '10px 0' }}>
                No services added. Tap Manage to add services.
              </p>
            )}
          </div>
        </div>

        {/* ── Working Area & Service Radius ── */}
        <div style={{ 
          background: 'white', borderRadius: 22, padding: '18px', marginBottom: 16, 
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} color="#0284C7" />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', margin: 0 }}>Service Location</h3>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Panjimogaru, Mangaluru</span>
              </div>
            </div>
            <div style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', borderRadius: 12, padding: '4px 10px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0284C7' }}>{draftRadius} km radius</span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 10px', fontWeight: 500 }}>
            You will only receive customer booking offers within this service distance.
          </p>
          <input 
            type="range" 
            min="2" 
            max="15" 
            step="1" 
            value={draftRadius} 
            onChange={(e) => {
              setDraftRadius(Number(e.target.value));
              showToast(`Radius set to ${e.target.value} km`);
            }} 
            style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>
            <span>2 km (Local)</span>
            <span>8 km</span>
            <span>15 km (City-wide)</span>
          </div>
        </div>

        {/* ── Direct Payout UPI Card ── */}
        <div style={{ 
          background: 'white', borderRadius: 22, padding: '18px', marginBottom: 16, 
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IndianRupee size={18} color="#059669" />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', margin: 0 }}>Instant UPI Payouts</h3>
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>Direct daily bank settlement</span>
              </div>
            </div>
            <button 
              onClick={() => setIsEditingUpi(!isEditingUpi)}
              style={{ background: 'none', border: 'none', color: '#059669', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              {isEditingUpi ? 'Done' : 'Edit UPI'}
            </button>
          </div>

          {isEditingUpi ? (
            <div style={{ marginTop: 10 }}>
              <input 
                type="text" 
                value={draftUpi} 
                onChange={(e) => setDraftUpi(e.target.value)} 
                placeholder="e.g. mobile@upi"
                style={{ 
                  width: '100%', padding: '10px 12px', borderRadius: 12, 
                  border: '1.5px solid #059669', fontSize: 13, fontWeight: 700, 
                  boxSizing: 'border-box', outline: 'none', marginBottom: 8 
                }}
              />
              <button 
                onClick={() => {
                  setIsEditingUpi(false);
                  showToast('Payout UPI ID saved! 💰');
                }} 
                style={{ width: '100%', padding: '10px', background: '#059669', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
              >
                Save Payout Account
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px 12px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{draftUpi}</span>
              <span style={{ fontSize: 11, color: '#10B981', fontWeight: 800 }}>● Active</span>
            </div>
          )}
        </div>

        {/* ── App Preferences & Language ── */}
        <div style={{ 
          background: 'white', borderRadius: 22, overflow: 'hidden', marginBottom: 16, 
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' 
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Preferences
            </h3>
          </div>
          
          <button 
            onClick={toggleSound} 
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', 
              padding: '14px 18px', background: 'none', border: 'none', 
              cursor: 'pointer', borderBottom: '1px solid #F1F5F9' 
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
              <Volume2 size={16} color="#059669" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', flex: 1, textAlign: 'left' }}>Sound & Voice Alerts</span>
            <span style={{ fontSize: 12, color: settings.sounds ? '#059669' : '#94A3B8', fontWeight: 800 }}>
              {settings.sounds ? 'Enabled ✓' : 'Muted'}
            </span>
          </button>

          {/* Language Switcher */}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Globe size={16} color="#059669" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Preferred Language</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LANGUAGES.map(lang => (
                <button 
                  key={lang.code} 
                  onClick={() => {
                    setLanguage(lang.code as any);
                    showToast(`Language set to ${lang.native}`);
                  }}
                  style={{ 
                    padding: '7px 14px', borderRadius: 20, 
                    border: `1.5px solid ${settings.language === lang.code ? '#059669' : '#E2E8F0'}`, 
                    background: settings.language === lang.code ? '#ECFDF5' : 'white', 
                    fontSize: 12, fontWeight: settings.language === lang.code ? 800 : 600, 
                    color: settings.language === lang.code ? '#059669' : '#64748B', 
                    cursor: 'pointer', transition: 'all 0.15s ease' 
                  }}
                >
                  {lang.native}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Partner Helpline & Trust Guarantee ── */}
        <div style={{ 
          background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', 
          borderRadius: 20, padding: '16px', border: '1.5px solid #A7F3D0', marginBottom: 18 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ShieldCheck size={18} color="#065F46" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#065F46' }}>Worker Partner Protection</span>
          </div>
          <p style={{ fontSize: 11, color: '#047857', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
            24/7 emergency assistance, insurance coverage up to ₹50,000 on active jobs, and verified neighborhood safety.
          </p>
        </div>

        {/* ── Logout & Account Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button 
            onClick={() => { if (confirm('Are you sure you want to log out of your worker account?')) logoutWorker(); }}
            style={{ 
              width: '100%', padding: '15px', borderRadius: 16, 
              border: '1.5px solid #E2E8F0', background: 'white', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' 
            }}
          >
            <LogOut size={16} color="#475569" />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#334155' }}>Logout from Device</span>
          </button>

          <button 
            onClick={handleDeleteAccount}
            style={{ 
              width: '100%', padding: '14px', borderRadius: 16, 
              border: '1.5px solid #FECACA', background: '#FEF2F2', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: 8 
            }}
          >
            <Trash2 size={16} color="#EF4444" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>Delete Worker Account</span>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 24 }}>
          Neighborly Trust Partner Portal v2.0 · DPDP Act 2023 Compliant
        </p>

      </div>
    </div>
  );
}
