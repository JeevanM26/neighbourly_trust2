'use client';
import React, { useState, useEffect } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { ServiceCategory } from '../../lib/types';
import { fetchServiceCategories } from '../../lib/supabase';
import { Star, Volume2, Globe, Shield, LogOut, Trash2, Edit3, Check, X, Zap, Droplet, Hammer, Paintbrush, Wind, HardHat, Bug, Sparkles, Wrench, Scissors } from 'lucide-react';

const CategoryIcon = ({ slug, size = 24 }: { slug: string, size?: number }) => {
  switch (slug.toLowerCase()) {
    case 'electrician': return <Zap size={size} />;
    case 'plumber': return <Droplet size={size} />;
    case 'carpenter': return <Hammer size={size} />;
    case 'painter': return <Paintbrush size={size} />;
    case 'ac-appliance-repair': return <Wind size={size} />;
    case 'mason-construction': return <HardHat size={size} />;
    case 'pest-control': return <Bug size={size} />;
    case 'house-cleaning': return <Sparkles size={size} />;
    case 'mechanic': return <Wrench size={size} />;
    case 'home-salon': return <Scissors size={size} />;
    default: return <Wrench size={size} />;
  }
};

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

export default function WorkerProfileScreen() {
  const { worker, logoutWorker, deleteAccount, updateProfileData, settings, setLanguage, toggleSound } = useWorker();
  
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftCategories, setDraftCategories] = useState<Set<string>>(new Set());
  const [availableCategories, setAvailableCategories] = useState<ServiceCategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServiceCategories().then(data => setAvailableCategories(data));
  }, []);

  useEffect(() => {
    if (worker && !isEditing) {
      setDraftName(worker.full_name);
      setDraftCategories(new Set((worker.categories || []).map(c => c.id)));
    }
  }, [worker, isEditing]);

  if (!worker) return null;

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      await deleteAccount();
    }
  };

  const handleSave = async () => {
    if (!draftName.trim()) return;
    if (draftCategories.size === 0) return;
    setSaving(true);
    const success = await updateProfileData(draftName.trim(), Array.from(draftCategories));
    if (success) {
      setIsEditing(false);
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
    <div style={{ background: '#F0FDF4', height: '100%', overflowY: 'auto', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '20px 20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'white', flexShrink: 0 }}>
            {draftName[0]?.toUpperCase() || 'W'}
          </div>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input 
                type="text" 
                value={draftName} 
                onChange={e => setDraftName(e.target.value)} 
                placeholder="Full Name"
                style={{ width: '100%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', color: 'white', borderRadius: 8, padding: '4px 8px', fontSize: 20, fontWeight: 900, marginBottom: 4, outline: 'none' }}
              />
            ) : (
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 3px', letterSpacing: '-0.3px' }}>{worker.full_name}</h2>
            )}
            
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '0 0 6px', fontWeight: 500 }}>+91 {worker.phone}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 9px' }}>
                <Star size={12} color="#FCD34D" fill="#FCD34D" />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{worker.rating.toFixed(1)}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 9px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{worker.total_jobs} jobs</span>
              </div>
              {worker.is_verified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 9px' }}>
                  <Shield size={12} color="#FCD34D" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Categories Section */}
        <div style={{ background: 'white', borderRadius: 20, padding: '18px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #D1FAE5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>My Services</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, margin: 0 }}>Active categories you receive jobs for</p>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '7px 12px', cursor: 'pointer' }}>
                <Edit3 size={13} color="#059669" /><span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Edit</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setIsEditing(false)} style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', fontSize: 12, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '7px 12px', border: 'none', borderRadius: 10, background: '#059669', fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {saving ? 'Saving…' : <><Check size={12} /> Save</>}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!isEditing ? (
              (worker.categories || []).map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cat.slug && <CategoryIcon slug={cat.slug} size={20} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{cat.name_en}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              availableCategories.map(cat => {
                const selected = draftCategories.has(cat.id);
                return (
                  <button key={cat.id} onClick={() => toggleDraftCategory(cat.id)} className={`skill-pill${selected ? ' selected' : ''}`} style={{ width: '100%', textAlign: 'left', background: 'white', border: `2px solid ${selected ? '#059669' : '#E2E8F0'}`, borderRadius: 16, padding: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: selected ? '#D1FAE5' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      {cat.slug && <CategoryIcon slug={cat.slug} size={24} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: selected ? '#065F46' : '#334155' }}>{cat.name_en}</div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: selected ? '#059669' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected ? <Check size={14} color="white" strokeWidth={3} /> : <span style={{ fontSize: 14, color: '#94A3B8' }}>+</span>}
                    </div>
                  </button>
                );
              })
            )}

            {!isEditing && (!worker.categories || worker.categories.length === 0) && (
              <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '10px 0' }}>No services added.</p>
            )}
          </div>
        </div>

        {/* Settings */}
        <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #F8FAFC' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Settings</h3>
          </div>
          
          <button onClick={toggleSound} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #F8FAFC' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
              <Volume2 size={16} color="#059669" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', flex: 1, textAlign: 'left' }}>Sound notifications</span>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{settings.sounds ? 'On' : 'Off'}</span>
          </button>

          {/* Language */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Globe size={16} color="#059669" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Language</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => setLanguage(lang.code as any)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${settings.language === lang.code ? '#059669' : '#E2E8F0'}`, background: settings.language === lang.code ? '#ECFDF5' : 'white', fontSize: 12, fontWeight: settings.language === lang.code ? 800 : 500, color: settings.language === lang.code ? '#059669' : '#64748B', cursor: 'pointer' }}>
                  {lang.native}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logout and Delete Account */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <button onClick={() => { if (confirm('Are you sure you want to logout?')) logoutWorker(); }}
            style={{ width: '100%', padding: '16px', borderRadius: 16, border: '1.5px solid #CBD5E1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LogOut size={16} color="#475569" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>Logout</span>
          </button>

          <button onClick={handleDeleteAccount}
            style={{ width: '100%', padding: '16px', borderRadius: 16, border: '1.5px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Trash2 size={16} color="#EF4444" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>Delete Account</span>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: '#CBD5E1', fontWeight: 500, marginTop: 24 }}>
          Neighborly Trust Worker Portal v2.0 · Protected under DPDP Act 2023
        </p>
      </div>
    </div>
  );
}
