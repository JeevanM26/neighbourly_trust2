'use client';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkerProfile } from '../../lib/types';
import { findNearbyWorkers } from '../../lib/supabase';
import { ChevronLeft, Star, Phone, Briefcase, Award, MapPin, Loader2, CheckCircle2, User } from 'lucide-react';

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
  const { requestLocation, bookWorker, categories, webrtc, bookings, user } = useApp();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success'>('idle');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const activeBooking = activeBookingId ? bookings.find(b => b.id === activeBookingId) : null;

  const category = categories.find(c => c.id === categoryId);

  useEffect(() => {
    let isMounted = true;
    async function loadWorker() {
      // In a real app we might fetch the specific worker by ID, but since we already 
      // ran nearby_workers, we can just run it again or pass the worker object directly. 
      // For simplicity in this refactor, we re-fetch nearby workers and find the one.
      const loc = await requestLocation();
      if (loc) {
        const data = await findNearbyWorkers(categoryId, loc.lat, loc.lng);
        if (isMounted) {
          const w = data.find(x => x.worker_id === workerId);
          setWorker(w || null);
          setLoading(false);
        }
      }
    }
    loadWorker();
    return () => { isMounted = false; };
  }, [categoryId, workerId, requestLocation]);

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

  // If we have an active booking, render the tracker view
  if (activeBookingId && activeBooking) {
    const isSearching = activeBooking.status === 'searching';
    const isAccepted = ['accepted', 'on_the_way', 'in_progress'].includes(activeBooking.status);
    const isCompleted = activeBooking.status === 'completed';

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white' }}>
        <div style={{ padding: '40px 24px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ChevronLeft size={24} />
          </button>
          <h2 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: 18, fontWeight: 700 }}>Booking Status</h2>
          <div style={{ width: 24 }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          {isSearching && (
            <>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <Loader2 size={40} color="#3B82F6" className="animate-spin" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Finding Nearest Specialist</h3>
              <p style={{ color: '#64748B', fontSize: 14 }}>We are dispatching your request to the best available professional nearby...</p>
            </>
          )}

          {isAccepted && (
            <>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F1F5F9', border: '4px solid #10B981', overflow: 'hidden', marginBottom: 16 }}>
                {activeBooking.worker_avatar ? (
                  <img src={activeBooking.worker_avatar} alt={activeBooking.worker_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                    <User size={32} />
                  </div>
                )}
              </div>
              <div style={{ background: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
                {activeBooking.status.replace(/_/g, ' ').toUpperCase()}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{activeBooking.worker_name || 'Specialist'}</h3>
              <p style={{ color: '#64748B', fontSize: 14, marginBottom: 32 }}>is assigned to your request.</p>

              <button 
                onClick={() => activeBooking.worker_id && webrtc.startCall(activeBooking.worker_id, activeBooking.worker_name || 'Specialist', user?.full_name || 'Customer', user?.avatar_url || '')}
                style={{
                  width: '100%', height: 56, borderRadius: 16, border: 'none',
                  background: '#10B981', color: 'white', fontSize: 16, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                }}
              >
                <Phone size={20} /> Call Specialist
              </button>
            </>
          )}

          {isCompleted && (
            <>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <CheckCircle2 size={40} color="#10B981" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Job Completed</h3>
              <p style={{ color: '#64748B', fontSize: 14, marginBottom: 32 }}>Your service has been completed successfully.</p>
              
              <button 
                onClick={onBooked}
                style={{
                  width: '100%', height: 56, borderRadius: 16, border: 'none',
                  background: 'linear-gradient(135deg, #0B3D66, #041B30)', color: 'white', fontSize: 16, fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </>
          )}

          {(!isSearching && !isAccepted && !isCompleted) && (
            <>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Status: {activeBooking.status}</h3>
              <button onClick={onBooked} style={{ marginTop: 24, padding: '12px 24px', background: '#F1F5F9', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </>
          )}
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    );
  }

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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
          {worker.full_name}
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
      </div>
    </div>
  );
}
