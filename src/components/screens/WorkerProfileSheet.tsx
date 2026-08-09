'use client';
import React, { useEffect, useState } from 'react';
import { getClient } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { WorkerProfile } from '../../lib/types';
import { findNearbyWorkers } from '../../lib/supabase';
import { ChevronLeft, Star, Phone, Briefcase, Award, MapPin, Loader2, CheckCircle2, User, ShieldCheck } from 'lucide-react';

export default function WorkerProfileSheet({
  workerId,
  categoryId,
  onBack,
  onBooked,
}: {
  workerId: string;
  categoryId: string;
  onBack: () => void;
  onBooked: () => void;
}) {
  const { requestLocation, bookWorker, categories, webrtc, bookings, user, searchLocation, userLocation, refreshBookings } = useApp();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success'>('idle');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const category = categories.find(c => c.id === categoryId);

  useEffect(() => {
    let isMounted = true;
    async function loadWorker() {
      const loc = searchLocation || userLocation;
      if (loc.lat) {
        const data = await findNearbyWorkers(categoryId, loc.lat, loc.lng);
        if (isMounted) {
          const w = data.find(x => x.worker_id === workerId);
          setWorker(w || null);
          setLoading(false);
        }
      } else {
        const fallbackLoc = await requestLocation();
        if (fallbackLoc) {
          const data = await findNearbyWorkers(categoryId, fallbackLoc.lat, fallbackLoc.lng);
          if (isMounted) {
            const w = data.find(x => x.worker_id === workerId);
            setWorker(w || null);
            setLoading(false);
          }
        }
      }
    }
    loadWorker();
    return () => { isMounted = false; };
  }, [categoryId, workerId, searchLocation, userLocation, requestLocation]);

  // Determine if there is an active booking related to this worker/category
  // Prioritize active states over 'searching' in case there are orphaned test bookings
  const relevantBookings = bookings.filter(b => b.category_id === categoryId && ['searching', 'accepted', 'on_the_way', 'in_progress'].includes(b.status));
  const statusPriority: Record<string, number> = { in_progress: 1, on_the_way: 2, accepted: 3, searching: 4 };
  relevantBookings.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
  
  const activeBooking = (activeBookingId ? bookings.find(b => b.id === activeBookingId) : null)
    || relevantBookings[0];

  // Polling fallback: if we have an active booking or just booked, poll every 3 seconds
  // in case the Realtime WebSocket drops the event or is blocked.
  useEffect(() => {
    let interval: any;
    const shouldPoll = bookingStatus === 'success' || (activeBooking && !['completed', 'cancelled'].includes(activeBooking.status));
    
    if (shouldPoll) {
      interval = setInterval(() => {
        refreshBookings();
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bookingStatus, activeBooking, refreshBookings]);

  const handleBook = async () => {
    setBookingStatus('booking');
    const id = await bookWorker(categoryId);
    if (id) {
      setActiveBookingId(id);
      setBookingStatus('success');
    } else {
      setBookingStatus('idle');
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ animation: 'pulse 1.5s infinite' }}>Loading profile...</div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Worker not found or no longer online.</p>
        <button onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const isSearching = activeBooking?.status === 'searching' || (bookingStatus === 'success' && !activeBooking);
  const isAccepted = activeBooking ? ['accepted', 'on_the_way', 'in_progress'].includes(activeBooking.status) : false;
  const isCompleted = activeBooking?.status === 'completed';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white' }}>
      {/* Header Image Area */}
      <div style={{ 
        height: 200, background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)',
        position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end'
      }}>
        <button 
          onClick={onBack} 
          style={{ 
            position: 'absolute', top: 40, left: 24, 
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: 40, height: 40, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)', cursor: 'pointer'
          }}
        >
          <ChevronLeft size={24} />
        </button>

        <div style={{ 
          width: 100, height: 100, borderRadius: '50%', background: '#F1F5F9',
          border: '4px solid white', transform: 'translateY(50%)', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
        }}>
          {worker.avatar_url ? (
            <img src={worker.avatar_url} alt={worker.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={40} color="#64748B" />
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div style={{ padding: '60px 24px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {worker.full_name}
          <div style={{ background: '#10B981', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={10} strokeWidth={3} />
          </div>
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 16px', fontWeight: 500 }}>
          {category?.name_en || 'Specialist'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#F59E0B', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
              <Star size={16} fill="#F59E0B" />
              {worker.avg_rating ? worker.avg_rating.toFixed(1) : 'New'}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Rating</div>
          </div>
          
          <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#3B82F6', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
              <Briefcase size={16} />
              {worker.total_jobs || 0}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Jobs</div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#10B981', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
              <Award size={16} />
              {worker.years_experience || 1}y
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Exp</div>
          </div>
        </div>
        
        <div style={{ textAlign: 'left', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>About</h3>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
            Hi, I'm {worker.full_name.split(' ')[0]}. I have over {worker.years_experience || 1} years of professional experience handling {category?.name_en || 'maintenance'} tasks. Fully vaccinated, background-checked, and committed to 100% customer satisfaction.
          </p>
        </div>

        <div style={{ textAlign: 'left', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Featured Review</h3>
          <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 16, border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', gap: 2, color: '#F59E0B', marginBottom: 6 }}>
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="#F59E0B" />)}
            </div>
            <p style={{ fontSize: 13, color: '#334155', fontStyle: 'italic', margin: '0 0 8px' }}>
              "Excellent service! Arrived exactly on time and fixed the issue in under 30 minutes. Highly recommended."
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: 0 }}>— Verified Customer</p>
          </div>
        </div>

        <div style={{ background: '#EFF6FF', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, textAlign: 'left' }}>
          <MapPin size={24} color="#3B82F6" />
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#1E3A8A' }}>Currently Nearby</p>
            <p style={{ margin: 0, fontSize: 12, color: '#60A5FA', fontWeight: 600 }}>{worker.distance_km.toFixed(1)} km away from your location</p>
          </div>
        </div>

      </div>

      <div style={{ flex: 1 }} />

      {/* Action Buttons */}
      <div style={{ padding: 24, background: 'white', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 12 }}>
        <button 
          onClick={() => webrtc.startCall(workerId, worker.full_name, user?.full_name || 'Customer', user?.avatar_url || '')}
          style={{
            width: 56, height: 56, borderRadius: 16, border: '2px solid #10B981',
            background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#10B981'
          }}
          title="Call Worker"
        >
          <Phone size={24} />
        </button>
        
        {(() => {
          if (isSearching) {
            return (
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                <button
                  disabled
                  style={{
                    flex: 1, height: 56, borderRadius: 16, border: 'none',
                    background: '#E2E8F0', color: '#475569', fontSize: 16, fontWeight: 800,
                    cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <Loader2 size={20} className="animate-spin" /> Searching...
                </button>
                <button
                  onClick={async () => {
                    if (!activeBooking) return;
                    setBookingStatus('idle');
                    setActiveBookingId(null);
                    await getClient()?.from('bookings').update({ status: 'cancelled' }).eq('id', activeBooking.id);
                    refreshBookings();
                  }}
                  style={{
                    width: 56, height: 56, borderRadius: 16, border: 'none',
                    background: '#FEE2E2', color: '#EF4444', fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Cancel Request"
                >
                  ✕
                </button>
              </div>
            );
          }
          
          if (isAccepted && activeBooking) {
            const statusMap: Record<string, string> = {
              accepted: 'Worker Accepted (On the way)',
              on_the_way: 'Worker On the Way',
              in_progress: 'Task In Progress'
            };
            const label = statusMap[activeBooking.status] || activeBooking.status.replace(/_/g, ' ').toUpperCase();
            
            return (
              <button
                disabled
                style={{
                  flex: 1, height: 56, borderRadius: 16, border: 'none',
                  background: '#ECFDF5', color: '#059669', fontSize: 16, fontWeight: 800,
                  cursor: 'default', boxShadow: 'inset 0 0 0 2px #10B981'
                }}
              >
                {label}
              </button>
            );
          }
          
          if (isCompleted) {
            return (
              <button
                onClick={onBooked}
                style={{
                  flex: 1, height: 56, borderRadius: 16, border: 'none',
                  background: '#F1F5F9', color: '#0F172A', fontSize: 16, fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#10B981' }} /> Task Completed
              </button>
            );
          }

          // Default state
          return (
            <button
              onClick={handleBook}
              disabled={bookingStatus === 'booking'}
              style={{
                flex: 1, height: 56, borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg, #0B3D66, #041B30)',
                color: 'white', fontSize: 16, fontWeight: 800,
                cursor: bookingStatus === 'booking' ? 'not-allowed' : 'pointer',
                opacity: bookingStatus === 'booking' ? 0.8 : 1, boxShadow: '0 4px 12px rgba(11,61,102,0.3)'
              }}
            >
              {bookingStatus === 'booking' ? 'Requesting...' : 'Book Now'}
            </button>
          );
        })()}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
