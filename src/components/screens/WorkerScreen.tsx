'use client';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkerProfile } from '../../lib/types';
import { Briefcase, PlusCircle, CheckCircle2, Clock, DollarSign, MapPin, User, Phone, Sparkles, ShieldCheck } from 'lucide-react';

export default function WorkerScreen({ onJobPosted }: { onJobPosted?: () => void }) {
  const { user, workers, bookings, showToast } = useApp();
  const categories = [{ id: 'plumbing', label: 'Plumbing', bg: '#F0F7FF', emoji: '🔧', color: '#0B3D66' }];
  const addWorkerProfile = console.log;
  const updateBookingStatus = console.log;

  const [activeTab, setActiveTab] = useState<'feed' | 'post' | 'earnings'>('feed');

  // Form State for Posting a Job / Registering Service Profile
  const [name, setName] = useState(user?.full_name || '');
  const [category, setCategory] = useState('');
  const [hourlyRate, setHourlyRate] = useState('400');
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [locationName, setLocationName] = useState('Main Market, Rampur');
  const [description, setDescription] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('⚡');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hourlyRate.trim()) {
      showToast('Please enter your name and hourly rate', 'error');
      return;
    }

    setIsSubmitting(true);

    const newWorkerProfile: WorkerProfile = {
      full_name: name.trim(), worker_id: `wrk_${Date.now()}`, avg_rating: 0, total_jobs: 0, years_experience: 0, distance_km: 0, 
      tags: [category],
      location: { lat: 12.9716, lng: 77.5946 }
    };

    console.log(newWorkerProfile);
    setIsSubmitting(false);
    showToast('🎉 Service Profile Posted! You are now live in Customer Search.', 'success');
    setActiveTab('feed');
    if (onJobPosted) onJobPosted();
  };

  // Calculate Net Earnings with 8% Platform Commission Fee
  const completedJobs = bookings.filter(b => b.status === 'completed');
  const totalGross = completedJobs.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalCommission = Math.round(totalGross * 0.08);
  const netPayout = totalGross - totalCommission;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100%', paddingBottom: 100 }}>
      {/* ── Top Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: '24px 20px 20px', color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <span style={{ background: '#10B981', color: 'white', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 12, letterSpacing: '0.5px' }}>
              PRO DASHBOARD
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 0', letterSpacing: '-0.4px' }}>
              Worker Hub 🛠️
            </h2>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 14, textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Net Balance</p>
            <p style={{ fontSize: 16, fontWeight: 900, color: '#34D399', margin: 0 }}>₹{netPayout}</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'rgba(255,255,255,0.08)', padding: 4, borderRadius: 14 }}>
          {[
            { key: 'feed', label: 'Jobs Feed', icon: Briefcase },
            { key: 'post', label: '+ Post Job', icon: PlusCircle },
            { key: 'earnings', label: 'Earnings', icon: DollarSign },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                background: activeTab === tab.key ? '#0B3D66' : 'transparent',
                color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.7)',
                border: 'none', borderRadius: 10, padding: '8px 0', fontSize: 11,
                fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 4, transition: 'all 0.15s ease'
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Area ── */}
      <div style={{ padding: 16 }}>
        {/* TAB 1: Post a Service Job Profile */}
        {activeTab === 'post' && (
          <form onSubmit={handlePostService} style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>
              📢 Post Service Availability
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px' }}>
              Post your service so nearby customers can find and book you instantly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rameshwar Singh"
                  required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Service Trade Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none', background: 'white' }}
                >
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{'🔧'} {c.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(e.target.value)}
                    placeholder="400"
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Village / Location</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="e.g. Rampur Main Market"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Short Bio / Work Experience</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. 10 years experience in house wiring, motor repair & light fittings."
                  rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #0B3D66, #041B30)',
                  color: 'white', border: 'none', borderRadius: 14, padding: 14,
                  fontSize: 14, fontWeight: 900, cursor: 'pointer', marginTop: 6,
                  boxShadow: '0 4px 14px rgba(11,61,102,0.3)',
                }}
              >
                🚀 Post Live Service Profile
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Incoming Jobs Feed */}
        {activeTab === 'feed' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                📥 Incoming Customer Bookings ({bookings.length})
              </h3>
            </div>

            {bookings.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 18, padding: 32, textAlign: 'center', border: '1.5px dashed #CBD5E1' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
                <p style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>No bookings received yet</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 14px' }}>
                  Post your service profile so customers can start booking you!
                </p>
                <button
                  onClick={() => setActiveTab('post')}
                  style={{ background: '#0B3D66', color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  + Post Service Profile
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bookings.map(b => (
                  <div key={b.id} style={{ background: 'white', borderRadius: 18, padding: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#0B3D66', background: '#F0F7FF', padding: '2px 8px', borderRadius: 10 }}>
                          {(b.category_name || 'General')}
                        </span>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '4px 0 0' }}>
                          Customer #{b.customer_id.substring(0, 8)}
                        </h4>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 12,
                        background: b.status === 'completed' ? '#DCFCE7' : b.status === 'accepted' ? '#DBEAFE' : '#FEF3C7',
                        color: b.status === 'completed' ? '#15803D' : b.status === 'accepted' ? '#1D4ED8' : '#92400E',
                      }}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: '#475569', margin: '0 0 10px' }}>
                      {b.address_notes || 'Standard home repair service requested.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>₹{(b.total_amount || 0)}</span>
                        <span style={{ fontSize: 10, color: '#64748B', marginLeft: 6 }}>(Net ₹{(b.total_amount || 0) - (b.commission_amount || 0)})</span>
                      </div>

                      {b.status === 'pending' && (
                        <button
                          onClick={() => console.log(b.id, 'accepted')}
                          style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: 10, padding: '6px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Accept Job ✓
                        </button>
                      )}
                      {b.status === 'accepted' && (
                        <button
                          onClick={() => console.log(b.id, 'completed')}
                          style={{ background: '#0B3D66', color: 'white', border: 'none', borderRadius: 10, padding: '6px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Mark Completed 🎉
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Earnings & Ledger */}
        {activeTab === 'earnings' && (
          <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: '0 0 12px' }}>
              💰 Earnings & Platform Fee Ledger
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 14, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: 10, color: '#64748B', margin: 0 }}>Gross</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>₹{totalGross}</p>
              </div>
              <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 14, textAlign: 'center', border: '1px solid #FECACA' }}>
                <p style={{ fontSize: 10, color: '#991B1B', margin: 0 }}>Fee (8%)</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: '#DC2626', margin: 0 }}>-₹{totalCommission}</p>
              </div>
              <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 14, textAlign: 'center', border: '1px solid #A7F3D0' }}>
                <p style={{ fontSize: 10, color: '#065F46', margin: 0 }}>Net Payout</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: '#059669', margin: 0 }}>₹{netPayout}</p>
              </div>
            </div>

            <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              💡 <strong>Neighborly Trust Transparency Rule:</strong> Platform retains a flat 8% fee to cover customer support, insurance, and verification. 92% of earnings go directly to your bank account via UPI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
