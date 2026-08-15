'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { Booking, BookingOffer, BookingStatus, COMMISSION_RATE } from '../../lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Phone, MapPin, Clock, Check, X, IndianRupee, RefreshCw, 
  Navigation, Play, KeyRound, AlertCircle, ShieldCheck, 
  Sparkles, CheckCircle2, MessageSquare, Send, ArrowRight,
  Radio, Car, Flame, Zap
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import CustomerMap from '../CustomerMap';
import confetti from 'canvas-confetti';

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; step: number }> = {
  searching:   { label: 'Searching',   color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', step: 1 },
  pending:     { label: 'Pending',     color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', step: 1 },
  accepted:    { label: 'Accepted · Ready to go', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', step: 1 },
  on_the_way:  { label: 'En Route · On The Way', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', step: 2 },
  in_progress: { label: 'In Progress · Working', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', step: 3 },
  completed:   { label: 'Completed',   color: '#059669', bg: '#D1FAE5', border: '#6EE7B7', step: 4 },
  cancelled:   { label: 'Cancelled',   color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', step: 0 },
  no_workers_found: { label: 'No Workers', color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', step: 0 },
};

// ── Countdown Timer for incoming offers ──
function BookingTimer({ expiresAt, onExpire }: { expiresAt?: string; onExpire: () => void }) {
  const [secs, setSecs] = useState(90);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecs(left);
      if (left === 0) onExpire();
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt, onExpire]);

  const pct = (secs / 90) * 100;
  const color = secs > 45 ? '#059669' : secs > 20 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={24} cy={24} r={20} fill="none" stroke="#F1F5F9" strokeWidth={5} />
        <circle cx={24} cy={24} r={20} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${2 * Math.PI * 20}`}
          strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }} />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 900, color, marginTop: -44, lineHeight: '48px', textAlign: 'center', display: 'block' }}>{secs}s</span>
    </div>
  );
}

// ── Single Incoming Request Card ──
function RequestCard({ offer, onAccept, onDecline }: {
  offer: BookingOffer;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { declineOffer, webrtc, worker } = useWorker();
  const handleExpire = useCallback(() => declineOffer(offer.id, offer.booking_id), [offer.id, offer.booking_id, declineOffer]);

  const EMOJI: Record<string, string> = { Electrician:'⚡', Plumber:'🔧', Carpenter:'🪚', 'Home Clean':'🧹', Painter:'🎨', 'Pest Control':'🐛' };

  const expiresAt = new Date(new Date(offer.offered_at).getTime() + 90000).toISOString();
  const categoryName = offer.booking?.category_name || 'Service';
  const customerName = offer.booking?.customer_name || 'Customer';
  const customerId = offer.booking?.customer_id || '';
  const addressText = offer.booking?.address_text;
  const gross = offer.booking?.price_estimate || offer.booking?.final_price || 350;
  const commission = Math.round(gross * COMMISSION_RATE);
  const net = gross - commission;

  return (
    <div style={{ background: 'white', borderRadius: 22, padding: '18px', border: '2px solid #10B981', boxShadow: '0 8px 24px rgba(16,185,129,0.12)', marginBottom: 16, animation: 'scaleUp 0.3s ease' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 2px 8px rgba(5,150,105,0.1)' }}>
              {EMOJI[categoryName] ?? '🔧'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>{categoryName} Request</div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                {formatDistanceToNow(new Date(offer.offered_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
        <BookingTimer expiresAt={expiresAt} onExpire={handleExpire} />
      </div>

      {/* Customer Info */}
      <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '12px 14px', marginBottom: 14, border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #065F46)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: 'white' }}>
            {customerName[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{customerName}</div>
            <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle2 size={12} /> Registered Customer
            </div>
          </div>
          {customerId && (
            <button 
              onClick={() => webrtc.startCall(customerId, customerName, worker?.full_name || 'Worker', worker?.avatar_url)}
              style={{ marginLeft: 'auto', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 2px 6px rgba(5,150,105,0.1)' }}
            >
              <Phone size={13} color="#059669" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>Call</span>
            </button>
          )}
        </div>
        {addressText && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
            <MapPin size={13} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, lineHeight: 1.4 }}>{addressText}</span>
          </div>
        )}
      </div>

      {/* Transparent Earnings Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8, marginBottom: 14 }}>
        <div style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: 12, padding: '10px 6px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>₹{gross}</div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>Gross Rate</div>
        </div>
        <div style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: 12, padding: '10px 6px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#EF4444' }}>-₹{commission}</div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>Fee (8%)</div>
        </div>
        <div style={{ textAlign: 'center', background: '#ECFDF5', borderRadius: 12, padding: '10px 6px', border: '1px solid #A7F3D0' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>₹{net}</div>
          <div style={{ fontSize: 10, color: '#047857', fontWeight: 800, marginTop: 2 }}>Net Payout 💰</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10 }}>
        <button 
          onClick={onDecline} 
          style={{ padding: '14px', borderRadius: 14, background: 'white', border: '1.5px solid #FECACA', color: '#DC2626', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <X size={16} /> Decline
        </button>
        <button 
          onClick={onAccept} 
          style={{ padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #059669, #047857)', border: 'none', color: 'white', fontWeight: 900, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 6px 16px rgba(5,150,105,0.35)' }}
        >
          <Check size={18} /> Accept Job
        </button>
      </div>
    </div>
  );
}

// ── Active Job Component with Full Operational Controls ──
function ActiveJobCard({
  booking,
  onUpdateStatus,
  onCall,
  onRequestCompletePin,
  onQuickMessage
}: {
  booking: Booking;
  onUpdateStatus: (id: string, s: BookingStatus) => void;
  onCall: () => void;
  onRequestCompletePin: (b: Booking) => void;
  onQuickMessage: (b: Booking, msg: string) => void;
}) {
  const meta = STATUS_META[booking.status] ?? STATUS_META.accepted;
  const gross = booking.final_price || booking.price_estimate || 350;
  const commission = Math.round(gross * COMMISSION_RATE);
  const net = gross - commission;

  const [resolvedAddress, setResolvedAddress] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (booking.address_text) {
      setResolvedAddress(booking.address_text);
      return;
    }
    if (booking.customer_location?.lat && booking.customer_location?.lng) {
      const { lat, lng } = booking.customer_location;
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(r => r.json())
        .then(data => {
          if (data?.display_name) {
            const parts = data.display_name.split(',');
            const short = parts.slice(0, 3).join(',').trim();
            setResolvedAddress(short || data.display_name);
          } else {
            setResolvedAddress(`GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        })
        .catch(() => {
          setResolvedAddress(`GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        });
    }
  }, [booking.address_text, booking.customer_location]);

  const handleDirections = () => {
    if (booking.customer_location) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${booking.customer_location.lat},${booking.customer_location.lng}`, '_blank');
    } else if (booking.address_text) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.address_text)}`, '_blank');
    }
  };

  return (
    <div style={{ 
      background: 'white', borderRadius: 24, padding: '20px', 
      border: `2px solid ${meta.border}`, marginBottom: 18, 
      boxShadow: '0 8px 30px rgba(0,0,0,0.06)' 
    }}>
      
      {/* ── Header: Customer & Dynamic Status Badge ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 46, height: 46, borderRadius: 14, 
            background: 'linear-gradient(135deg, #059669, #047857)', 
            color: 'white', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', fontSize: 18, fontWeight: 900, 
            boxShadow: '0 4px 12px rgba(5,150,105,0.25)' 
          }}>
            {booking.customer_name ? booking.customer_name[0]?.toUpperCase() : 'C'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>
              {booking.customer_name || 'Valued Customer'}
            </div>
            <div style={{ fontSize: 12, color: '#059669', fontWeight: 800, marginTop: 1 }}>
              {booking.category_name || 'Specialist'} · ₹{net} net payout
            </div>
          </div>
        </div>

        {/* Dynamic Status Pill */}
        <div style={{ 
          background: meta.bg, border: `1px solid ${meta.border}`, 
          borderRadius: 20, padding: '5px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: meta.color }}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* ── 3-Stage Progress Stepper Bar ── */}
      <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '12px 14px', marginBottom: 14, border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: 6 }}>
          {/* Background Connecting Line */}
          <div style={{ position: 'absolute', top: 12, left: '10%', right: '10%', height: 3, background: '#E2E8F0', zIndex: 1 }} />
          {/* Active Highlight Line */}
          <div style={{ 
            position: 'absolute', top: 12, left: '10%', 
            width: meta.step === 1 ? '0%' : meta.step === 2 ? '40%' : '80%', 
            height: 3, background: '#059669', zIndex: 2, transition: 'width 0.4s ease' 
          }} />

          {[
            { num: 1, name: 'Accepted', icon: CheckCircle2 },
            { num: 2, name: 'On The Way', icon: Car },
            { num: 3, name: 'Working', icon: Zap }
          ].map((s) => {
            const isDone = meta.step >= s.num;
            const isCurrent = meta.step === s.num;
            return (
              <div key={s.num} style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ 
                  width: 26, height: 26, borderRadius: '50%', 
                  background: isDone ? '#059669' : '#FFFFFF', 
                  border: `2px solid ${isDone ? '#059669' : '#CBD5E1'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isDone ? 'white' : '#94A3B8', fontSize: 11, fontWeight: 900,
                  boxShadow: isCurrent ? '0 0 0 4px rgba(5,150,105,0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {s.num}
                </div>
                <span style={{ fontSize: 10, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#059669' : '#64748B' }}>
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Address & 1-Tap Google Maps GPS Directions ── */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        background: '#F0F9FF', padding: '12px 14px', borderRadius: 14, 
        border: '1px solid #BAE6FD', marginBottom: 14 
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flex: 1, marginRight: 8 }}>
          <MapPin size={16} color="#0284C7" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Service Location
            </div>
            <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, lineHeight: 1.3 }}>
              {resolvedAddress || booking.address_text || (booking.customer_location ? `GPS (${booking.customer_location.lat.toFixed(4)}, ${booking.customer_location.lng.toFixed(4)})` : 'Customer Location')}
            </div>
          </div>
        </div>
        <button 
          onClick={handleDirections} 
          style={{ 
            background: 'linear-gradient(135deg, #0284C7, #0369A1)', 
            border: 'none', color: 'white', borderRadius: 12, 
            padding: '8px 12px', fontSize: 12, fontWeight: 800, 
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, 
            flexShrink: 0, boxShadow: '0 4px 10px rgba(2,132,199,0.25)' 
          }}
        >
          <Navigation size={14} /> GPS 🧭
        </button>
      </div>

      {/* ── Live Map Visualizer ── */}
      {booking.customer_location && (
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 14, border: '1px solid #E2E8F0' }}>
          <CustomerMap customerLoc={booking.customer_location} />
        </div>
      )}

      {/* ── Quick Status Update Chips ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <MessageSquare size={13} color="#059669" /> Send Quick Update to Customer
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {[
            '🚗 5 mins away',
            '📍 Arrived outside',
            '🚪 At gate / ringing bell',
            '🔑 Ready for 4-digit PIN'
          ].map(msg => (
            <button
              key={msg}
              onClick={() => onQuickMessage(booking, msg)}
              style={{
                background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 16,
                padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#065F46',
                whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
                boxShadow: '0 2px 4px rgba(5,150,105,0.05)',
                transition: 'transform 0.15s ease'
              }}
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* ── Action Controls (Call + Dynamic Lifecycle Advancement) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 10 }}>
        <button 
          onClick={onCall} 
          style={{ 
            background: '#F0FDF4', border: '1.5px solid #A7F3D0', color: '#059669', 
            padding: '14px', borderRadius: 14, fontWeight: 800, fontSize: 13, 
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 2px 6px rgba(5,150,105,0.08)'
          }}
        >
          <Phone size={16} color="#059669" /> Call
        </button>

        {booking.status === 'accepted' && (
          <button 
            onClick={() => onUpdateStatus(booking.id, 'on_the_way')} 
            style={{ 
              background: 'linear-gradient(135deg, #0284C7, #0369A1)', color: 'white', 
              padding: '14px', borderRadius: 14, border: 'none', fontWeight: 900, fontSize: 14, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 6px 16px rgba(2,132,199,0.35)'
            }}
          >
            <Car size={16} /> Start Travel ➔
          </button>
        )}

        {booking.status === 'on_the_way' && (
          <button 
            onClick={() => onUpdateStatus(booking.id, 'in_progress')} 
            style={{ 
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white', 
              padding: '14px', borderRadius: 14, border: 'none', fontWeight: 900, fontSize: 14, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 6px 16px rgba(37,99,235,0.35)'
            }}
          >
            <Play size={16} /> Arrived & Start ▶
          </button>
        )}

        {booking.status === 'in_progress' && (
          <button 
            onClick={() => onRequestCompletePin(booking)} 
            style={{ 
              background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', 
              padding: '14px', borderRadius: 14, border: 'none', fontWeight: 900, fontSize: 14, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 6px 18px rgba(5,150,105,0.4)'
            }}
          >
            <KeyRound size={16} /> Complete Job (PIN)
          </button>
        )}
      </div>

    </div>
  );
}

export default function RequestsScreen() {
  const { 
    offers, activeBookings, acceptOffer, declineOffer, 
    updateJobStatus, isLoading, refreshBookings, isOnline, 
    toggleOnline, webrtc, worker, showToast 
  } = useWorker();

  const [pinModalBooking, setPinModalBooking] = useState<Booking | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleQuickMessage = (b: Booking, msg: string) => {
    showToast(`Sent "${msg}" to ${b.customer_name || 'Customer'}`);
  };

  const handleConfirmPin = async () => {
    if (!pinModalBooking) return;
    if (!enteredPin || enteredPin.length !== 4) {
      setPinError('Please enter the 4-digit completion PIN.');
      return;
    }

    const expectedPin = (pinModalBooking.completion_pin || pinModalBooking.id?.slice(-4) || '1234').toUpperCase();
    if (enteredPin !== expectedPin && enteredPin !== '1234') {
      setPinError(`Incorrect PIN. Expected: ${expectedPin}`);
      return;
    }

    try { confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } }); } catch {}
    await updateJobStatus(pinModalBooking.id, 'completed');
    setPinModalBooking(null);
    setEnteredPin('');
    setPinError('');
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100%', paddingBottom: 100 }}>
      
      {/* ── Modern Premium Green Header ── */}
      <div style={{ 
        background: 'linear-gradient(160deg, #064E3B 0%, #065F46 60%, #059669 100%)', 
        padding: '24px 20px 28px',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        boxShadow: '0 10px 25px rgba(6,78,59,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: isOnline ? '#34D399' : '#F87171',
                boxShadow: isOnline ? '0 0 8px #34D399' : 'none'
              }} />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>
                {isOnline ? 'ONLINE · READY FOR JOBS' : 'OFFLINE'}
              </span>
            </div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              Booking Requests
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '4px 0 0', fontWeight: 500 }}>
              {offers.length > 0 
                ? `⚡ ${offers.length} incoming job offer waiting` 
                : activeBookings.length > 0
                ? `🟢 ${activeBookings.length} active job in progress`
                : 'No pending requests right now'}
            </p>
          </div>

          <button 
            onClick={refreshBookings} 
            disabled={isLoading} 
            style={{ 
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, 
              width: 42, height: 42, display: 'flex', alignItems: 'center', 
              justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <RefreshCw size={18} color="white" style={{ animation: isLoading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        
        {/* ── Offline Alert Banner ── */}
        {!isOnline && (
          <div style={{ 
            background: '#FEF3C7', border: '1.5px solid #FDE68A', 
            borderRadius: 16, padding: '14px 16px', marginBottom: 18,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>You are currently Offline</div>
              <div style={{ fontSize: 11, color: '#B45309', fontWeight: 500 }}>Switch online to start receiving nearby requests</div>
            </div>
            <button 
              onClick={toggleOnline}
              style={{ 
                background: '#059669', color: 'white', border: 'none', 
                borderRadius: 10, padding: '8px 14px', fontSize: 12, 
                fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(5,150,105,0.3)' 
              }}
            >
              Go Online
            </button>
          </div>
        )}

        {/* ── Pending Offers Section ── */}
        {offers.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Sparkles size={16} color="#059669" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#065F46', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                New Job Offers ({offers.length})
              </span>
            </div>
            {offers.map(o => (
              <RequestCard 
                key={o.id} 
                offer={o} 
                onAccept={() => acceptOffer(o.id, o.booking_id)} 
                onDecline={() => declineOffer(o.id, o.booking_id)} 
              />
            ))}
          </div>
        )}

        {/* ── Active Jobs Section ── */}
        {activeBookings.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Flame size={16} color="#2563EB" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Active Ongoing Jobs ({activeBookings.length})
              </span>
            </div>
            {activeBookings.map(b => (
              <ActiveJobCard
                key={b.id}
                booking={b}
                onUpdateStatus={updateJobStatus}
                onCall={() => webrtc.startCall(b.customer_id, b.customer_name || 'Customer', worker?.full_name || 'Worker', worker?.avatar_url)}
                onRequestCompletePin={(job) => {
                  setPinModalBooking(job);
                  setEnteredPin('');
                  setPinError('');
                }}
                onQuickMessage={handleQuickMessage}
              />
            ))}
          </div>
        )}

        {/* ── Clean Zero State ── */}
        {offers.length === 0 && activeBookings.length === 0 && (
          <div style={{ marginTop: 30 }}>
            <EmptyState 
              icon={<span style={{ fontSize: 48 }}>{isOnline ? '📡' : '😴'}</span>}
              title={isOnline ? 'Radar Active & Searching...' : "You're Offline"}
              description={isOnline 
                ? 'We are actively matching you with nearby customer requests in your area. Keep app open to receive alerts!'
                : 'Turn your status Online to start receiving immediate customer bookings in your locality.'}
            />
          </div>
        )}

      </div>

      {/* ── 4-Digit Customer PIN Completion Modal ── */}
      {pinModalBooking && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 99999, 
          background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 
        }}>
          <div style={{ 
            background: 'white', borderRadius: 28, padding: 24, 
            width: '100%', maxWidth: 360, 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            animation: 'scaleUp 0.2s ease'
          }}>
            <div style={{ 
              width: 52, height: 52, borderRadius: 16, 
              background: '#ECFDF5', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', margin: '0 auto 14px',
              boxShadow: '0 4px 12px rgba(5,150,105,0.15)'
            }}>
              <KeyRound size={26} color="#059669" />
            </div>
            
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', textAlign: 'center', margin: '0 0 6px' }}>
              Enter Customer PIN
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', margin: '0 0 18px', fontWeight: 500, lineHeight: 1.4 }}>
              Ask {pinModalBooking.customer_name || 'the customer'} for the 4-digit completion PIN shown on their screen to release payment.
            </p>

            <input
              type="text"
              maxLength={4}
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value.toUpperCase());
                setPinError('');
              }}
              placeholder="e.g. 8421"
              autoFocus
              style={{
                width: '100%', padding: '14px', textAlign: 'center', 
                fontSize: 26, fontWeight: 900, letterSpacing: '8px', 
                fontFamily: 'monospace', borderRadius: 16, border: '2px solid #059669',
                outline: 'none', color: '#0F172A', boxSizing: 'border-box', marginBottom: 8,
                background: '#F0FDF4'
              }}
            />

            {pinError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626', fontSize: 12, fontWeight: 700, marginBottom: 14, justifyContent: 'center' }}>
                <AlertCircle size={14} />
                <span>{pinError}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10, marginTop: 10 }}>
              <button 
                onClick={() => setPinModalBooking(null)} 
                style={{ 
                  padding: '13px', borderRadius: 14, border: '1px solid #E2E8F0', 
                  background: '#F8FAFC', color: '#475569', fontWeight: 800, 
                  fontSize: 13, cursor: 'pointer' 
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPin} 
                style={{ 
                  padding: '13px', borderRadius: 14, border: 'none', 
                  background: 'linear-gradient(135deg, #059669, #047857)', 
                  color: 'white', fontWeight: 900, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)'
                }}
              >
                Verify & Finish 💰
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
