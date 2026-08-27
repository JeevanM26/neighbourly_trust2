'use client';
import React, { useEffect, useState } from 'react';
import { getClient } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { WorkerProfile, DEFAULT_LOCATION } from '../../lib/types';
import { getWorkerProfile } from '../../lib/supabase';
import { ChevronLeft, Star, Phone, Briefcase, Award, MapPin, Loader2, CheckCircle2, User, ShieldCheck, Shield, X, Zap, Clock } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export default function WorkerProfileSheet({
  workerId,
  categoryId,
  initialWorker,
  onBack,
  onBooked,
}: {
  workerId: string;
  categoryId: string;
  initialWorker?: WorkerProfile | null;
  onBack: () => void;
  onBooked: () => void;
}) {
  const { bookWorker, categories, webrtc, bookings, user, refreshBookings } = useApp();
  const { requestLocation, searchLocation, userLocation } = useLocation();
  const [worker, setWorker] = useState<WorkerProfile | null>(initialWorker || null);
  const [loading, setLoading] = useState(!initialWorker);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success'>('idle');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const category = categories.find(c => c.id === (categoryId || worker?.category_id));

  useEffect(() => {
    let isMounted = true;
    async function loadWorker() {
      try {
        const w = await getWorkerProfile(workerId);
        if (isMounted) {
          if (w) setWorker(w);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    }

    if (!worker || worker.worker_id !== workerId) {
      setLoading(true);
      loadWorker();
    } else {
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [workerId]);

  // Determine if there is an active booking related to this specific worker session
  const activeBooking = activeBookingId
    ? bookings.find(b => b.id === activeBookingId)
    : bookings.find(b => b.worker_id === workerId && ['accepted', 'on_the_way', 'in_progress'].includes(b.status));

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
    const effectiveCatId = categoryId || worker?.category_id || (categories && categories[0]?.id) || '';
    let loc = searchLocation || userLocation;
    if (!loc) {
      loc = await requestLocation();
    }
    const customerLat = loc?.lat ?? userLocation?.lat ?? DEFAULT_LOCATION.lat;
    const customerLng = loc?.lng ?? userLocation?.lng ?? DEFAULT_LOCATION.lng;

    const id = await bookWorker(effectiveCatId, workerId, {
        lat: customerLat,
        lng: customerLng
    });
    if (id) {
      setActiveBookingId(id);
      setBookingStatus('success');
    } else {
      setBookingStatus('idle');
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', gap: 12 }}>
        <Loader2 className="animate-spin" size={32} color="#0B3D66" />
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Loading profile...</div>
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

  const isSearching = (activeBooking?.status as string) === 'searching' || (bookingStatus === 'success' && (!activeBooking || (activeBooking.status as string) === 'searching'));
  const isAccepted = activeBooking ? ['accepted', 'on_the_way', 'in_progress'].includes(activeBooking.status) : false;
  const isCompleted = activeBooking?.status === 'completed';
  const noWorkers = activeBooking?.status === 'no_workers_found';

  const handleFindAnother = () => {
    setActiveBookingId(null);
    setBookingStatus('idle');
    onBack();
  };

  if (noWorkers) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white' }}>
        <div style={{ padding: 40, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: '50%', background: '#FEE2E2', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
          }}>
            <X size={32} color="#EF4444" />
          </div>
          <h2 style={{ margin: '0 0 12px 0', color: '#0F172A' }}>Worker Not Available</h2>
          <p style={{ color: '#64748B', marginBottom: 32 }}>We couldn't connect you with {worker.full_name}. They might be offline or busy.</p>
          <button 
            onClick={handleFindAnother}
            style={{ 
              width: '100%', padding: '16px', borderRadius: 12, border: 'none', 
              background: '#0B3D66', color: 'white', fontWeight: 600, fontSize: 16, cursor: 'pointer'
            }}
          >
            Find Another Worker
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F4F7FB' }}>
      
      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        
        {/* Banner / Avatar */}
        <div style={{ 
          height: 280, 
          position: 'relative', 
          background: '#E2E8F0',
          backgroundImage: `url(${worker.avatar_url || 'https://ui-avatars.com/api/?name=' + worker.full_name})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          {/* Back button */}
          <button onClick={onBack} style={{
             position: 'absolute', top: 20, left: 16,
             width: 40, height: 40, borderRadius: 12,
             background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none',
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             backdropFilter: 'blur(10px)', zIndex: 10, cursor: 'pointer'
          }}>
            <ChevronLeft size={24} />
          </button>
          
          {/* Available badge */}
          <div style={{
             position: 'absolute', top: 20, right: 16,
             background: '#10B981', color: 'white', borderRadius: 20,
             padding: '6px 12px', fontSize: 13, fontWeight: 700,
             display: 'flex', alignItems: 'center', gap: 6, zIndex: 10
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
            Available Now
          </div>
        </div>

        {/* Main Card (Overlapping) */}
        <div style={{
          background: 'white',
          borderRadius: 24,
          margin: '-24px 16px 16px',
          padding: 24,
          position: 'relative',
          zIndex: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div>
               <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>
                 {worker.full_name}
               </h1>
               <div style={{ 
                 display: 'inline-flex', alignItems: 'center', gap: 4, 
                 background: '#FEF3C7', color: '#B45309', 
                 padding: '4px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700
               }}>
                 <Zap size={14} fill="#B45309" />
                 {category?.name_en || 'Specialist'}
               </div>
             </div>
             <div style={{ textAlign: 'right' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                 <Star size={20} fill="#F59E0B" color="#F59E0B" />
                 {worker.avg_rating ? worker.avg_rating.toFixed(1) : '5.0'}
               </div>
               <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginTop: 4 }}>
                 {worker.total_jobs || 0} reviews
               </div>
             </div>
           </div>
        </div>

        {/* 2 Square Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '0 16px 16px' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 16, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><MapPin size={24} color="#EF4444" /></div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{worker.distance_km.toFixed(1)} km</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Distance</div>
          </div>
          <div style={{ background: 'white', borderRadius: 20, padding: 16, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Star size={24} color="#F59E0B" fill="#F59E0B" /></div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{worker.total_jobs || 0}+</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Reviews</div>
          </div>
        </div>

        {/* Special Instructions / Notes */}
        <div style={{ background: 'white', borderRadius: 24, margin: '0 16px 16px', padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Job Notes / Instructions
          </h3>
          <textarea
            placeholder="Describe issue (e.g. tap leaking in kitchen, 2nd floor)..."
            style={{
              width: '100%', minHeight: 70, padding: 12, borderRadius: 14,
              border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', outline: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Trust & Safety Card */}
        <div style={{ background: 'white', borderRadius: 24, margin: '0 16px 24px', padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', textAlign: 'left' }}>
           <h3 style={{ fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>
             SAFETY & TRUST PROTOCOLS
           </h3>
           
           <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
             <div style={{ width: 38, height: 38, borderRadius: 12, background: worker.is_verified ? '#DCFCE7' : '#FEF3C7', color: worker.is_verified ? '#10B981' : '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               {worker.is_verified ? <ShieldCheck size={20} /> : <CheckCircle2 size={20} />}
             </div>
             <div>
               <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                 {worker.is_verified ? 'Government ID Verified' : 'Registered Specialist'}
               </div>
               <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                 {worker.is_verified ? 'Identity documents verified by platform' : 'SMS phone authenticated partner'}
               </div>
             </div>
           </div>

           <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
             <div style={{ width: 38, height: 38, borderRadius: 12, background: '#DBEAFE', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <Phone size={18} />
             </div>
             <div>
               <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Number Privacy Shield</div>
               <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Direct encrypted in-app voice calling</div>
             </div>
           </div>

           <div style={{ display: 'flex', gap: 14 }}>
             <div style={{ width: 38, height: 38, borderRadius: 12, background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <Shield size={18} />
             </div>
             <div>
               <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Secure PIN Completion</div>
               <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Job confirmed with your 4-digit PIN</div>
             </div>
           </div>
        </div>
      </div>

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
                  <Loader2 size={20} className="animate-spin" /> Booking...
                </button>
                <button
                  onClick={async () => {
                    if (!activeBooking) return;
                    setBookingStatus('idle');
                    setActiveBookingId(null);
                    await getClient()?.from('bookings').update({ status: 'cancelled' }).eq('id', activeBooking.id);
                    
                    // Cleanup any other orphaned searching bookings for this category just in case
                    if (user?.id) {
                      await getClient()?.from('bookings').update({ status: 'cancelled' })
                        .eq('customer_id', user.id)
                        .eq('category_id', categoryId)
                        .eq('status', 'searching');
                    }
                    
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
