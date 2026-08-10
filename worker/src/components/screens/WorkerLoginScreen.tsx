'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { ServiceCategory } from '../../lib/types';
import { getClient, fetchServiceCategories } from '../../lib/supabase';
import { ShieldCheck, ChevronLeft, Smartphone, MessageSquare, Check, ChevronRight } from 'lucide-react';

type Step = 'phone' | 'otp' | 'name' | 'skills';

export default function WorkerLoginScreen() {
  const { loginWorker, completeOnboarding, isNewWorker, showToast } = useWorker();
  const [step, setStep] = useState<Step>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpMethod, setOtpMethod] = useState<'sms' | 'screen'>('sms');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (isNewWorker) {
      fetchServiceCategories().then(data => setCategories(data));
      setStep('name');
    }
  }, [isNewWorker]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) { setError('Enter a valid 10-digit Indian mobile number.'); return; }
    if (!consent) { setError('You must agree to the Terms of Service.'); return; }

    setLoading(true);
    
    try {
      const client = getClient();
      if (!client) {
        setError('Service unavailable.');
        setLoading(false);
        return;
      }
      const { error: otpError } = await client.auth.signInWithOtp({
        phone: '+91' + cleanPhone,
      });

      if (otpError) {
        setError(otpError.message || 'Failed to send OTP.');
        setLoading(false);
        return;
      }

      showToast('OTP sent to your number', 'info');
      setStep('otp');
      setCountdown(30);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch {
      setError('An error occurred. Try again.');
    }
    setLoading(false);
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
    if (next.every(d => d) && next.join('').length === 6) verifyOtp(next.join(''));
  };

  const verifyOtp = async (code?: string) => {
    const entered = code ?? otp.join('');
    if (entered.length < 6) { setError('Enter all 6 digits.'); return; }
    
    setLoading(true);
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    
    try {
      const client = getClient();
      if (!client) {
        setError('Service unavailable.');
        setLoading(false);
        return;
      }

      const { data, error: verifyError } = await client.auth.verifyOtp({
        phone: '+91' + cleanPhone,
        token: entered,
        type: 'sms',
      });

      if (verifyError || !data.user) {
        setError('Incorrect OTP. Try again.');
        setLoading(false);
        return;
      }

      loginWorker(cleanPhone, data.user.id);
    } catch {
      setError('Verification failed.');
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = () => {
    if (selectedCategories.size === 0) { showToast('Select at least one category.', 'error'); return; }
    completeOnboarding(name.trim(), Array.from(selectedCategories));
  };

  // ── Phone Step ──────────────────────────────────────────
  if (step === 'phone') return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '52px 24px 36px', textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: 22, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', backdropFilter: 'blur(10px)' }}>
          <ShieldCheck size={38} color="#FCD34D" strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', margin: '0 0 6px' }}>Worker Portal</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500 }}>Neighborly Trust — Partner App</p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6, fontWeight: 400 }}>Accept jobs • Track earnings • Grow your business</p>
      </div>

      <div style={{ padding: '28px 20px 40px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '24px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #D1FAE5' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#065F46', marginBottom: 6, letterSpacing: '-0.3px' }}>Get started</h2>
          <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 20 }}>Enter your mobile number to continue.</p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Mobile Number</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ padding: '13px 14px', borderRadius: 12, border: '2px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>🇮🇳 +91</div>
              <input type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: '2px solid #E2E8F0', fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#F8FAFC' }} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
            <div onClick={() => setConsent(!consent)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${consent ? '#059669' : '#CBD5E1'}`, background: consent ? '#059669' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'all 0.15s ease' }}>
              {consent && <Check size={12} color="white" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>
              I agree to the <strong style={{ color: '#059669' }}>Terms of Service</strong> and <strong style={{ color: '#059669' }}>Privacy Policy</strong>.
            </span>
          </label>

          {error && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>{error}</p>}

          <button onClick={handleSendOtp} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 14, background: loading ? '#94A3B8' : 'linear-gradient(135deg, #059669, #065F46)', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: '-0.2px', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
            {loading ? 'Sending code…' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── OTP Step ────────────────────────────────────────────
  if (step === 'otp') return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '40px 24px 28px' }}>
        <button onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px' }}>Verify your number</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
          Code sent to +91 {phone}
        </p>
      </div>

      <div style={{ padding: '28px 24px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '28px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #D1FAE5' }}>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 20 }}>Enter the 6-digit verification code</p>

          <div className="otp-group" style={{ marginBottom: 20 }}>
            {otp.map((digit, idx) => (
              <input key={idx} ref={otpRefs[idx]} type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleOtpChange(e.target.value, idx)}
                onKeyDown={e => { if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus(); }}
                className={`otp-box${digit ? ' filled' : ''}`} />
            ))}
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, textAlign: 'center', marginBottom: 14 }}>{error}</p>}

          <button onClick={() => verifyOtp()} disabled={otp.join('').length < 6} style={{ width: '100%', padding: '15px', borderRadius: 14, background: otp.join('').length < 6 ? '#E2E8F0' : 'linear-gradient(135deg, #059669, #065F46)', color: otp.join('').length < 6 ? '#94A3B8' : 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: otp.join('').length === 6 ? '0 4px 12px rgba(5,150,105,0.3)' : 'none' }}>
            Verify & Continue →
          </button>

          {countdown > 0 ? (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 16, fontWeight: 500 }}>Resend in {countdown}s</p>
          ) : (
            <button onClick={handleSendOtp} style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: 12, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', marginTop: 16, fontWeight: 700, padding: '8px' }}>
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Name Step ─────────────────────────────────────────────
  if (step === 'name') return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '40px 24px 28px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px' }}>Welcome!</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
          Let's set up your profile.
        </p>
      </div>

      <div style={{ padding: '28px 24px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '28px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #D1FAE5' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: '2px solid #E2E8F0', fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#F8FAFC', boxSizing: 'border-box' }} />
          </div>

          <button onClick={() => {
            if (!name.trim()) { showToast('Please enter your name', 'error'); return; }
            setStep('skills');
          }} disabled={!name.trim()} style={{ width: '100%', padding: '15px', borderRadius: 14, background: !name.trim() ? '#E2E8F0' : 'linear-gradient(135deg, #059669, #065F46)', color: !name.trim() ? '#94A3B8' : 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: name.trim() ? '0 4px 12px rgba(5,150,105,0.3)' : 'none' }}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );

  // ── Category Selection Step ─────────────────────────────────
  if (step === 'skills') return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '36px 24px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Final Step</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px' }}>Your Services</h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Select all services you can offer</p>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛠️</div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 14 }}>
          Tap to select • {selectedCategories.size} selected
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map(cat => {
            const selected = selectedCategories.has(cat.id);
            return (
              <button key={cat.id} onClick={() => {
                setSelectedCategories(prev => {
                  const next = new Set(prev);
                  if (next.has(cat.id)) next.delete(cat.id);
                  else next.add(cat.id);
                  return next;
                });
              }} className={`skill-pill${selected ? ' selected' : ''}`} style={{ width: '100%', textAlign: 'left', background: 'white', border: `2px solid ${selected ? '#059669' : '#E2E8F0'}`, borderRadius: 16, padding: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: selected ? '#D1FAE5' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  <img src={cat.icon_url} alt={cat.name_en} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: selected ? '#065F46' : '#334155' }}>{cat.name_en}</div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: selected ? '#059669' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selected ? <Check size={14} color="white" strokeWidth={3} /> : <span style={{ fontSize: 14, color: '#94A3B8' }}>+</span>}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={handleCompleteOnboarding}
          disabled={selectedCategories.size === 0}
          style={{ width: '100%', marginTop: 24, padding: '16px', borderRadius: 14, background: selectedCategories.size === 0 ? '#E2E8F0' : 'linear-gradient(135deg, #059669, #065F46)', color: selectedCategories.size === 0 ? '#94A3B8' : 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: selectedCategories.size > 0 ? '0 4px 12px rgba(5,150,105,0.3)' : 'none' }}>
          Start Taking Bookings 🚀 <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
