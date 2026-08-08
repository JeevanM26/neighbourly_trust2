'use client';
import React from 'react';
import { useWorker } from '../../context/WorkerContext';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { TrendingUp, IndianRupee, Briefcase, ArrowUpRight } from 'lucide-react';

const PERIOD_LABELS = { today: 'Today', week: 'This Week', month: 'This Month' } as const;

// Custom tooltip for recharts
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #D1FAE5', borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>₹{payload[0]?.value?.toLocaleString('en-IN')}</p>
    </div>
  );
}

export default function EarningsScreen() {
  const { earnings, earningsPeriod, setEarningsPeriod, completedBookings, categories } = useWorker();

  // Build chart data from completed bookings
  const chartData = React.useMemo(() => {
    const completed = completedBookings.filter(b => b.status === 'completed');
    
    // helper to calc net
    const getNet = (b: any) => (b.final_price || b.price_estimate || 0) * 0.92;

    if (earningsPeriod === 'today') {
      const hours: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hours[i] = 0;
      completed.forEach(b => {
        const h = new Date(b.created_at).getHours();
        hours[h] = (hours[h] || 0) + getNet(b);
      });
      return Object.entries(hours).filter(([h]) => Number(h) >= 6).map(([h, amt]) => ({
        label: `${h}:00`, amount: amt,
      }));
    }
    if (earningsPeriod === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data: Record<string, number> = {};
      days.forEach(d => { data[d] = 0; });
      const today = new Date();
      completed.forEach(b => {
        const d = new Date(b.created_at);
        const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
        if (diff < 7) {
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
          data[dayName] = (data[dayName] || 0) + getNet(b);
        }
      });
      return days.map(d => ({ label: d, amount: data[d] }));
    }
    // month — by week
    const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
    const data: Record<string, number> = { 'Wk 1': 0, 'Wk 2': 0, 'Wk 3': 0, 'Wk 4': 0 };
    const today = new Date();
    completed.forEach(b => {
      const d = new Date(b.created_at);
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff < 28) {
        const wk = `Wk ${Math.min(4, Math.floor(diff / 7) + 1)}`;
        data[wk] = (data[wk] || 0) + getNet(b);
      }
    });
    return weeks.map(w => ({ label: w, amount: data[w] }));
  }, [completedBookings, earningsPeriod]);

  // Skill breakdown data
  const skillData = earnings.by_category.map(s => {
    const meta = categories.find(c => c.id === s.category || c.name_en === s.category);
    return { ...s, emoji: meta?.icon_url ?? '🔧', color: '#059669' };
  });

  return (
    <div style={{ background: '#F0FDF4', minHeight: '100%', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.4px' }}>Earnings</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '4px 0 0', fontWeight: 500 }}>Your income breakdown</p>
          </div>
          {/* Period Selector */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, gap: 3 }}>
            {(['today', 'week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setEarningsPeriod(p)}
                style={{ padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: earningsPeriod === p ? 'white' : 'transparent', fontWeight: 800, fontSize: 10, color: earningsPeriod === p ? '#059669' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s ease', textTransform: 'capitalize' }}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Main Earnings Card */}
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px', border: '1px solid rgba(255,255,255,0.15)' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, margin: '0 0 6px' }}>NET EARNINGS — {PERIOD_LABELS[earningsPeriod].toUpperCase()}</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1 }}>
              ₹{earnings.net.toLocaleString('en-IN')}
            </div>
            {earnings.net > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.2)', borderRadius: 8, padding: '4px 8px', marginBottom: 4 }}>
                <ArrowUpRight size={12} color="#6EE7B7" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6EE7B7' }}>Earnings</span>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            {[
              { label: 'Gross', value: `₹${earnings.gross.toLocaleString('en-IN')}` },
              { label: 'Commission', value: `-₹${earnings.commission.toLocaleString('en-IN')}` },
              { label: 'Jobs', value: earnings.jobs_count },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Chart */}
        <div style={{ background: 'white', borderRadius: 20, padding: '20px 8px 12px', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px 16px' }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Earnings Trend</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, margin: '2px 0 0' }}>{PERIOD_LABELS[earningsPeriod]}</p>
            </div>
            <TrendingUp size={18} color="#059669" />
          </div>
          {chartData.some(d => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2.5} fill="url(#earningsGrad)" dot={{ fill: '#059669', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>No earnings data for this period</p>
            </div>
          )}
        </div>

        {/* Per-skill breakdown */}
        {skillData.length > 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 16px' }}>Earnings by Skill</h3>
            {skillData.map(s => {
              const pct = earnings.net > 0 ? (s.amount / earnings.net) * 100 : 0;
              return (
                <div key={s.category} style={{ marginBottom: 14, ':last-child': { marginBottom: 0 } } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{s.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{s.category}</span>
                      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{s.count} job{s.count !== 1 ? 's' : ''}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#059669' }}>₹{s.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, #059669, #10B981)`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tips */}
        <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', borderRadius: 16, padding: '16px', border: '1px solid #A7F3D0' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#065F46', margin: '0 0 8px' }}>💡 Earning Tips</p>
          <ul style={{ padding: '0 0 0 16px', margin: 0 }}>
            {['Stay online during peak hours (8–11am, 5–8pm) to get more bookings',
              'Accept requests quickly — workers with 90%+ acceptance get priority',
              'Good ratings unlock higher-paying jobs from premium customers'].map((tip, i) => (
              <li key={i} style={{ fontSize: 11, color: '#065F46', fontWeight: 500, marginBottom: 4, lineHeight: 1.5 }}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
