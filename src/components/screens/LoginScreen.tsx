'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ChevronLeft, Smartphone } from 'lucide-react';
import PrivacyPolicyModal from '../PrivacyPolicyModal';

type Step = 'language' | 'phone' | 'otp' | 'profile';

const LANGUAGES = [
  { code: 'en', label: 'English',    native: 'English'   },
  { code: 'hi', label: 'Hindi',      native: 'हिंदी'      },
  { code: 'kn', label: 'Kannada',    native: 'ಕನ್ನಡ'      },
  { code: 'te', label: 'Telugu',     native: 'తెలుగు'     },
  { code: 'ta', label: 'Tamil',      native: 'தமிழ்'      },
  { code: 'mr', label: 'Marathi',    native: 'मराठी'      },
  { code: 'bn', label: 'Bengali',    native: 'বাংলা'      },
  { code: 'gu', label: 'Gujarati',   native: 'ગુજરાતી'    },
];

export default function LoginScreen() {
  const { loginUser, settings, setLanguage, showToast } = useApp();
  const [step, setStep] = useState<Step>('language');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [authUserId, setAuthUserId] = useState('');
  
  const otpRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ];
  const lastOtpTime = useRef<number>(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (!consent) { setError('Please accept the privacy consent to continue.'); return; }

    const now = Date.now();
    if (now - lastOtpTime.current < 60000) {
      setError('Please wait 60 seconds before requesting another OTP.');
      return;
    }
    lastOtpTime.current = now;

    setLoading(true);

    try {
      const { getClient } = await import('../../lib/supabase');
      const client = getClient();
      if (!client) {
        setError('Service unavailable. Please try again later.');
        setLoading(false);
        return;
      }

      const { error: otpError } = await client.auth.signInWithOtp({
        phone: '+91' + cleanPhone,
      });

      if (otpError) {
        setError(otpError.message || 'Failed to send OTP. Please try again.');
        setLoading(false);
        return;
      }

      showToast('OTP sent to your number!', 'info');
      setStep('otp');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setError('');
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
    if (val && idx === 5) {
      const fullCode = next.join('');
      if (fullCode.length === 6) setTimeout(() => verifyOtp(fullCode), 80);
    }
  };

  const handleOtpKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  };

  const verifyOtp = async (code?: string) => {
    const entered = code ?? otp.join('');
    if (entered.length < 6) { setError('Please enter all 6 digits.'); return; }

    const cleanPhone = phone.replace(/\D/g, '');
    setLoading(true);
    setError('');

    try {
      const { getClient, upsertProfile } = await import('../../lib/supabase');
      const client = getClient();
      if (!client) {
        setError('Service unavailable. Please try again.');
        setLoading(false);
        return;
      }

      const { data, error: verifyError } = await client.auth.verifyOtp({
        phone: '+91' + cleanPhone,
        token: entered,
        type: 'sms',
      });

      if (verifyError || !data.user) {
        setError('Incorrect OTP. Please try again.');
        setLoading(false);
        return;
      }
      
      const userId = data.user.id;
      setAuthUserId(userId);
      
      // 1. Check if profile exists by user ID
      let existingName = '';
      const { data: profile } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (profile && profile.full_name && profile.full_name.trim() !== '' && profile.full_name !== 'Deleted User') {
        existingName = profile.full_name.trim();
      } else {
        // 2. Fallback: check if profile exists matching phone number
        const { data: phoneProfile } = await client
          .from('profiles')
          .select('*')
          .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`)
          .maybeSingle();

        if (phoneProfile && phoneProfile.full_name && phoneProfile.full_name.trim() !== '' && phoneProfile.full_name !== 'Deleted User') {
          existingName = phoneProfile.full_name.trim();
          // Link profile to current auth user id
          await upsertProfile({
            id: userId,
            full_name: existingName,
            phone: cleanPhone,
            language: settings.language,
            consent_given: true,
          });
        }
      }

      if (existingName) {
        // Returning user - log in immediately without asking for name again!
        loginUser(cleanPhone, existingName, userId);
      } else {
        // New user or missing full name - prompt once
        if (profile?.full_name) setName(profile.full_name);
        setStep('profile');
        setLoading(false);
      }
    } catch {
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };
  
  const handleCompleteProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Please enter your name.'); return; }
    
    setLoading(true);
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');

    try {
      const { upsertProfile } = await import('../../lib/supabase');
      // Persist profile to Supabase database
      await upsertProfile({
        id: authUserId,
        full_name: trimmedName,
        phone: cleanPhone,
        language: settings.language,
        consent_given: true,
      });
      
      loginUser(cleanPhone, trimmedName, authUserId);
    } catch {
      loginUser(cleanPhone, trimmedName, authUserId);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'language') {
    return (
      <div style={{ height: '100%', background: '#F0F7FF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '48px 24px 32px', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px', backdropFilter: 'blur(10px)',
          }}>
            <ShieldCheck size={36} color="#F59E0B" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', margin: 0 }}>
            Hero Hand
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 6, fontWeight: 500 }}>
            Trusted help, right at your door.
          </p>
        </div>

        {/* Language Select */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', background: '#F0F7FF' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
            Select your language — भाषा चुनें
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code as any); setStep('phone'); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: '14px 16px', borderRadius: 14,
                  background: settings.language === lang.code ? '#0B3D66' : 'white',
                  border: `2px solid ${settings.language === lang.code ? '#0B3D66' : '#E2E8F0'}`,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <span style={{
                  fontSize: 15, fontWeight: 800,
                  color: settings.language === lang.code ? 'white' : '#0F172A',
                }}>
                  {lang.native}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 500, marginTop: 2,
                  color: settings.language === lang.code ? 'rgba(255,255,255,0.7)' : '#94A3B8',
                }}>
                  {lang.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: '#F0F7FF', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '48px 24px 32px' }}>
          <button onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, marginBottom: 24, padding: 0, transition: 'opacity 0.2s' }}>
            <ChevronLeft size={18} /> Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>Verify your number</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8, fontWeight: 500 }}>
            {`Code sent to +91 ${phone}`}
          </p>
        </div>

        <div style={{ padding: '32px 24px', flex: 1 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '32px 24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9' }}>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#475569', fontWeight: 500, marginBottom: 24 }}>
              Enter the 6-digit verification code
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(e.target.value, idx)}
                  onKeyDown={e => handleOtpKey(e, idx)}
                  style={{
                    width: 44,
                    height: 52,
                    borderRadius: 12,
                    border: digit ? '2px solid #0B3D66' : '1.5px solid #E2E8F0',
                    background: digit ? '#F0F7FF' : '#F8FAFC',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#0F172A',
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: digit ? '0 4px 12px rgba(11, 61, 102, 0.08)' : 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '2px solid #0B3D66';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(11, 61, 102, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = digit ? '2px solid #0B3D66' : '1.5px solid #E2E8F0';
                    e.target.style.background = digit ? '#F0F7FF' : '#F8FAFC';
                    e.target.style.boxShadow = digit ? '0 4px 12px rgba(11, 61, 102, 0.08)' : 'none';
                  }}
                />
              ))}
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>{error}</p>}

            <button
              onClick={() => verifyOtp()}
              disabled={loading || otp.join('').length < 6}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: loading || otp.join('').length < 6 ? '#E2E8F0' : 'linear-gradient(135deg, #0B3D66, #041B30)',
                color: loading || otp.join('').length < 6 ? '#94A3B8' : 'white', 
                fontWeight: 700, fontSize: 16, border: 'none', 
                cursor: loading || otp.join('').length < 6 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: loading || otp.join('').length < 6 ? 'none' : '0 4px 14px rgba(11, 61, 102, 0.25)',
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                onClick={countdown === 0 ? handleSendOtp : undefined}
                disabled={countdown > 0}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: countdown > 0 ? '#94A3B8' : '#0B3D66',
                  fontSize: 14, fontWeight: 600,
                  cursor: countdown > 0 ? 'default' : 'pointer',
                  textDecoration: countdown > 0 ? 'none' : 'underline',
                  transition: 'color 0.2s ease'
                }}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (step === 'profile') {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: '#F0F7FF' }}>
        <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '40px 24px 32px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0 }}>Almost Done</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '6px 0 0', fontWeight: 500 }}>
            What should we call you?
          </p>
        </div>
        <div style={{ padding: '24px 20px' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '24px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                FULL NAME
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                style={{
                  width: '100%', padding: '13px 14px', borderRadius: 12,
                  border: '1.5px solid #E2E8F0', fontSize: 15, fontWeight: 500,
                  outline: 'none', background: '#F8FAFC', boxSizing: 'border-box',
                }}
              />
            </div>
            {error && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{error}</p>}
            <button
              onClick={handleCompleteProfile}
              style={{
                width: '100%', padding: '15px', borderRadius: 14,
                background: 'linear-gradient(135deg, #0B3D66, #041B30)',
                color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
              }}
            >
              Complete Setup →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phone step ──
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0F7FF' }}>
      <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '40px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={26} color="#F59E0B" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px' }}>
              Hero Hand
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, fontWeight: 500 }}>
              Book trusted local specialists
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '24px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#041B30', marginBottom: 6, letterSpacing: '-0.3px' }}>
            Get started in seconds
          </h2>
          <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 20 }}>
            We'll send a one-time code to verify your number.
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mobile Number
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ background: '#F1F5F9', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '13px 14px', fontSize: 15, fontWeight: 700, color: '#334155', flexShrink: 0 }}>
                🇮🇳 +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                autoComplete="tel"
                style={{
                  flex: 1, minWidth: 0, padding: '13px 14px', borderRadius: 12,
                  border: '1.5px solid #E2E8F0', fontSize: 15, fontWeight: 600,
                  fontFamily: 'Inter, sans-serif', color: '#0F172A', outline: 'none',
                  background: '#F8FAFC', boxSizing: 'border-box', letterSpacing: '0.5px',
                }}
              />
            </div>
          </div>

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 20, padding: '12px', background: '#F8FAFC', borderRadius: 10, border: `1.5px solid ${consent ? '#0B3D66' : '#E2E8F0'}` }}>
            <div
              onClick={() => setConsent(!consent)}
              style={{
                width: 20, height: 20, borderRadius: 6, border: `2px solid ${consent ? '#0B3D66' : '#CBD5E1'}`,
                background: consent ? '#0B3D66' : 'white', flexShrink: 0, marginTop: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {consent && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>
              I agree to Hero Hand's{' '}
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPrivacyModal(true);
                }}
                style={{ color: '#0B3D66', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Privacy Policy
              </span>.
            </span>
          </label>

          {error && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{error}</p>}

          <button
            onClick={handleSendOtp}
            disabled={loading || countdown > 0}
            style={{
              width: '100%', padding: '15px', borderRadius: 14,
              background: loading || countdown > 0 ? '#94A3B8' : 'linear-gradient(135deg, #0B3D66, #041B30)',
              color: 'white', fontWeight: 800, fontSize: 15, border: 'none',
              cursor: loading || countdown > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending code…' : countdown > 0 ? `Retry in ${countdown}s` : 'Continue →'}
          </button>
        </div>
      </div>

      {/* Standalone DPDP & Google Play Compliant Privacy Policy Modal */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
    </div>
  );
}
