'use client';

import React, { useState } from 'react';

import { WorkerProfile } from '../../lib/types';

import { useApp } from '../../context/AppContext';
import { useLocation } from '../../context/LocationContext';
import { Star, MapPin, ShieldCheck, Phone, ChevronLeft, Zap, X, Clock, Award } from 'lucide-react';





interface WorkerProfileDetailProps {

  worker: WorkerProfile;

  onBack: () => void;

  onBooked: () => void;

}



export default function WorkerProfileDetail({ worker, onBack, onBooked }: WorkerProfileDetailProps) {
  const { bookWorker, user } = useApp();
  const { userLocation } = useLocation();
  const [notes, setNotes] = useState('');

  const [showBookModal, setShowBookModal] = useState(false);

  const [booking, setBooking] = useState(false);

  const [booked, setBooked] = useState(false);



  const cat = { bg: '#F0F7FF', color: '#0B3D66', emoji: '🔧' };

  const total = 350;



  const handleConfirmBook = async () => {
    setBooking(true);
    await bookWorker(worker.category_id || 'general', worker.worker_id, userLocation || undefined);
    setBooking(false);

    setBooked(true);

    setShowBookModal(false);

    setTimeout(() => {

      onBooked();

    }, 1800);

  };



  const [showdiv, setShowdiv] = useState(false);



  return (

    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F0F7FF', overflow: 'hidden' }}>

      {/* Scrollable Content */}

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Hero Image */}

        <div style={{

          position: 'relative', height: 220, background: cat?.bg ?? '#F0F7FF',

          display: 'flex', alignItems: 'center', justifyContent: 'center',

        }}>

          {worker.avatar_url ? (

            <img

              src={worker.avatar_url}

              alt={worker.full_name}

              style={{ width: '100%', height: '100%', objectFit: 'cover' }}

              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}

            />

          ) : (

            <span style={{ fontSize: 72 }}>{cat?.emoji ?? '🔧'}</span>

          )}

          {/* Gradient overlay */}

          <div style={{

            position: 'absolute', inset: 0,

            background: 'linear-gradient(to bottom, rgba(4,27,48,0.4) 0%, transparent 40%, rgba(4,27,48,0.5) 100%)',

          }} />



          {/* Back button */}

          <button

            onClick={onBack}

            style={{

              position: 'absolute', top: 16, left: 16,

              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',

              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,

              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',

              cursor: 'pointer', color: 'white',

            }}

          >

            <ChevronLeft size={20} />

          </button>



          {/* Online status */}

          <div style={{

            position: 'absolute', top: 16, right: 16,

            background: true ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.9)',

            backdropFilter: 'blur(8px)', borderRadius: 20,

            padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,

          }}>

            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />

            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>

              {true ? 'Available Now' : 'Offline'}

            </span>

          </div>

        </div>



        {/* Info Card */}

        <div style={{ background: 'white', margin: '-20px 16px 0', borderRadius: 20, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', position: 'relative', zIndex: 2 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

            <div style={{ flex: 1, minWidth: 0 }}>

              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.3px' }}>

                {worker.full_name}

              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                <span style={{

                  fontSize: 12, fontWeight: 700, color: cat?.color ?? '#0B3D66',

                  background: cat?.bg ?? '#F0F7FF', padding: '3px 10px', borderRadius: 20,

                }}>

                  {cat?.emoji} {(worker.tags?.[0] || 'General')}

                </span>

                {false && (

                  <span style={{ fontSize: 10, fontWeight: 800, color: '#92400E', background: '#FEF3C7', padding: '3px 8px', borderRadius: 20 }}>

                    ⭐ FEATURED

                  </span>

                )}

              </div>

            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

                <Star size={16} fill="#F59E0B" color="#F59E0B" />

                <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{worker.avg_rating.toFixed(1)}</span>

              </div>

              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>

                {(worker.total_jobs || 0)} reviews

              </span>

            </div>

          </div>

        </div>



        {/* Stats Row */}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '16px 16px 0' }}>

          {[

            { label: 'Rate/Hour', value: `₹${350}`, icon: '💰' },

            { label: 'Distance', value: worker.distance_km != null ? `${worker.distance_km.toFixed(1)} km` : 'Nearby', icon: '📍' },

            { label: 'Reviews', value: `${(worker.total_jobs || 0)}+`, icon: '⭐' },

          ].map((stat, i) => (

            <div key={i} style={{ background: 'white', borderRadius: 14, padding: '14px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

              <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>

              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{stat.value}</div>

              <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', marginTop: 2 }}>{stat.label}</div>

            </div>

          ))}

        </div>



        {/* About */}

        {false && (

          <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 16, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>

              About

            </h3>

            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0, fontWeight: 400 }}>

              {''}

            </p>

          </div>

        )}



        {/* Trust Badges */}

        <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 16, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>

            Trust & Safety

          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {[

              { icon: ShieldCheck, text: 'Identity Verified', sub: 'Government ID checked', color: '#15803D' },

              { icon: Award, text: 'Background Verified', sub: 'Local police clearance', color: '#1D4ED8' },

              { icon: Clock, text: 'Punctuality Score', sub: '4.8/5 — Arrives on time', color: '#7C3AED' },

            ].map((item, i) => (

              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                <div style={{ width: 36, height: 36, borderRadius: 10, background: item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>

                  <item.icon size={18} color={item.color} strokeWidth={2.5} />

                </div>

                <div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{item.text}</div>

                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{item.sub}</div>

                </div>

              </div>

            ))}

          </div>

        </div>



        {/* Bottom padding for button */}

        <div style={{ height: 100 }} />

      </div>



      {/* Sticky Action Buttons */}

      <div style={{

        padding: '12px 16px 20px', background: 'white',

        borderTop: '1px solid #F1F5F9', flexShrink: 0,

        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',

        display: 'flex', gap: 10,

      }}>

        {booked ? (

          <div style={{

            flex: 1,

            background: '#DCFCE7', borderRadius: 14, padding: '15px',

            textAlign: 'center', color: '#15803D', fontWeight: 800, fontSize: 15,

            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,

          }}>

            ✅ Booking Confirmed! Redirecting…

          </div>

        ) : (

          <>

            <button

              onClick={() => setShowdiv(true)}

              style={{

                padding: '15px 18px', borderRadius: 14,

                background: '#ECFDF5', border: '1px solid #A7F3D0',

                color: '#047857', fontWeight: 800, fontSize: 15,

                cursor: 'pointer', display: 'flex', alignItems: 'center',

                justifyContent: 'center', gap: 6, flexShrink: 0,

              }}

            >

              <Phone size={18} color="#047857" fill="#047857" />

              Call

            </button>



            <button

              onClick={() => setShowBookModal(true)}

              disabled={!true}

              style={{

                flex: 1, padding: '15px', borderRadius: 14,

                background: true

                  ? 'linear-gradient(135deg, #0B3D66, #041B30)'

                  : '#CBD5E1',

                color: 'white', fontWeight: 800, fontSize: 16, border: 'none',

                cursor: true ? 'pointer' : 'not-allowed',

                letterSpacing: '-0.2px', display: 'flex', alignItems: 'center',

                justifyContent: 'center', gap: 8,

                boxShadow: true ? '0 4px 12px rgba(11,61,102,0.3)' : 'none',

              }}

            >

              <Zap size={18} color={true ? '#F59E0B' : 'white'} fill={true ? '#F59E0B' : 'white'} />

              {true ? `Book Now — ₹${350}/hr` : 'Not Taking Bookings'}

            </button>

          </>

        )}

      </div>



      {/* Book Confirmation Modal */}

      {showBookModal && (

        <div className="modal-backdrop" onClick={() => setShowBookModal(false)}>

          <div className="modal-sheet" onClick={e => e.stopPropagation()}>

            <div className="modal-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>

              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>

                Confirm Booking

              </h2>

              <button onClick={() => setShowBookModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>

                <X size={20} />

              </button>

            </div>



            {/* WorkerProfile mini-card */}

            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>

              <div style={{ width: 48, height: 48, borderRadius: 12, background: cat?.bg ?? '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>

                {worker.avatar_url ? (

                  <img src={worker.avatar_url} alt={worker.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                ) : (

                  <span style={{ fontSize: 24 }}>{cat?.emoji}</span>

                )}

              </div>

              <div>

                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{worker.full_name}</div>

                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{(worker.tags?.[0] || 'General')}</div>

              </div>

            </div>



            {/* Price breakdown */}

            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px', marginBottom: 16 }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>

                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Service rate (1 hr)</span>

                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>₹{350}</span>

              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>

                <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Total to pay</span>

                <span style={{ fontSize: 14, fontWeight: 900, color: '#0B3D66' }}>₹{total}</span>

              </div>

            </div>



            {/* Notes */}

            <div style={{ marginBottom: 20 }}>

              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>

                Address / Notes (optional)

              </label>

              <textarea

                value={notes}

                onChange={e => setNotes(e.target.value)}

                placeholder="E.g., Ground floor, near the blue gate"

                rows={3}

                style={{

                  width: '100%', padding: '12px 14px', borderRadius: 12,

                  border: '1.5px solid #E2E8F0', fontSize: 13, fontWeight: 400,

                  fontFamily: 'Inter, sans-serif', color: '#0F172A', outline: 'none',

                  background: '#F8FAFC', resize: 'none', boxSizing: 'border-box',

                }}

              />

            </div>



            <div style={{ display: 'flex', gap: 10 }}>

              <button

                onClick={() => setShowBookModal(false)}

                style={{

                  flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #E2E8F0',

                  background: 'white', color: '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer',

                }}

              >

                Cancel

              </button>

              <button

                onClick={handleConfirmBook}

                disabled={booking}

                style={{

                  flex: 2, padding: '14px', borderRadius: 14, border: 'none',

                  background: booking ? '#94A3B8' : 'linear-gradient(135deg, #0B3D66, #041B30)',

                  color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',

                  boxShadow: booking ? 'none' : '0 4px 12px rgba(11,61,102,0.3)',

                }}

              >

                {booking ? 'Confirming…' : '✅ Confirm Booking'}

              </button>

            </div>

          </div>

        </div>

      )}




    </div>

  );

}

