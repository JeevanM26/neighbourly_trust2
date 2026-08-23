'use client';
import React, { useState, useEffect } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { format } from 'date-fns';
import { Zap, Bell, Star, TrendingUp, Clock, CheckCircle, IndianRupee, RefreshCw, ChevronRight, Briefcase, MapPin, Phone } from 'lucide-react';
import { JobOfferModal } from '../JobOfferModal';

const CategoryIcon = ({ slug, size = 14 }: { slug: string, size?: number }) => {
  const s = (slug || '').toLowerCase();
  if (s.includes('elec')) return <Zap size={size} color="#F59E0B" />;
  return <Briefcase size={size} color="#059669" />;
};

export default function DashboardScreen({ onGoToRequests, onGoToJobs }: {
  onGoToRequests: () => void;
  onGoToJobs: () => void;
}) {
  const { worker, webrtc, isOnline, toggleOnline, offers, activeBookings, earnings, refreshBookings, acceptOffer, declineOffer, isLoading } = useWorker();
  const [toggling, setToggling] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Location Rationale State
  const [showRationale, setShowRationale] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const handleToggleClick = () => {
    if (!isOnline) {
      // Show rationale before going online
      setShowRationale(true);
    } else {
      // Going offline can happen immediately
      executeToggle();
    }
  };

  const executeToggle = async () => {
    setShowRationale(false);
    setToggling(true);
    await toggleOnline();
    setToggling(false);
  };


  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = worker?.full_name?.split(' ')[0] ?? 'Partner';

  return (
    <div style={{ background: '#F0FDF4', height: '100%', overflowY: 'auto', paddingBottom: 80 }}>
      {/* ── Job Offer Alert Modal ── */}
      {offers.length > 0 && <JobOfferModal offer={offers[0]} onAccept={acceptOffer} onDecline={declineOffer} />}

      {/* ── Location Rationale Modal ── */}
      {showRationale && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 56, height: 56, background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MapPin size={28} color="#059669" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', textAlign: 'center', margin: '0 0 12px' }}>Location Access Needed</h3>
            <p style={{ fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px', fontWeight: 500 }}>
              Hero Hand needs to access your location in the background while you are online to match you with nearby customers and track your progress to jobs.
            </p>
            <button onClick={executeToggle} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #059669, #065F46)', color: 'white', borderRadius: 16, border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginBottom: 12 }}>
              Continue
            </button>
            <button onClick={() => setShowRationale(false)} style={{ width: '100%', padding: 16, background: 'transparent', color: '#64748B', borderRadius: 16, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Hero Header ── */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, margin: '0 0 2px', letterSpacing: '0.3px' }}>{greeting},</p>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.4px' }}>{firstName} 👷</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '4px 0 0', fontWeight: 500 }}>
              {format(currentTime, 'EEEE, d MMM · h:mm a')}
            </p>
          </div>
          <button onClick={refreshBookings} disabled={isLoading} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw size={16} color="white" style={{ animation: isLoading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* ── Big Online Toggle ── */}
        <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '20px', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: '-0.2px' }}>
                {isOnline ? '🟢 Online' : '⚫ Offline'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '4px 0 0', fontWeight: 500 }}>
                {isOnline ? 'You\'re visible to customers' : 'Tap to start accepting bookings'}
              </p>
            </div>
            <button
              className={`online-toggle ${isOnline ? 'online' : 'offline'}`}
              onClick={handleToggleClick}
              disabled={toggling}
              style={{ opacity: toggling ? 0.7 : 1 }}
              aria-label="Toggle online status"
            >
              <div className="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Today's Stats ── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: "Today's Earnings", value: `₹${earnings.net.toLocaleString('en-IN')}`, sub: `${earnings.jobs_count} jobs`, icon: IndianRupee, color: '#059669', bg: '#ECFDF5', iconColor: '#059669' },
            { label: 'Active Jobs', value: activeBookings.length, sub: 'in progress', icon: Briefcase, color: '#0B3D66', bg: '#EFF6FF', iconColor: '#3B82F6' },
            { label: 'Your Rating', value: worker?.rating?.toFixed(1) ?? '5.0', sub: 'overall', icon: Star, color: '#92400E', bg: '#FEF3C7', iconColor: '#F59E0B' },
            { label: 'Total Jobs', value: worker?.total_jobs ?? 0, sub: 'completed', icon: CheckCircle, color: '#065F46', bg: '#ECFDF5', iconColor: '#10B981' },
          ].map(({ label, value, sub, icon: Icon, color, bg, iconColor }) => (
            <div key={label} style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon size={18} color={iconColor} strokeWidth={2.5} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '-0.5px' }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Your Skills ── */}
      {worker?.categories && worker.categories.length > 0 && (
        <div style={{ padding: '20px 16px 0' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.2px' }}>Your Services</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {worker.categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #D1FAE5', borderRadius: 20, padding: '6px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <CategoryIcon slug={cat.slug || cat.name_en} size={14} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46' }}>{cat.name_en}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Active Jobs ── */}
      {activeBookings.length > 0 && (
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Active Jobs</h3>
            <button onClick={onGoToJobs} style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {activeBookings.slice(0, 2).map(b => (
            <div key={b.id} onClick={onGoToJobs} style={{ background: 'white', borderRadius: 16, padding: '14px', border: '1px solid #D1FAE5', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{b.customer_name || 'Customer'}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>{b.category_name}</div>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '4px 10px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
                    {b.status === 'on_the_way' ? 'On the Way' : b.status === 'in_progress' ? 'In Progress' : 'Accepted'}
                  </span>
                </div>
              </div>
              {b.address_text && <p style={{ fontSize: 11, color: '#64748B', margin: '8px 0 0', fontWeight: 500, background: '#F8FAFC', borderRadius: 8, padding: '6px 10px' }}>📍 {b.address_text}</p>}
              
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    webrtc.startCall(b.customer_id, b.customer_name || 'Customer', worker?.full_name || 'Worker', worker?.avatar_url);
                  }}
                  style={{ flex: 1, background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 10, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#059669' }}
                >
                  <Phone size={12} color="#059669" /> Call Customer
                </button>
                <button
                  onClick={onGoToJobs}
                  style={{ flex: 1, background: '#059669', border: 'none', borderRadius: 10, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'white' }}
                >
                  Manage Job →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty / Offline State ── */}
      {!isOnline && activeBookings.length === 0 && offers.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>😴</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#334155', marginBottom: 6 }}>You're offline</h3>
          <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6 }}>Toggle the switch above to start receiving bookings from customers near you.</p>
        </div>
      )}

      {/* ── Waiting for Jobs State ── */}
      {isOnline && activeBookings.length === 0 && offers.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 16px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid #D1FAE5', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📡</div>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Finding Nearby Jobs</h3>
          <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6 }}>We are searching for customers in your area. Keep the app open to receive instant alerts.</p>
        </div>
      )}
    </div>
  );
}
