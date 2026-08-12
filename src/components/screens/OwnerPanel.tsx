'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { OWNER_PHONES, PRIMARY_SUPER_OWNER } from '../../lib/types';
import { getClient } from '../../lib/supabase';
import { Shield, Users, BarChart2, Settings, Plus, Trash2, Eye, EyeOff, RefreshCw, ChevronLeft, Star, MapPin, Power, X } from 'lucide-react';

type OwnerTab = 'providers' | 'stats' | 'access' | 'settings';

export default function OwnerPanel({ onClose }: { onClose: () => void }) {
  const { user, showToast, bookings } = useApp();
  const [providers, setProviders] = useState<any[]>([]);
  const [tab, setTab] = useState<OwnerTab>('providers');
  const [refreshing, setRefreshing] = useState(false);

  const ownerNumbers = OWNER_PHONES;
  const isPrimary = user?.phone?.replace(/\D/g, '') === PRIMARY_SUPER_OWNER;

  const handleRefresh = async () => {
    setRefreshing(true);
    const { data } = await getClient()!.from('worker_profiles').select('*, profiles(full_name, avatar_url, phone)');
    if (data) {
      setProviders(data.map(d => ({
        id: d.profile_id,
        name: d.profiles?.full_name,
        avatar_url: d.profiles?.avatar_url,
        phone: d.profiles?.phone,
        is_online: d.is_online,
        rating: Number(d.avg_rating) || 5.0,
        hourly_rate: 400, // Hardcoded fallback
        category: 'Worker'
      })));
    }
    setRefreshing(false);
    showToast('Providers refreshed!');
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const totalRevenue = bookings.reduce((s, b) => s + (b.commission_amount || 0), 0);
  const totalBookingsCount = bookings.length;
  const onlineCount = providers.filter(p => p.is_online).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F0F7FF', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #041B30 0%, #0B3D66 100%)', padding: '20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="#F59E0B" />
              <span style={{ fontSize: 18, fontWeight: 900, color: 'white', letterSpacing: '-0.2px' }}>Owner Panel</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0, fontWeight: 500 }}>
              {isPrimary ? 'Super Owner' : 'Admin Access'}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Providers', value: providers.length, emoji: '👥' },
            { label: 'Online', value: onlineCount, emoji: '🟢' },
            { label: 'Revenue', value: `₹${totalRevenue}`, emoji: '💰' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{s.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'white' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', display: 'flex', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        {([
          ['providers', Users, 'Providers'],
          ['stats', BarChart2, 'Analytics'],
          ['access', Shield, 'Access'],
        ] as [OwnerTab, any, string][]).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '12px 4px', border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: tab === key ? '#0B3D66' : '#94A3B8',
              borderBottom: `2px solid ${tab === key ? '#0B3D66' : 'transparent'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <Icon size={16} strokeWidth={2.5} />
            <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Providers Tab */}
        {tab === 'providers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                All Service Providers
              </h3>
              <button
                onClick={handleRefresh}
                style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <RefreshCw size={13} color="#64748B" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Refresh</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {providers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: 13 }}>
                  No providers registered yet.
                </div>
              ) : (
                providers.map(p => (
                  <div key={p.id} style={{ background: 'white', borderRadius: 14, padding: '14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', background: '#F0F7FF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : <span style={{ fontSize: 18 }}>🔧</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B' }}>
                        <span>{p.category}</span>
                        <span>·</span>
                        <Star size={10} fill="#F59E0B" color="#F59E0B" />
                        <span>{p.rating.toFixed(1)}</span>
                        <span>·</span>
                        <span>₹{p.hourly_rate}/hr</span>
                      </div>
                    </div>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: p.is_online ? '#10B981' : '#CBD5E1', flexShrink: 0,
                    }} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Total Bookings', value: totalBookingsCount, color: '#0B3D66', bg: '#E0F2FE', emoji: '📋' },
              { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: '#15803D', bg: '#DCFCE7', emoji: '✅' },
              { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#92400E', bg: '#FEF3C7', emoji: '⏳' },
              { label: 'Platform Revenue', value: `₹${totalRevenue}`, color: '#7C3AED', bg: '#EDE9FE', emoji: '💰' },
              { label: 'Online Providers', value: `${onlineCount} / ${providers.length}`, color: '#15803D', bg: '#DCFCE7', emoji: '🟢' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {stat.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 2 }}>{stat.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Access Tab */}
        {tab === 'access' && (
          <div>
            <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#92400E', fontWeight: 600, lineHeight: 1.5 }}>
              ⚠️ Owner phone numbers can access the admin panel. Only {PRIMARY_SUPER_OWNER} (Super Owner) can manage this list.
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
              Owner Phone Numbers
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {ownerNumbers.map((num, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>+91 {num}</div>
                    {num === PRIMARY_SUPER_OWNER && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B' }}>⭐ Super Owner</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
