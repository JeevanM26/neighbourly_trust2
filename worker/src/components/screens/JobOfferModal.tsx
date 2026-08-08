import React, { useState, useEffect } from 'react';
import { BookingOffer } from '../../lib/types';
import { useWorker } from '../../context/WorkerContext';
import { MapPin, IndianRupee, Clock, Check, X } from 'lucide-react';

interface Props {
  offer: BookingOffer;
}

export default function JobOfferModal({ offer }: Props) {
  const { acceptOffer, declineOffer } = useWorker();
  const [timeLeft, setTimeLeft] = useState(30);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    // 30 seconds countdown from offered_at, or just simple 30s countdown on mount
    // Best is to use the difference between now and offered_at, bounded by 0-30.
    const start = new Date(offer.offered_at).getTime();
    const tick = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, 30 - Math.floor(elapsed));
      setTimeLeft(remaining);

      if (remaining === 0 && !responding) {
        setResponding(true);
        declineOffer(offer.id, offer.booking_id);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [offer, responding, declineOffer]);

  const handleAccept = async () => {
    if (responding) return;
    setResponding(true);
    await acceptOffer(offer.id, offer.booking_id);
  };

  const handleDecline = async () => {
    if (responding) return;
    setResponding(true);
    await declineOffer(offer.id, offer.booking_id);
  };

  const booking = offer.booking;
  if (!booking) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 28, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        
        {/* Header / Countdown */}
        <div style={{ background: 'linear-gradient(135deg, #059669, #065F46)', padding: '30px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)', animation: 'shimmer 2s infinite' }} />
          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px' }}>New Job Request</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '6px 16px', borderRadius: 20 }}>
            <Clock size={16} color="#FCD34D" />
            <span style={{ color: '#FCD34D', fontSize: 16, fontWeight: 800 }}>{timeLeft}s</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: '#64748B', fontWeight: 600, margin: '0 0 4px' }}>{booking.category_name}</p>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>{booking.customer_name || 'Customer'}</h3>
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <MapPin size={18} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>{booking.address_text || 'Nearby Location'}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <IndianRupee size={18} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Earnings</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#065F46', margin: 0 }}>
                  {booking.price_estimate ? `₹${Math.round(booking.price_estimate * 0.92)}` : 'Standard Rate'}
                </p>
              </div>
            </div>

            {booking.description && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 4, paddingTop: 12, borderTop: '1px dashed #E2E8F0' }}>
                <p style={{ fontSize: 13, color: '#475569', margin: 0, fontStyle: 'italic' }}>"{booking.description}"</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={handleDecline} 
              disabled={responding}
              style={{ flex: 1, padding: 16, background: '#F1F5F9', color: '#64748B', borderRadius: 16, border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <X size={18} /> Decline
            </button>
            <button 
              onClick={handleAccept}
              disabled={responding}
              style={{ flex: 1, padding: 16, background: 'linear-gradient(135deg, #059669, #065F46)', color: 'white', borderRadius: 16, border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 16px rgba(5,150,105,0.3)' }}
            >
              <Check size={18} /> Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
