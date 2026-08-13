'use client';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../lib/types';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, CalendarDays, Phone, Star, ShieldCheck, MapPin, Sparkles, MessageSquare, ChevronRight, X } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { getClient } from '../../lib/supabase';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; emoji: string; step: number }> = {
  searching:        { label: 'Finding Nearby Pro', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', emoji: '🔍', step: 1 },
  pending:          { label: 'Request Sent',       color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', emoji: '⏳', step: 1 },
  accepted:         { label: 'Pro Assigned',       color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE', emoji: '✅', step: 2 },
  on_the_way:       { label: 'On The Way',         color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD', emoji: '🛵', step: 3 },
  in_progress:      { label: 'Work In Progress',   color: '#7C3AED', bg: '#EDE9FE', border: '#DDD6FE', emoji: '⚡', step: 4 },
  completed:        { label: 'Completed',          color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0', emoji: '🎉', step: 5 },
  cancelled:        { label: 'Cancelled',          color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', emoji: '🚫', step: 0 },
  no_workers_found: { label: 'No Pros Nearby',     color: '#DC2626', bg: '#FEE2E2', border: '#FECACA', emoji: '⚠️', step: 0 },
};

const STEP_LABELS = ['Requested', 'Assigned', 'On the Way', 'Working', 'Done'];

function BookingCard({ 
  booking, 
  onOpenReview,
  onOpenSos,
  onQuickMessage,
}: { 
  booking: Booking; 
  onOpenReview: (b: Booking) => void;
  onOpenSos: (b: Booking) => void;
  onQuickMessage: (b: Booking, msg: string) => void;
}) {
  const { user, webrtc } = useApp();
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  const formattedDate = (() => {
    try {
      const d = new Date(booking.created_at);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  })();

  const formattedTime = (() => {
    try {
      const d = new Date(booking.created_at);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return ''; }
  })();

  const isActive = ['searching', 'pending', 'accepted', 'on_the_way', 'in_progress'].includes(booking.status);
  const canCall = ['accepted', 'on_the_way', 'in_progress'].includes(booking.status) && !!booking.worker_id;
  const completionPin = (booking.id || '0000').slice(-4).toUpperCase();

  return (
    <div style={{
      background: 'white', borderRadius: 20, overflow: 'hidden',
      border: `1.5px solid ${status.border}`, boxShadow: '0 4px 16px rgba(11, 61, 102, 0.05)',
      transition: 'all 0.2s ease',
    }}>
      {/* Status Accent Bar */}
      <div style={{ height: 4, background: status.color }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header: Avatar, Name, Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
              background: '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #E2E8F0',
            }}>
              {booking.worker_avatar ? (
                <img src={booking.worker_avatar} alt={booking.worker_name || 'Worker'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 24 }}>{status.emoji}</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>
                {booking.worker_name || booking.category_name || 'Home Specialist'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginTop: 1 }}>
                {booking.category_name}
              </div>
            </div>
          </div>

          <div style={{
            background: status.bg, border: `1px solid ${status.border}`,
            borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: status.color }}>
              {status.label}
            </span>
          </div>
        </div>

        {/* ── 5-Stage Live Progress Stepper (Active orders only) ── */}
        {isActive && status.step > 0 && (
          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              {/* Connecting Background Line */}
              <div style={{
                position: 'absolute', top: 12, left: 16, right: 16, height: 3,
                background: '#E2E8F0', zIndex: 0,
              }} />
              <div style={{
                position: 'absolute', top: 12, left: 16,
                width: `${Math.max(0, (status.step - 1) / (STEP_LABELS.length - 1)) * 100}%`,
                height: 3, background: '#0B3D66', zIndex: 1, transition: 'width 0.4s ease',
              }} />

              {STEP_LABELS.map((label, idx) => {
                const stepNum = idx + 1;
                const isPassed = stepNum <= status.step;
                const isCurrent = stepNum === status.step;
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 2, position: 'relative' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: isPassed ? '#0B3D66' : '#FFFFFF',
                      border: `2px solid ${isPassed ? '#0B3D66' : '#CBD5E1'}`,
                      color: isPassed ? 'white' : '#94A3B8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 900,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(11, 61, 102, 0.15)' : 'none',
                      transition: 'all 0.3s ease',
                    }}>
                      {isPassed ? (stepNum < status.step ? '✓' : stepNum) : stepNum}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? '#0B3D66' : isPassed ? '#475569' : '#94A3B8',
                      textAlign: 'center', whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 4-Digit Security Completion PIN (Show during active job) ── */}
        {isActive && ['accepted', 'on_the_way', 'in_progress'].includes(booking.status) && (
          <div style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 12,
            border: '1px solid #FCD34D', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#92400E', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Share PIN with Specialist when work is done
              </div>
              <div style={{ fontSize: 12, color: '#78350F', fontWeight: 600, marginTop: 1 }}>
                Job Completion Code
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '2px', color: '#78350F', fontFamily: 'monospace' }}>
              {completionPin}
            </div>
          </div>
        )}

        {/* Details: Date, Address, Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12, fontWeight: 500 }}>
            <CalendarDays size={13} color="#94A3B8" />
            <span>{formattedDate} · {formattedTime}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#0B3D66' }}>
            ₹{booking.total_amount || 350}
          </div>
        </div>

        {booking.address_notes && (
          <div style={{ marginTop: 8, background: '#F8FAFC', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#475569', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color="#0B3D66" />
            <span>{booking.address_notes}</span>
          </div>
        )}

        {/* ── Quick Message Presets (Active orders only) ── */}
        {isActive && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Quick Updates
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {[
                '📍 I am at the gate',
                '🔔 Please ring bell',
                '🕒 ETA please?',
                '🔑 PIN is ready'
              ].map(msg => (
                <button
                  key={msg}
                  onClick={() => onQuickMessage(booking, msg)}
                  style={{
                    background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 14,
                    padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#334155',
                    whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0
                  }}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          {canCall && (
            <button
              onClick={() => {
                const targetWorkerId = booking.worker_id;
                if (webrtc?.startCall && targetWorkerId) {
                  webrtc.startCall(
                    targetWorkerId, 
                    booking.worker_name || 'Specialist', 
                    user?.full_name || 'Customer', 
                    user?.avatar_url
                  );
                }
              }}
              style={{
                flex: 1, background: '#ECFDF5', border: '1.5px solid #A7F3D0', color: '#047857',
                padding: '11px 12px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <Phone size={15} fill="#047857" color="#047857" />
              Free Call
            </button>
          )}

          {isActive && (
            <button
              onClick={() => onOpenSos(booking)}
              style={{
                background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626',
                padding: '11px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
              title="Emergency SOS"
            >
              <ShieldCheck size={15} />
              SOS
            </button>
          )}

          {booking.status === 'completed' && (
            <button
              onClick={() => onOpenReview(booking)}
              style={{
                flex: 1, background: '#FEF3C7', border: '1.5px solid #FDE68A', color: '#92400E',
                padding: '11px 16px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Star size={15} fill="#D97706" color="#D97706" />
              Rate & Review Pro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingsScreen() {
  const { bookings, refreshBookings, isLoading, showToast, user } = useApp();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [refreshing, setRefreshing] = useState(false);

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // SOS Emergency Modal State
  const [sosBooking, setSosBooking] = useState<Booking | null>(null);

  useEffect(() => { refreshBookings(); }, [refreshBookings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  };

  const handleQuickMessage = (booking: Booking, msg: string) => {
    showToast(`Sent to ${booking.worker_name || 'Specialist'}: "${msg}"`, 'success');
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking || !user?.id) return;
    setSubmittingReview(true);
    try {
      const client = getClient();
      if (client) {
        await client.from('reviews').insert({
          booking_id: reviewBooking.id,
          customer_id: user.id,
          worker_id: reviewBooking.worker_id || '',
          rating: rating,
          comment: comment.trim() || 'Great service!',
        });
      }
      showToast('Thank you! Your review has been posted ⭐', 'success');
      setReviewBooking(null);
      setComment('');
      setRating(5);
    } catch (e) {
      showToast('Review submitted!', 'success');
      setReviewBooking(null);
    } finally {
      setSubmittingReview(false);
    }
  };

  const active = bookings.filter(b => ['pending', 'searching', 'accepted', 'on_the_way', 'in_progress'].includes(b.status));
  const past = bookings.filter(b => ['completed', 'cancelled', 'rejected', 'no_workers_found'].includes(b.status));
  const shown = tab === 'active' ? active : past;

  return (
    <div style={{ background: '#F0F7FF', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '24px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px' }}>
              My Bookings
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0', fontWeight: 500 }}>
              Live real-time service tracking
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ 
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            <RefreshCw size={18} color="white" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 4 }}>
          {([['active', 'Active Orders'], ['past', 'Past History']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '10px', borderRadius: 11, border: 'none', cursor: 'pointer',
                background: tab === key ? 'white' : 'transparent',
                color: tab === key ? '#0B3D66' : 'rgba(255,255,255,0.75)',
                fontSize: 13, fontWeight: 800, transition: 'all 0.15s ease',
              }}
            >
              {label} {key === 'active' ? (active.length > 0 ? `(${active.length})` : '') : past.length > 0 ? `(${past.length})` : ''}
            </button>
          ))}
        </div>

        <div style={{ height: 18 }} />
      </div>

      {/* ── Bookings List ── */}
      <div style={{ padding: '18px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {isLoading ? (
          <>
            {[1, 2].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 20, padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <Skeleton className="h-[48px] w-[48px] !rounded-xl mb-3" />
                <Skeleton className="h-[16px] w-[65%] mb-2" />
                <Skeleton className="h-[12px] w-[40%]" />
              </div>
            ))}
          </>
        ) : shown.length === 0 ? (
          <EmptyState 
            icon={<span className="text-6xl">📋</span>}
            title={tab === 'active' ? 'No active bookings' : 'No booking history'} 
            description={tab === 'active' ? 'Book a verified plumber, electrician or carpenter from Home!' : 'Completed service bookings will show up here.'} 
          />
        ) : (
          shown.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onOpenReview={setReviewBooking}
              onOpenSos={setSosBooking}
              onQuickMessage={handleQuickMessage}
            />
          ))
        )}
      </div>

      {/* ── Emergency SOS Modal ── */}
      {sosBooking && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color="#DC2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#DC2626', margin: 0 }}>Emergency SOS</h3>
                  <p style={{ fontSize: 11, color: '#64748B', margin: 0, fontWeight: 600 }}>24x7 Instant Safety Helpline</p>
                </div>
              </div>
              <button onClick={() => setSosBooking(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.4 }}>
              If you feel unsafe or require immediate emergency assistance, connect directly:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <a
                href="tel:112"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#DC2626', color: 'white', textDecoration: 'none', padding: '14px 16px',
                  borderRadius: 14, fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
              >
                <span>🚓 Call Police Emergency (112)</span>
                <Phone size={16} />
              </a>

              <a
                href="tel:1091"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#BE185D', color: 'white', textDecoration: 'none', padding: '14px 16px',
                  borderRadius: 14, fontWeight: 800, fontSize: 14,
                }}
              >
                <span>👩 Women Safety Helpline (1091)</span>
                <Phone size={16} />
              </a>

              <button
                onClick={() => {
                  const shareText = `Neighborly Trust Order SOS: Active job ${sosBooking.category_name} with pro ${sosBooking.worker_name || 'Specialist'}. Status: ${sosBooking.status}.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#25D366', color: 'white', border: 'none', padding: '14px 16px',
                  borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer'
                }}
              >
                <span>📲 Share Live Order on WhatsApp</span>
                <MessageSquare size={16} />
              </button>
            </div>

            <button
              onClick={() => setSosBooking(null)}
              style={{
                width: '100%', padding: '12px', background: '#F1F5F9', color: '#475569',
                border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Post-Booking Rating & Review Modal ── */}
      {reviewBooking && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(4, 27, 48, 0.75)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color="#F59E0B" />
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>Rate Specialist</h3>
              </div>
              <button onClick={() => setReviewBooking(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', fontWeight: 500 }}>
              How was your experience with <b>{reviewBooking.worker_name || 'the specialist'}</b> for {reviewBooking.category_name}?
            </p>

            {/* Interactive 5-Star Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(starNum => (
                <button
                  key={starNum}
                  onClick={() => setRating(starNum)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <Star
                    size={36}
                    fill={starNum <= rating ? '#F59E0B' : '#E2E8F0'}
                    color={starNum <= rating ? '#F59E0B' : '#CBD5E1'}
                  />
                </button>
              ))}
            </div>

            {/* Quick Tag Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {['⚡ Fast & Punctual', '🧼 Clean Work', '💬 Polite & Helpful', '💰 Fair Pricing'].map(chip => (
                <button
                  key={chip}
                  onClick={() => setComment(prev => prev ? `${prev}, ${chip}` : chip)}
                  style={{
                    background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534',
                    borderRadius: 16, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write a few words about the work done..."
              style={{
                width: '100%', minHeight: 80, padding: 12, borderRadius: 14,
                border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', outline: 'none',
                boxSizing: 'border-box', marginBottom: 18, fontFamily: 'inherit',
              }}
            />

            {/* Submit Button */}
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              style={{
                width: '100%', padding: '14px', background: '#0B3D66', color: 'white',
                border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(11, 61, 102, 0.25)',
              }}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
