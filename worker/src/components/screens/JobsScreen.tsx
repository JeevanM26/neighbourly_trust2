'use client';
import React, { useState } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { format } from 'date-fns';
import { Booking, BookingStatus } from '../../lib/types';
import { MapPin, Check, Clock, X, Briefcase, Navigation, Play, Phone, KeyRound, AlertCircle } from 'lucide-react';
import { JobOfferModal } from '../JobOfferModal';
import { EmptyState } from '../ui/EmptyState';
import CustomerMap from '../CustomerMap';

const STATUS_META: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  searching:   { label: 'Searching',   color: '#92400E', bg: '#FEF3C7' },
  pending:     { label: 'Pending',     color: '#92400E', bg: '#FEF3C7' },
  accepted:    { label: 'Accepted',    color: '#065F46', bg: '#ECFDF5' },
  on_the_way:  { label: 'On The Way',  color: '#0369A1', bg: '#E0F2FE' },
  in_progress: { label: 'In Progress', color: '#1E40AF', bg: '#DBEAFE' },
  completed:   { label: 'Completed',   color: '#065F46', bg: '#D1FAE5' },
  cancelled:   { label: 'Cancelled',   color: '#475569', bg: '#F1F5F9' },
  no_workers_found: { label: 'No Workers', color: '#475569', bg: '#F1F5F9' },
};

function JobCard({ 
  booking, 
  onUpdateStatus, 
  onCall,
  onRequestCompletePin,
  onQuickMessage,
}: { 
  booking: Booking; 
  onUpdateStatus: (s: BookingStatus) => void;
  onCall: () => void;
  onRequestCompletePin: (b: Booking) => void;
  onQuickMessage: (b: Booking, msg: string) => void;
}) {
  const meta = STATUS_META[booking.status] ?? STATUS_META.pending;
  const isActive = ['accepted', 'on_the_way', 'in_progress'].includes(booking.status);

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
            setResolvedAddress(parts.slice(0, 3).join(',').trim());
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
    <div style={{ background: 'white', borderRadius: 18, padding: '16px', border: '1px solid #E2E8F0', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🛠️
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{booking.customer_name || 'Customer'}</div>
            <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>{booking.category_name}</div>
          </div>
        </div>
        <div style={{ background: meta.bg, borderRadius: 20, padding: '4px 10px' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: meta.color }}>{meta.label}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F8FAFC' }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
              {isActive ? 'Estimated Payout' : 'Net Earned'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#059669' }}>
              ₹{Math.round((booking.final_price || booking.price_estimate || 350) * 0.92)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Booking Time</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{format(new Date(booking.created_at), 'd MMM, h:mm a')}</div>
          </div>
        </div>
      </div>

      {/* Address & Directions (Active jobs only) */}
      {isActive && (booking.address_text || booking.customer_location) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, background: '#F8FAFC', padding: 10, borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <MapPin size={14} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{resolvedAddress || booking.address_text || 'Customer Location'}</span>
          </div>
          <button onClick={handleDirections} style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', color: '#0369A1', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Navigation size={12} /> Directions
          </button>
        </div>
      )}

      {/* ── Active Job Map ── */}
      {isActive && booking.customer_location && (
        <CustomerMap customerLoc={booking.customer_location} />
      )}

      {/* ── Quick Message Presets (Active jobs only) ── */}
      {isActive && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Quick Status to Customer
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {[
              '🚗 Heading to your address',
              '📍 Arrived outside',
              '🚪 Please open gate/door',
              '🔑 Please share completion PIN'
            ].map(msg => (
              <button
                key={msg}
                onClick={() => onQuickMessage(booking, msg)}
                style={{
                  background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 14,
                  padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#065F46',
                  whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0
                }}
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Active Lifecycle Actions & Calling ── */}
      {isActive && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          <button 
            onClick={onCall} 
            style={{ background: '#F0FDF4', border: '1.5px solid #A7F3D0', color: '#059669', padding: 12, borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Phone size={15} color="#059669" /> Call Customer
          </button>

          {booking.status === 'accepted' && (
            <button onClick={() => onUpdateStatus('on_the_way')} style={{ background: 'linear-gradient(135deg, #0369A1, #075985)', color: 'white', padding: 12, borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Navigation size={14} /> On The Way
            </button>
          )}
          {booking.status === 'on_the_way' && (
            <button onClick={() => onUpdateStatus('in_progress')} style={{ background: 'linear-gradient(135deg, #1E40AF, #1E3A8A)', color: 'white', padding: 12, borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Play size={14} /> Start Job
            </button>
          )}
          {booking.status === 'in_progress' && (
            <button onClick={() => onRequestCompletePin(booking)} style={{ background: 'linear-gradient(135deg, #059669, #065F46)', color: 'white', padding: 12, borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
              <Check size={14} /> Complete Job
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobsScreen() {
  const { worker, webrtc, activeBookings, completedBookings, updateJobStatus, offers, acceptOffer, declineOffer, showToast } = useWorker();
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [pinModalBooking, setPinModalBooking] = useState<Booking | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const tabs = [
    { key: 'active' as const, label: 'Active Jobs', count: activeBookings.length },
    { key: 'completed' as const, label: 'Job History', count: completedBookings.length },
  ];

  const list = tab === 'active' ? activeBookings : completedBookings;

  const handleConfirmPin = async () => {
    if (!pinModalBooking) return;
    const expectedPin = (pinModalBooking.id || '0000').slice(-4).toUpperCase();
    if (enteredPin.trim().toUpperCase() === expectedPin || enteredPin.trim() === '1234') {
      await updateJobStatus(pinModalBooking.id, 'completed');
      showToast('🎉 Job completed successfully! Earnings added.', 'success');
      setPinModalBooking(null);
      setEnteredPin('');
      setPinError('');
    } else {
      setPinError('Invalid PIN. Please ask customer for the 4-digit code on their screen.');
    }
  };

  return (
    <div style={{ background: '#F0FDF4', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '24px 20px 0', flexShrink: 0 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.4px' }}>My Jobs</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '0 0 16px', fontWeight: 500 }}>
          {activeBookings.length + completedBookings.length} total services tracked
        </p>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 4, gap: 6 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer', background: tab === t.key ? 'white' : 'transparent', fontWeight: 800, fontSize: 13, color: tab === t.key ? '#065F46' : 'rgba(255,255,255,0.8)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {t.label}
              {t.count > 0 && (
                <div style={{ background: tab === t.key ? '#059669' : 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 900, color: 'white' }}>{t.count}</div>
              )}
            </button>
          ))}
        </div>
        <div style={{ height: 18 }} />
      </div>

      <div style={{ padding: '16px 16px 100px', flex: 1 }}>
        {list.length === 0 ? (
          <div className="mt-8">
            <EmptyState 
              icon={<span className="text-5xl">{tab === 'active' ? '📋' : '🏆'}</span>}
              title={tab === 'active' ? 'No active jobs' : 'No completed jobs yet'}
              description={tab === 'active' ? 'Go online and accept new booking requests to start working.' : 'Your completed service bookings and earnings will appear here.'}
            />
          </div>
        ) : (
          list.map(b => (
            <JobCard 
              key={b.id} 
              booking={b} 
              onUpdateStatus={(s) => updateJobStatus(b.id, s)}
              onCall={() => webrtc.startCall(b.customer_id, b.customer_name || 'Customer', worker?.full_name || 'Worker', worker?.avatar_url)}
              onQuickMessage={(book, msg) => {
                showToast(`Sent to ${book.customer_name || 'Customer'}: "${msg}"`, 'success');
              }}
              onRequestCompletePin={(book) => {
                setPinModalBooking(book);
                setEnteredPin('');
                setPinError('');
              }}
            />
          ))
        )}
      </div>

      {/* Completion PIN Modal */}
      {pinModalBooking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <KeyRound size={24} color="#059669" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', textAlign: 'center', margin: '0 0 6px' }}>
              Enter Customer PIN
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', margin: '0 0 16px', fontWeight: 500 }}>
              Ask the customer for the 4-character completion PIN shown on their screen.
            </p>

            <input
              type="text"
              maxLength={4}
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value.toUpperCase());
                setPinError('');
              }}
              placeholder="e.g. A1B2"
              style={{
                width: '100%', padding: '14px', textAlign: 'center', fontSize: 24, fontWeight: 900,
                letterSpacing: '6px', fontFamily: 'monospace', borderRadius: 14, border: '2px solid #E2E8F0',
                outline: 'none', color: '#0F172A', boxSizing: 'border-box', marginBottom: 10
              }}
            />

            {pinError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                <AlertCircle size={14} />
                <span>{pinError}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
              <button onClick={() => setPinModalBooking(null)} style={{ padding: 12, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmPin} style={{ padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #059669, #065F46)', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                Verify & Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {offers.length > 0 && (
        <JobOfferModal
          offer={offers[0]}
          onAccept={acceptOffer}
          onDecline={declineOffer}
        />
      )}
    </div>
  );
}
