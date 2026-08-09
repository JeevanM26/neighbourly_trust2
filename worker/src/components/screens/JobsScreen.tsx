'use client';
import React, { useState } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { format } from 'date-fns';
import { Booking, BookingStatus } from '../../lib/types';
import { MapPin, Check, Clock, X, Briefcase, Navigation, Play } from 'lucide-react';
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

function JobCard({ booking, onUpdateStatus }: { booking: Booking; onUpdateStatus: (s: BookingStatus) => void }) {
  const meta = STATUS_META[booking.status] ?? STATUS_META.pending;

  const handleDirections = () => {
    if (booking.customer_location) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${booking.customer_location.lat},${booking.customer_location.lng}`, '_blank');
    } else if (booking.address_text) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.address_text)}`, '_blank');
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #F1F5F9', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🛠️
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{booking.customer_name || 'Customer'}</div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{booking.category_name}</div>
          </div>
        </div>
        <div style={{ background: meta.bg, borderRadius: 20, padding: '4px 10px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>{meta.label}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F8FAFC' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Est. Earnings</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#059669' }}>
              ₹{booking.final_price || booking.price_estimate ? Math.round((booking.final_price || booking.price_estimate || 0) * 0.92) : '--'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Date</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{format(new Date(booking.created_at), 'd MMM, h:mm a')}</div>
          </div>
        </div>
      </div>

      {(booking.address_text || booking.customer_location) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, background: '#F8FAFC', padding: 10, borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <MapPin size={14} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{booking.address_text || 'GPS Location'}</span>
          </div>
          <button onClick={handleDirections} style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', color: '#0369A1', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Navigation size={12} /> Directions
          </button>
        </div>
      )}

      {/* ── Active Job Map ── */}
      {booking.customer_location && ['accepted', 'on_the_way', 'in_progress'].includes(booking.status) && (
        <CustomerMap customerLoc={booking.customer_location} />
      )}

      {/* ── Active Lifecycle Actions ── */}
      {booking.status === 'accepted' && (
        <button onClick={() => onUpdateStatus('on_the_way')} style={{ width: '100%', marginTop: 12, background: 'linear-gradient(135deg, #0369A1, #075985)', color: 'white', padding: 12, borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Navigation size={16} /> Arrived
        </button>
      )}
      {booking.status === 'on_the_way' && (
        <button onClick={() => onUpdateStatus('in_progress')} style={{ width: '100%', marginTop: 12, background: 'linear-gradient(135deg, #1E40AF, #1E3A8A)', color: 'white', padding: 12, borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Play size={16} /> Start Job
        </button>
      )}
      {booking.status === 'in_progress' && (
        <button onClick={() => onUpdateStatus('completed')} style={{ width: '100%', marginTop: 12, background: 'linear-gradient(135deg, #059669, #065F46)', color: 'white', padding: 12, borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Check size={16} /> Complete Job
        </button>
      )}
    </div>
  );
}

export default function JobsScreen() {
  const { activeBookings, completedBookings, updateJobStatus, offers, acceptOffer, declineOffer } = useWorker();
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const tabs = [
    { key: 'active' as const, label: 'Active', count: activeBookings.length },
    { key: 'completed' as const, label: 'History', count: completedBookings.length },
  ];

  const list = tab === 'active' ? activeBookings : completedBookings;

  return (
    <div style={{ background: '#F0FDF4', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '20px 20px 0' }}>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.4px' }}>My Jobs</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 16px', fontWeight: 500 }}>
          {activeBookings.length + completedBookings.length} total bookings
        </p>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, gap: 4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: tab === t.key ? 'white' : 'transparent', fontWeight: 800, fontSize: 12, color: tab === t.key ? '#059669' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {t.label}
              {t.count > 0 && (
                <div style={{ background: tab === t.key ? '#059669' : 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 900, color: 'white' }}>{t.count}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        {list.length === 0 ? (
          <div className="mt-8">
            <EmptyState 
              icon={<span className="text-5xl">{tab === 'active' ? '📋' : '🏆'}</span>}
              title={tab === 'active' ? 'No active jobs' : 'No completed jobs yet'}
              description={tab === 'active' ? 'Wait for new job requests while online.' : 'Completed jobs will appear here.'}
            />
          </div>
        ) : (
          list.map(b => <JobCard key={b.id} booking={b} onUpdateStatus={(s) => updateJobStatus(b.id, s)} />)
        )}
      </div>

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
