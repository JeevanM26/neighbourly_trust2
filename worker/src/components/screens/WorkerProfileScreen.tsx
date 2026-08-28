'use client';
import React, { useState, useEffect } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { ServiceCategory } from '../../lib/types';
import { fetchServiceCategories, fetchWorkerReviews } from '../../lib/supabase';
import PrivacyPolicyModal from '../PrivacyPolicyModal';
import { 
  Star, Volume2, Globe, Shield, LogOut, Trash2, Edit3, Check, X, Plus,
  Zap, Droplet, Hammer, Paintbrush, Wind, HardHat, Bug, Sparkles, 
  Wrench, Scissors, MapPin, IndianRupee, Phone, CheckCircle2, 
  ShieldCheck, Award, ChevronRight, QrCode, AlertTriangle, MessageSquare, FileText
} from 'lucide-react';

// ─── Robust Category Visual & Rate Mapping ───────────────────
export const getCategoryMeta = (slug?: string, name?: string) => {
  const key = `${slug || ''} ${name || ''}`.toLowerCase();
  
  if (key.includes('electr')) return { icon: Zap, color: '#F59E0B', bg: '#FEF3C7', rate: 350, emoji: '⚡' };
  if (key.includes('plumb')) return { icon: Droplet, color: '#0284C7', bg: '#E0F2FE', rate: 350, emoji: '🔧' };
  if (key.includes('carpent')) return { icon: Hammer, color: '#D97706', bg: '#FEF3C7', rate: 400, emoji: '🪚' };
  if (key.includes('paint')) return { icon: Paintbrush, color: '#8B5CF6', bg: '#F3E8FF', rate: 600, emoji: '🎨' };
  if (key.includes('clean')) return { icon: Sparkles, color: '#10B981', bg: '#ECFDF5', rate: 500, emoji: '🧹' };
  if (key.includes('salon')) return { icon: Scissors, color: '#F43F5E', bg: '#FFE4E6', rate: 500, emoji: '✂️' };
  if (key.includes('ac') || key.includes('appliance')) return { icon: Wind, color: '#06B6D4', bg: '#ECFEFF', rate: 450, emoji: '❄️' };
  if (key.includes('pest')) return { icon: Bug, color: '#EC4899', bg: '#FCE7F3', rate: 750, emoji: '🐛' };
  if (key.includes('mason') || key.includes('construct')) return { icon: HardHat, color: '#EAB308', bg: '#FEF9C3', rate: 550, emoji: '🧱' };
  if (key.includes('mechanic')) return { icon: Wrench, color: '#64748B', bg: '#F1F5F9', rate: 400, emoji: '🔧' };
  
  return { icon: Wrench, color: '#059669', bg: '#ECFDF5', rate: 350, emoji: '🛠️' };
};

const CategoryIcon = ({ slug, name, size = 20 }: { slug?: string; name?: string; size?: number }) => {
  const meta = getCategoryMeta(slug, name);
  const IconComp = meta.icon;
  return <IconComp size={size} color={meta.color} />;
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
    worker, logoutWorker, deleteAccount, updateProfileData, updateServiceRadius, addServiceCategory,
    settings, setLanguage, toggleSound, completedBookings, 
    showToast, isOnline 
  } = useWorker();
  
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftRadius, setDraftRadius] = useState(5);
  const [draftCategories, setDraftCategories] = useState<Set<string>>(new Set());
  const [availableCategories, setAvailableCategories] = useState<ServiceCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string>('Live GPS Location');

  // New Service Addition State
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [addingService, setAddingService] = useState(false);

  const handleAddNewService = async () => {
    if (!newServiceName.trim()) {
      showToast('Please enter a service name.', 'error');
      return;
    }
    setAddingService(true);
    const newCat = await addServiceCategory(newServiceName.trim());
    if (newCat) {
      setAvailableCategories(prev => {
        if (prev.some(c => c.id === newCat.id)) return prev;
        return [...prev, newCat];
      });
      setDraftCategories(prev => new Set(prev).add(newCat.id));
      setNewServiceName('');
      setShowAddServiceModal(false);
    }
    setAddingService(false);
  };

  useEffect(() => {
    fetchServiceCategories().then(data => setAvailableCategories(data));
  }, []);

  useEffect(() => {
    if (worker?.location?.lat && worker?.location?.lng) {
      const { lat, lng } = worker.location;
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(r => r.json())
        .then(data => {
          if (data?.display_name) {
            const parts = data.display_name.split(',');
            setResolvedAddress(parts.slice(0, 3).join(',').trim());
          } else {
            setResolvedAddress(`GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        })
        .catch(() => {
          setResolvedAddress(`GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        });
    }
  }, [worker?.location]);

  useEffect(() => {
    if (worker?.id) {
      fetchWorkerReviews(worker.id).then(data => setReviews(data));
    }
  }, [worker?.id]);

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
          
          {/* Avatar with Status Ring */}
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
            
            {worker.phone ? (
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '2px 0 8px', fontWeight: 600 }}>
                +91 {worker.phone}
              </p>
            ) : null}

            {/* Badges Bar */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '3px 8px' }}>
                <Star size={12} color="#FCD34D" fill="#FCD34D" />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{worker.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '3px 8px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{totalJobsCount} jobs done</span>
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
                const meta = getCategoryMeta(cat.slug, cat.name_en);
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
                        background: meta.bg, border: `1px solid ${meta.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}>
                        <CategoryIcon slug={cat.slug} name={cat.name_en} size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{cat.name_en}</div>
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
                const meta = getCategoryMeta(cat.slug, cat.name_en);
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
                      background: meta.bg, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <CategoryIcon slug={cat.slug} name={cat.name_en} size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: selected ? '#065F46' : '#334155' }}>
                        {cat.name_en}
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

            {isEditing && (
              <button
                type="button"
                onClick={() => setShowAddServiceModal(true)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#ECFDF5',
                  border: '2px dashed #059669',
                  borderRadius: 16,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  marginTop: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={20} color="#059669" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#065F46' }}>
                    + Add Other Service / Skill
                  </div>
                  <div style={{ fontSize: 11, color: '#047857', fontWeight: 500, marginTop: 1 }}>
                    Add a new profession to your profile & catalog
                  </div>
                </div>
              </button>
            )}

            {!isEditing && (!worker.categories || worker.categories.length === 0) && (
              <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '10px 0' }}>
                No services added. Tap Manage to add services.
              </p>
            )}
          </div>
        </div>

        {/* ── Add Service Modal ── */}
        {showAddServiceModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4, 27, 48, 0.75)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}>
            <div style={{
              background: 'white',
              borderRadius: 24,
              width: '100%',
              maxWidth: 380,
              padding: '24px 20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wrench size={18} color="#059669" />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                    Add New Service
                  </h3>
                </div>
                <button 
                  onClick={() => { setShowAddServiceModal(false); setNewServiceName(''); }}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={16} color="#64748B" />
                </button>
              </div>

              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: '0 0 16px' }}>
                Enter the name of the new service. It will be added immediately, notified to admin, and made visible across the customer booking app.
              </p>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Service Name
                </label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. CCTV Installation, Gardening, Solar Repair"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewService();
                  }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1.5px solid #059669',
                    fontSize: 14,
                    fontWeight: 600,
                    outline: 'none',
                    color: '#0F172A',
                    background: '#F8FAFC'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setShowAddServiceModal(false); setNewServiceName(''); }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 14,
                    border: '1.5px solid #E2E8F0',
                    background: 'white',
                    color: '#64748B',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNewService}
                  disabled={!newServiceName.trim() || addingService}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: 14,
                    border: 'none',
                    background: !newServiceName.trim() || addingService ? '#CBD5E1' : 'linear-gradient(135deg, #059669, #065F46)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: !newServiceName.trim() || addingService ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: newServiceName.trim() && !addingService ? '0 4px 12px rgba(5,150,105,0.3)' : 'none'
                  }}
                >
                  {addingService ? 'Adding…' : <>Add & Select Skill <Check size={16} /></>}
                </button>
              </div>
            </div>
          </div>
        )}

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
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{resolvedAddress}</span>
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
            max="25" 
            step="1" 
            value={draftRadius} 
            onChange={(e) => {
              const val = Number(e.target.value);
              setDraftRadius(val);
            }} 
            onMouseUp={(e) => {
              const val = Number((e.target as HTMLInputElement).value);
              updateServiceRadius(val);
            }}
            onTouchEnd={(e) => {
              const val = Number((e.target as HTMLInputElement).value);
              updateServiceRadius(val);
            }}
            style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>
            <span>2 km (Local)</span>
            <span>10 km</span>
            <span>25 km (City-wide)</span>
          </div>
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
                  type="button"
                  key={lang.code} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLanguage(lang.code as any);
                    showToast(`Language set to ${lang.native}`);
                  }}
                  style={{ 
                    padding: '7px 14px', borderRadius: 20, 
                    border: `1.5px solid ${settings.language === lang.code ? '#059669' : '#E2E8F0'}`, 
                    background: settings.language === lang.code ? '#ECFDF5' : 'white', 
                    fontSize: 12, fontWeight: settings.language === lang.code ? 800 : 600, 
                    color: settings.language === lang.code ? '#059669' : '#64748B', 
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  {lang.native}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Customer Ratings & Reviews Card ── */}
        <div style={{
          background: 'white', borderRadius: 24, padding: 20, marginBottom: 18,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={18} color="#F59E0B" fill="#F59E0B" />
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#475569', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Customer Feedback ({reviews.length})
              </h3>
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
              ★ {worker.rating?.toFixed(1) || '5.0'} / 5.0
            </div>
          </div>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 8px', color: '#94A3B8', fontSize: 13, fontWeight: 500 }}>
              No customer reviews yet. Reviews will appear here automatically when customers rate your completed jobs!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reviews.map((r, i) => (
                <div key={r.id || i} style={{ background: '#F8FAFC', borderRadius: 14, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{r.customer_name}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} fill={s <= r.rating ? '#F59E0B' : '#E2E8F0'} color={s <= r.rating ? '#F59E0B' : '#CBD5E1'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0', fontWeight: 500, lineHeight: 1.4 }}>
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Support & Policies ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <button 
            onClick={() => setShowPrivacyModal(true)}
            style={{ 
              width: '100%', padding: '14px 16px', borderRadius: 16, 
              border: '1.5px solid #E2E8F0', background: 'white', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', 
              justifyContent: 'space-between', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} color="#059669" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Partner Privacy & DPDP Rights</span>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </button>
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

        <p 
          onClick={() => setShowPrivacyModal(true)}
          style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 24, cursor: 'pointer', textDecoration: 'underline' }}
        >
          HOS: Workers Partner Portal v2.0 · DPDP Act 2023 Compliant
        </p>

        {/* Privacy Policy Modal */}
        <PrivacyPolicyModal 
          isOpen={showPrivacyModal} 
          onClose={() => setShowPrivacyModal(false)} 
        />

      </div>
    </div>
  );
}
