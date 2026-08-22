'use client';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Check, ChevronRight, Phone, Sparkles, User, LogIn, ArrowRight } from 'lucide-react';
import { getAssetPath } from '../../lib/types';
import PrivacyPolicyModal from '../PrivacyPolicyModal';

type Step = 'language' | 'login' | 'complete_phone';

const LANGUAGES = [
  { code: 'en', label: 'English',    native: 'English'   },
  { code: 'kn', label: 'Kannada',    native: 'ಕನ್ನಡ'      },
  { code: 'hi', label: 'Hindi',      native: 'हिंदी'      },
  { code: 'te', label: 'Telugu',     native: 'తెలుగు'     },
  { code: 'ta', label: 'Tamil',      native: 'தமிழ்'      },
  { code: 'mr', label: 'Marathi',    native: 'ಮರಾठी'      },
  { code: 'bn', label: 'Bengali',    native: 'বাংলা'      },
  { code: 'gu', label: 'Gujarati',   native: 'ગુજરાતી'    },
];

export default function LoginScreen() {
  const { user, loginUser, settings, setLanguage, showToast } = useApp();
  const [step, setStep] = useState<Step>('language');
  const [authMethod, setAuthMethod] = useState<'google' | 'phone'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState('');

  // If user is authenticated with Google but needs phone number
  useEffect(() => {
    if (user) {
      if (!user.phone || user.phone.trim() === '') {
        setName(user.full_name || '');
        setStep('complete_phone');
      }
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    if (!consent) {
      setError('Please accept the Terms of Service & Privacy Policy to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { getClient } = await import('../../lib/supabase');
      const client = getClient();
      if (!client) {
        setError('Authentication service unavailable. Please check internet connection.');
        setLoading(false);
        return;
      }
      const { error: authErr } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.href.split('#')[0] : undefined,
        },
      });
      if (authErr) throw authErr;
    } catch (err: any) {
      setError(err?.message || 'Google Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!consent) {
      setError('Please accept the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginUser(cleanPhone, name.trim(), 'customer');
      showToast(`Welcome back, ${name.trim()}! 🎉`, 'success');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { getClient, upsertProfile } = await import('../../lib/supabase');
      const client = getClient();
      const currentUserId = user?.id;

      if (currentUserId && client) {
        await client.from('profiles').update({
          phone: cleanPhone,
          full_name: name.trim() || user?.full_name || 'ShramiXs User',
          language: settings.language,
          preferred_language: settings.language,
          consent_given: true,
          updated_at: new Date().toISOString(),
        }).eq('id', currentUserId);
      } else if (currentUserId) {
        await upsertProfile({
          id: currentUserId,
          full_name: name.trim() || user?.full_name || 'ShramiXs User',
          phone: cleanPhone,
          language: settings.language,
          consent_given: true,
          preferred_language: settings.language,
        });
      }

      await loginUser(cleanPhone, name.trim() || user?.full_name || 'ShramiXs User', 'customer');
      showToast('Profile updated! Welcome to Hands of ShramiXs 🎉', 'success');
    } catch (err: any) {
      console.warn('Profile save notice:', err);
      await loginUser(cleanPhone, name.trim() || user?.full_name || 'ShramiXs User', 'customer');
      showToast('Welcome to Hands of ShramiXs 🎉', 'success');
    } finally {
      setLoading(false);
    }
  };

  // ── 1. Language Selection Step ──
  if (step === 'language') {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: '#F0F7FF', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '48px 24px 32px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backdropFilter: 'blur(8px)', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
            <img src={getAssetPath('/logo.png')} alt="Hands of ShramiXs" style={{ width: 54, height: 54, objectFit: 'contain' }} onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }} />
            <ShieldCheck size={36} color="#F59E0B" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            Hands of ShramiXs
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, margin: 0 }}>
            Select your preferred language / ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {LANGUAGES.map(lang => {
              const active = settings.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  style={{
                    padding: '16px 14px',
                    borderRadius: 16,
                    border: `2px solid ${active ? '#0B3D66' : '#E2E8F0'}`,
                    background: active ? '#EBF5FF' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    boxShadow: active ? '0 4px 12px rgba(11, 61, 102, 0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: active ? '#0B3D66' : '#0F172A' }}>
                      {lang.native}
                    </span>
                    {active && <Check size={16} color="#0B3D66" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 12, color: active ? '#1D4ED8' : '#64748B', fontWeight: 600 }}>
                    {lang.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 28px', background: 'linear-gradient(to top, #F0F7FF 80%, rgba(240, 247, 255, 0))', backdropFilter: 'blur(8px)', zIndex: 10 }}>
          <button
            onClick={() => setStep('login')}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0B3D66, #041B30)',
              color: 'white',
              fontWeight: 800,
              fontSize: 16,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 6px 20px rgba(11, 61, 102, 0.35)',
            }}
          >
            Continue <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ── 2. Complete Profile Step (For New Users Signing Up via Google) ──
  if (step === 'complete_phone') {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: '#F0F7FF', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '48px 24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Sparkles size={22} color="#F59E0B" />
            <span style={{ color: '#FCD34D', fontSize: 12, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Final Step
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
            Welcome, {name.split(' ')[0] || 'Friend'}! 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
            Please enter your mobile number for live technician tracking & booking alerts.
          </p>
        </div>

        <div style={{ padding: '24px 20px', flex: 1 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '28px 22px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)', border: '1.5px solid #E2E8F0' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={18} color="#94A3B8" style={{ position: 'absolute', left: 16 }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: 14,
                    border: '1.5px solid #E2E8F0',
                    fontSize: 15,
                    fontWeight: 600,
                    outline: 'none',
                    color: '#0F172A',
                    background: '#F8FAFC',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Mobile Number
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 16, fontSize: 15, fontWeight: 800, color: '#0B3D66' }}>
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 56px',
                    borderRadius: 14,
                    border: '1.5px solid #E2E8F0',
                    fontSize: 16,
                    fontWeight: 700,
                    outline: 'none',
                    letterSpacing: '1px',
                    color: '#0F172A',
                    background: '#F8FAFC',
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginBottom: 18, color: '#DC2626', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleSavePhone}
              disabled={loading || phone.length < 10}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                background: loading || phone.length < 10 ? '#CBD5E1' : 'linear-gradient(135deg, #0B3D66, #041B30)',
                color: loading || phone.length < 10 ? '#64748B' : 'white',
                fontWeight: 800,
                fontSize: 16,
                border: 'none',
                cursor: loading || phone.length < 10 ? 'not-allowed' : 'pointer',
                boxShadow: loading || phone.length < 10 ? 'none' : '0 6px 20px rgba(11, 61, 102, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'Setting up account…' : 'Enter Home Screen →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Main Login Screen (Phone Number + Google Sign-In) ──
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0F7FF', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '48px 24px 32px', textAlign: 'center', position: 'relative' }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <img src={getAssetPath('/logo.png')} alt="Hands of ShramiXs" style={{ width: 60, height: 60, objectFit: 'contain' }} onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }} />
          <ShieldCheck size={42} color="#F59E0B" strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
          Hands of ShramiXs
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500, margin: '0 0 14px' }}>
          Skills · Effort · Better Tomorrows
        </p>

        {/* Feature Highlights */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#93C5FD' }}>
            ⚡ 15-Min Dispatch
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#86EFAC' }}>
            🛡️ Verified Pros
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#FDE047' }}>
            🔒 Safe & Secure
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div style={{ padding: '20px 20px 36px', flex: 1 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', boxShadow: '0 10px 40px -10px rgba(11, 61, 102, 0.12)', border: '1.5px solid #E2E8F0' }}>
          
          {/* Method Switcher Tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 20 }}>
            <button
              onClick={() => setAuthMethod('phone')}
              type="button"
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 11,
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                background: authMethod === 'phone' ? 'white' : 'transparent',
                color: authMethod === 'phone' ? '#0B3D66' : '#64748B',
                boxShadow: authMethod === 'phone' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              📱 Mobile Number
            </button>
            <button
              onClick={() => setAuthMethod('google')}
              type="button"
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 11,
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                background: authMethod === 'google' ? 'white' : 'transparent',
                color: authMethod === 'google' ? '#0B3D66' : '#64748B',
                boxShadow: authMethod === 'google' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              🌐 Google Sign-In
            </button>
          </div>

          {authMethod === 'phone' ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="#94A3B8" style={{ position: 'absolute', left: 14 }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '13px 14px 13px 42px',
                      borderRadius: 14,
                      border: '1.5px solid #E2E8F0',
                      fontSize: 15,
                      fontWeight: 600,
                      outline: 'none',
                      color: '#0F172A',
                      background: '#F8FAFC',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Mobile Number
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 14, fontSize: 15, fontWeight: 800, color: '#0B3D66' }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit number"
                    style={{
                      width: '100%',
                      padding: '13px 14px 13px 52px',
                      borderRadius: 14,
                      border: '1.5px solid #E2E8F0',
                      fontSize: 16,
                      fontWeight: 700,
                      outline: 'none',
                      letterSpacing: '1px',
                      color: '#0F172A',
                      background: '#F8FAFC',
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handlePhoneSignIn}
                disabled={loading || phone.length < 10 || !name.trim()}
                type="button"
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  borderRadius: 15,
                  background: loading || phone.length < 10 || !name.trim() ? '#CBD5E1' : 'linear-gradient(135deg, #0B3D66, #041B30)',
                  color: loading || phone.length < 10 || !name.trim() ? '#64748B' : 'white',
                  fontWeight: 800,
                  fontSize: 15,
                  border: 'none',
                  cursor: loading || phone.length < 10 || !name.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: loading || phone.length < 10 || !name.trim() ? 'none' : '0 6px 20px rgba(11, 61, 102, 0.3)',
                  transition: 'all 0.15s ease',
                  marginBottom: 16,
                }}
              >
                {loading ? 'Entering App…' : (
                  <>
                    <span>Enter ShramiXs</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 18, lineHeight: 1.4 }}>
                Sign in with your Google account in 1 click.
              </p>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                type="button"
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  borderRadius: 15,
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 800,
                  fontSize: 15,
                  border: '2px solid #E2E8F0',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease',
                  marginBottom: 16,
                }}
              >
                {loading ? (
                  <span style={{ color: '#0B3D66', fontWeight: 700 }}>Connecting to Google…</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginBottom: 14, color: '#DC2626', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Consent Checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
            <div
              onClick={() => setConsent(!consent)}
              style={{
                width: 20, height: 20, borderRadius: 6,
                border: `2px solid ${consent ? '#0B3D66' : '#CBD5E1'}`,
                background: consent ? '#0B3D66' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
                transition: 'all 0.15s ease',
              }}
            >
              {consent && <Check size={14} color="white" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
              I agree to the{' '}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowPrivacyModal(true); }}
                style={{ color: '#0B3D66', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Terms & Privacy Policy
              </button>
            </span>
          </label>
        </div>
      </div>

      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
}
