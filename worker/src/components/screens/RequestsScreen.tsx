'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { BookingOffer } from '../../lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Phone, MapPin, Clock, Check, X, IndianRupee, RefreshCw, Bell, BellOff } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import CustomerMap from '../CustomerMap';

// ── Countdown Timer for each booking ──
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

// ── Single Request Card ──
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
  const customerPhone = offer.booking?.customer_phone;
  const customerId = offer.booking?.customer_id || '';
  const addressText = offer.booking?.address_text;
  const gross = offer.booking?.price_estimate || offer.booking?.final_price || 0;
  const commission = gross * 0.08;
  const net = gross - commission;

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '18px', border: '2px solid #D1FAE5', boxShadow: '0 4px 20px rgba(5,150,105,0.08)', marginBottom: 14, animation: 'bounceIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {EMOJI[categoryName] ?? '🔧'}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>{categoryName}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                {formatDistanceToNow(new Date(offer.offered_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
        <BookingTimer expiresAt={expiresAt} onExpire={handleExpire} />
      </div>

      {/* Customer Info */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #065F46)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'white' }}>
            {customerName[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{customerName}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>Verified customer</div>
          </div>
          {customerPhone && (
            <button 
              onClick={() => webrtc.startCall(customerId, customerName, worker?.full_name || 'Worker', worker?.avatar_url)}
              style={{ marginLeft: 'auto', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
            >
              <Phone size={12} color="#059669" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Call</span>
            </button>
          )}
        </div>
        {addressText && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <MapPin size={12} color="#94A3B8" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500, lineHeight: 1.5 }}>{addressText}</span>
          </div>
        )}
      </div>

      {/* Earnings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Gross', value: `₹${gross}`, color: '#0F172A' },
          { label: 'Commission (8%)', value: `-₹${commission}`, color: '#EF4444' },
          { label: 'You Earn', value: `₹${net}`, color: '#059669' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: 10, padding: '8px 4px' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={onDecline} style={{ padding: '13px', borderRadius: 12, background: 'white', border: '2px solid #FECACA', color: '#EF4444', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <X size={16} /> Decline
        </button>
        <button onClick={onAccept} style={{ padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #059669, #065F46)', border: 'none', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
          <Check size={16} /> Accept
        </button>
      </div>
    </div>
  );
}

export default function RequestsScreen() {
  const { offers, activeBookings, acceptOffer, declineOffer, updateJobStatus, isLoading, refreshBookings, isOnline, webrtc, worker } = useWorker();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => { setRefreshing(true); await refreshBookings(); setRefreshing(false); };

  return (
    <div style={{ background: '#F0FDF4', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '20px 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.4px' }}>Booking Requests</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '4px 0 0', fontWeight: 500 }}>
              {offers.length > 0 ? `${offers.length} pending · respond before timer runs out` : 'No pending requests right now'}
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw size={16} color="white" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        {/* Pending */}
        {offers.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 }}>
              ⏰ Respond within 90 seconds
            </p>
            {offers.map(o => (
              <RequestCard key={o.id} offer={o} onAccept={() => acceptOffer(o.id, o.booking_id)} onDecline={() => declineOffer(o.id, o.booking_id)} />
            ))}
          </>
        )}

        {/* Active */}
        {activeBookings.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12, marginTop: offers.length > 0 ? 8 : 0 }}>
              🟢 Active Jobs
            </p>
            {activeBookings.map(b => (
              <div key={b.id} style={{ background: 'white', borderRadius: 16, padding: '16px', border: '2px solid #A7F3D0', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{b.customer_name}</div>
                    <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>{b.category_name} · ₹{(b.final_price || b.price_estimate || 0) * 0.92} net</div>
                  </div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '4px 10px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>In Progress</span>
                  </div>
                </div>
                {b.address_text && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 10 }}>
                    <MapPin size={12} color="#94A3B8" style={{ marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{b.address_text}</span>
                  </div>
                )}
                {b.customer_location && ['accepted', 'on_the_way', 'in_progress'].includes(b.status) && (
                  <CustomerMap customerLoc={b.customer_location} />
                )}
                {b.customer_phone && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <button onClick={() => webrtc.startCall(b.customer_id, b.customer_name || 'Customer', worker?.full_name || 'Worker', worker?.avatar_url)} style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                      <Phone size={14} color="#059669" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Call Customer</span>
                    </button>
                    <button onClick={() => updateJobStatus(b.id, 'completed')} style={{ background: 'linear-gradient(135deg, #059669, #065F46)', border: 'none', borderRadius: 10, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                      <Check size={14} color="white" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Mark Done</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Empty State */}
        {offers.length === 0 && activeBookings.length === 0 && (
          <div className="mt-8">
            <EmptyState 
              icon={<span className="text-5xl">{isOnline ? '📭' : '😴'}</span>}
              title={isOnline ? 'All caught up!' : 'You\'re offline'}
              description={isOnline ? 'No pending requests right now. New requests will appear here instantly.' : 'Go online from the Dashboard to start receiving booking requests.'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
