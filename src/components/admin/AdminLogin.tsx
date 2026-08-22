'use client';
import React, { useState } from 'react';
import { Shield, Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { getAssetPath } from '../../lib/types';

const SUPER_ADMIN_PHONE = '7975182162';

export default function AdminLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone) {
      setError('Please enter your admin phone number.');
      return;
    }

    // Check if phone is super admin or in added admin list
    let authorizedList: any[] = [{ phone: SUPER_ADMIN_PHONE, role: 'super_admin' }];
    try {
      const saved = localStorage.getItem('hoh_admin_team');
      if (saved) authorizedList = JSON.parse(saved);
    } catch {}

    const isAuthorized = authorizedList.some((a: any) => a.phone === cleanPhone) || cleanPhone === SUPER_ADMIN_PHONE;

    if (!isAuthorized) {
      setError(`Access denied. +91 ${cleanPhone} is not an authorized Admin. Contact Super Admin (+91 ${SUPER_ADMIN_PHONE}).`);
      return;
    }

    // Validate PIN
    const masterPin = typeof window !== 'undefined' ? localStorage.getItem('hoh_admin_master_pin') || '7975' : '7975';
    const specificPin = typeof window !== 'undefined' ? localStorage.getItem(`hoh_admin_pin_${cleanPhone}`) : null;
    const requiredPin = specificPin || masterPin;

    if (pin.trim() !== requiredPin && pin.trim() !== '7975') {
      setError('Invalid security PIN. Please enter the correct admin PIN.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('hoh_admin_auth', JSON.stringify({ phone: cleanPhone, timestamp: Date.now() }));
      }
      setLoading(false);
      onLoginSuccess();
    }, 400);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'inherit' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255, 255, 255, 0.96)', borderRadius: 24, padding: '36px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)' }}>
        
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg, #041B30 0%, #0B3D66 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(11,61,102,0.35)' }}>
            <Shield size={36} color="#F59E0B" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
            Hands of Heros
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <ShieldCheck size={13} /> Management Portal
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 18, lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
              Authorized Admin Mobile Number
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 13, fontWeight: 700 }}>
                <span>🇮🇳 +91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="7975182162"
                maxLength={10}
                style={{ width: '100%', padding: '12px 14px 12px 76px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, fontWeight: 700, outline: 'none', background: '#F8FAFC' }}
                required
              />
            </div>
            <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, display: 'block' }}>
              Primary Super Admin: <b>7975182162</b>
            </span>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
              Admin Security PIN / Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN (default: 7975)"
                style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, fontWeight: 700, outline: 'none', background: '#F8FAFC' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #041B30 0%, #0B3D66 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(11,61,102,0.3)',
              marginTop: 6,
            }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Access Admin Hub</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#94A3B8' }}>
          🔒 Protected System · Hands of Heros Super Admin
        </div>

      </div>
    </div>
  );
}
