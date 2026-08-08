import React, { useEffect, useState } from 'react';
import { BookingOffer } from '../lib/types';
import { Clock, MapPin, X } from 'lucide-react';

interface JobOfferModalProps {
  offer: BookingOffer;
  onAccept: (offerId: string, bookingId: string) => void;
  onDecline: (offerId: string, bookingId: string, status?: 'declined' | 'timed_out') => void;
}

export function JobOfferModal({ offer, onAccept, onDecline }: JobOfferModalProps) {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline(offer.id, offer.booking_id, 'timed_out');
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, offer, onDecline]);

  // Ensure notification sound is played when modal mounts
  useEffect(() => {
    try {
      const audio = new Audio('/notification.mp3'); // Fallback to generic if none exists
      audio.play().catch(e => console.log('Audio autoplay blocked', e));
    } catch (e) {}
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white', borderRadius: 24, width: '100%', maxWidth: 400,
        overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header with Timer */}
        <div style={{ background: '#FEF3C7', padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#92400E', margin: '0 0 8px' }}>New Job Offer!</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#B45309', fontWeight: 700 }}>
            <Clock size={16} />
            <span style={{ fontSize: 18 }}>{timeLeft}s</span>
          </div>
          
          {/* Progress bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: 4, background: '#F59E0B', width: `${(timeLeft / 30) * 100}%`, transition: 'width 1s linear' }} />
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Service Requested</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
              {offer.booking?.category_name || 'Service Job'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24, background: '#F8FAFC', padding: 16, borderRadius: 16 }}>
            <MapPin color="#059669" style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Location</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>
                {offer.booking?.address_text || 'Customer Location (GPS)'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => onDecline(offer.id, offer.booking_id)}
              style={{
                flex: 1, padding: 16, borderRadius: 16, background: '#F1F5F9', border: 'none',
                color: '#475569', fontSize: 16, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Decline
            </button>
            <button
              onClick={() => onAccept(offer.id, offer.booking_id)}
              style={{
                flex: 2, padding: 16, borderRadius: 16, background: 'linear-gradient(135deg, #059669, #047857)', border: 'none',
                color: 'white', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
              }}
            >
              Accept Job
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
