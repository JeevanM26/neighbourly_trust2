'use client';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Check, ChevronRight, Sparkles, User, AlertCircle } from 'lucide-react';
import { getAssetPath } from '../../lib/types';
import PrivacyPolicyModal from '../PrivacyPolicyModal';

type Step = 'language' | 'login' | 'complete_phone';

const LANGUAGES = [
  { code: 'en', label: 'English',    native: 'English'   },
  { code: 'kn', label: 'Kannada',    native: 'ಕನ್ನಡ'      },
  { code: 'hi', label: 'Hindi',      native: 'हिंदी'      },
  { code: 'te', label: 'Telugu',     native: 'తెలుగు'     },
  { code: 'ta', label: 'Tamil',      native: 'தமிழ்'      },
  { code: 'mr', label: 'Marathi',    native: 'ಮರಾಠಿ'      },
  { code: 'bn', label: 'Bengali',    native: 'বাংলা'      },
  { code: 'gu', label: 'Gujarati',   native: 'ગુજરાતી'    },
];

export default function LoginScreen() {
  const { user, loginUser, settings, setLanguage, showToast } = useApp();
  const [step, setStep] = useState<Step>('language');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState('');

  // If user already authenticated in Supabase but lacks phone
  useEffect(() => {
    if (user) {
      setLoading(false);
      setName(user.full_name || '');
      setEmail(user.email || '');
      if (!user.phone || user.phone.trim() === '') {
        setStep('complete_phone');
      }
    }
  }, [user]);

  // Listen directly to Supabase Auth State for instant OAuth Deep Link return
  useEffect(() => {
    let sub: any = null;
    import('../../lib/supabase').then(({ getClient }) => {
      const client = getClient();
      if (client) {
        const { data } = client.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            setLoading(false);
            const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'HeroHand User';
            const userEmail = session.user.email || '';
            setName(fullName);
            setEmail(userEmail);
            setStep('complete_phone');
          }
        });
        sub = data.subscription;
      }
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  // Safety timeout: Auto-reset loading if OAuth return takes more than 15s
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 15000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Direct, rock-solid Native & Web Google Sign-In (no broken GIS iframes)
  const handleGoogleSignInClick = async () => {
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
        setError('Database connection unavailable.');
        setLoading(false);
        return;
      }

      const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
      const redirectUrl = isNative 
        ? 'com.shramixs.customer://google-auth'
        : (typeof window !== 'undefined' ? window.location.href.split('#')[0] : undefined);

      const { data, error: oauthErr } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isNative,
        },
      });

      if (oauthErr) throw oauthErr;

      if (isNative && data?.url) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({
          url: data.url,
          presentationStyle: 'popover',
        });
        // Reset loading once browser opens so user isn't locked if they cancel
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err?.message || 'Google Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  // Save phone number and finalize login
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
      const currentUserId = user?.id || (await client?.auth.getUser())?.data?.user?.id;

      if (currentUserId && client) {
        await client.from('profiles').update({
          phone: cleanPhone,
          full_name: name.trim() || user?.full_name || 'HeroHand User',
          email: email.trim() || user?.email || undefined,
          language: settings.language,
          preferred_language: settings.language,
          consent_given: true,
          updated_at: new Date().toISOString(),
        }).eq('id', currentUserId);
      } else if (currentUserId) {
        await upsertProfile({
          id: currentUserId,
          full_name: name.trim() || user?.full_name || 'HeroHand User',
          phone: cleanPhone,
          email: email.trim() || undefined,
          language: settings.language,
          consent_given: true,
          preferred_language: settings.language,
        });
      }

      await loginUser(cleanPhone, name.trim() || user?.full_name || 'HeroHand User', 'customer');
      showToast('Profile ready! Welcome to HeroHand 🎉', 'success');
    } catch (err: any) {
      console.warn('Profile save notice:', err);
      await loginUser(cleanPhone, name.trim() || user?.full_name || 'HeroHand User', 'customer');
      showToast('Welcome to HeroHand 🎉', 'success');
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
            <img src={getAssetPath('/logo.png')} alt="HeroHand" style={{ width: 54, height: 54, objectFit: 'contain' }} onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }} />
            <ShieldCheck size={36} color="#F59E0B" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            HeroHand
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

  // ── 2. Complete Phone Step (Only after Google Authentication) ──
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
            Welcome, {name.split(' ')[0] || 'User'}! 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
            Please enter your 10-digit mobile number so local service specialists can contact you.
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
                <AlertCircle size={16} /> {error}
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
              {loading ? 'Finalizing Profile…' : 'Enter Home Screen →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Front Page: Clean Native/Web Google Sign-In ──
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0F7FF', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '52px 24px 36px', textAlign: 'center', position: 'relative' }}>
        <div style={{ width: 84, height: 84, borderRadius: 26, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <img src={getAssetPath('/logo.png')} alt="HeroHand" style={{ width: 62, height: 62, objectFit: 'contain' }} onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }} />
          <ShieldCheck size={44} color="#F59E0B" strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          HeroHand
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 500, margin: '0 0 16px' }}>
          Hands That Work · Heros Will Serve
        </p>

        {/* Feature Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#93C5FD' }}>
            ⚡ 15-Min Dispatch
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#86EFAC' }}>
            🛡️ Verified Pros
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#FDE047' }}>
            🔒 Safe & Secure
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div style={{ padding: '28px 20px 40px', flex: 1 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '28px 24px', boxShadow: '0 10px 40px -10px rgba(11, 61, 102, 0.12)', border: '1.5px solid #E2E8F0' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.3px' }}>
            Get Started
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 24, lineHeight: 1.4 }}>
            Sign in with your Google account to connect with verified local specialists.
          </p>

          {/* Real Google Sign-In Trigger */}
          <button
            onClick={handleGoogleSignInClick}
            disabled={loading}
            type="button"
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: 16,
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 800,
              fontSize: 16,
              border: '2px solid #E2E8F0',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease',
              marginBottom: 16,
            }}
          >
            {loading ? (
              <span style={{ color: '#0B3D66', fontWeight: 700 }}>Connecting to Google…</span>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginBottom: 18, color: '#DC2626', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Consent Checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
            <div
              onClick={() => setConsent(!consent)}
              style={{
                width: 22, height: 22, borderRadius: 7,
                border: `2px solid ${consent ? '#0B3D66' : '#CBD5E1'}`,
                background: consent ? '#0B3D66' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
                transition: 'all 0.15s ease',
              }}
            >
              {consent && <Check size={16} color="white" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
              I agree to the{' '}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowPrivacyModal(true); }}
                style={{ color: '#0B3D66', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Terms of Service & Privacy Policy
              </button>
            </span>
          </label>
        </div>
      </div>

      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
}
