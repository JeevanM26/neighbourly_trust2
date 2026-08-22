'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { ShieldCheck, Check, ChevronRight, Sparkles, User, Wrench, AlertCircle } from 'lucide-react';
import { getAssetPath } from '../../lib/types';
import { getClient } from '../../lib/supabase';

type Step = 'login' | 'profile_phone' | 'skills';

const GOOGLE_CLIENT_ID = '281299979796-1i0mjfdb7ensasgkq6dj8uhiqpoor6ai.apps.googleusercontent.com';

const SERVICE_SKILLS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Electrician', icon: '⚡', desc: 'Wiring, fixtures & power repairs' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Plumber', icon: '🔧', desc: 'Pipes, taps & leakage fixes' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Cleaner', icon: '✨', desc: 'Home, kitchen & sofa deep cleaning' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'AC Repair', icon: '❄️', desc: 'Servicing, gas refill & cooling' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Painter', icon: '🎨', desc: 'Interior & exterior wall painting' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Carpenter', icon: '🪚', desc: 'Furniture assembly & wood work' },
];

export default function WorkerLoginScreen() {
  const { worker, completeOnboarding, showToast } = useWorker();
  const [step, setStep] = useState<Step>('login');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState('');
  // Listen directly to Supabase Auth State for instant OAuth Deep Link return
  useEffect(() => {
    let sub: any = null;
    import('../../lib/supabase').then(({ getClient }) => {
      const client = getClient();
      if (client) {
        const { data } = client.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            setLoading(false);
            const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'HOS Partner';
            const userEmail = session.user.email || '';
            setName(fullName);
            setEmail(userEmail);
            setStep('skills');
          }
        });
        sub = data.subscription;
      }
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  // Safety timeout: Auto-reset loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Initialize Google GIS One Tap
  useEffect(() => {
    const loadGoogleGis = () => {
      if (typeof window === 'undefined') return;

      const scriptId = 'google-gis-script-worker';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogleOneTap;
        document.head.appendChild(script);
      } else if ((window as any).google?.accounts?.id) {
        initGoogleOneTap();
      }
    };

    const initGoogleOneTap = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
        });

        if (googleBtnContainerRef.current) {
          google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'center',
            width: 320,
          });
        }
      } catch (e) {
        console.warn('Google GIS initialization:', e);
      }
    };

    loadGoogleGis();
  }, [step]);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setError('Google Sign-in returned no credential.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const client = getClient();
      if (!client) throw new Error('Supabase client connection unavailable.');

      const { data, error: authErr } = await client.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (authErr) console.warn('Worker signInWithIdToken note:', authErr);

      const authUser = data?.user || (await client.auth.getUser()).data.user;
      const fullName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || 'HOS Partner';
      const userEmail = authUser?.email || '';
      const userId = authUser?.id;

      if (userId) {
        await upsertProfile({
          id: userId,
          full_name: fullName,
          email: userEmail,
          role: 'worker',
          consent_given: true,
        });
      }

      setName(fullName);
      setEmail(userEmail);
      setStep('skills');
    } catch (err: any) {
      console.error('Worker Google Auth Error:', err);
      setError(err?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: string) => {
    const next = new Set(selectedCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCategories(next);
  };

  const handleGoogleSignInClick = async () => {
    if (!consent) {
      setError('Please accept the Partner Terms to continue.');
      return;
    }
    setError('');
    setLoading(true);

    const google = (window as any).google;
    if (google?.accounts?.id) {
      try {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            triggerGoogleOAuthFallback();
          } else {
            setLoading(false);
          }
        });
        return;
      } catch (e) {
        console.warn('GIS prompt error:', e);
      }
    }

    await triggerGoogleOAuthFallback();
  };

  const triggerGoogleOAuthFallback = async () => {
    try {
      const client = getClient();
      if (!client) throw new Error('Authentication service unavailable.');

      const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
      const redirectUrl = isNative 
        ? 'com.shramixs.worker://google-auth'
        : (typeof window !== 'undefined' ? window.location.href.split('#')[0] : undefined);

      const { error: authErr } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (authErr) throw authErr;
    } catch (err: any) {
      setError(err?.message || 'Google Sign-in failed.');
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (selectedCategories.size === 0) {
      showToast('Select at least one skill category.', 'error');
      return;
    }
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '') || '7975182162';
      const client = getClient();
      const currentUserId = worker?.id || (await client?.auth.getUser())?.data?.user?.id;

      if (currentUserId && client) {
        await client.from('profiles').update({
          phone: cleanPhone,
          full_name: name.trim() || worker?.full_name || 'HOS Partner',
          email: email.trim() || worker?.email || undefined,
          updated_at: new Date().toISOString(),
        }).eq('id', currentUserId);
      }
      await completeOnboarding(name.trim() || 'HOS Partner', Array.from(selectedCategories));
      showToast('Profile setup complete! Welcome to HOS: Workers 🛠️', 'success');
    } catch (err) {
      console.warn('Partner onboarding notice:', err);
      completeOnboarding(name.trim() || 'HOS Partner', Array.from(selectedCategories));
    } finally {
      setLoading(false);
    }
  };

  // ── 1. Front Page: Real Google Sign-In ──
  if (step === 'login') {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '52px 24px 36px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <img src={getAssetPath('/logo.png')} alt="HOS: Workers" style={{ width: 62, height: 62, objectFit: 'contain' }} onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }} />
            <ShieldCheck size={42} color="#FCD34D" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', margin: '0 0 6px' }}>
            HOS: Workers
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, margin: '0 0 16px' }}>
            One App. All Workers. · ShramiXs Partner
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#A7F3D0' }}>
              💰 92% Payout
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#FDE047' }}>
              📍 Local Jobs
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
              ⚡ Instant Payouts
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 20px 40px', flex: 1 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '28px 24px', boxShadow: '0 10px 40px -10px rgba(6, 95, 70, 0.12)', border: '1.5px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.3px' }}>
              Partner Onboarding
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 24, lineHeight: 1.4 }}>
              Sign in with your Google account to register and start receiving gig dispatch radar alerts.
            </p>

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
                <span style={{ color: '#065F46', fontWeight: 700 }}>Connecting to Google…</span>
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

            <div ref={googleBtnContainerRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }} />

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginBottom: 18, color: '#DC2626', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
              <div
                onClick={() => setConsent(!consent)}
                style={{
                  width: 22, height: 22, borderRadius: 7,
                  border: `2px solid ${consent ? '#065F46' : '#CBD5E1'}`,
                  background: consent ? '#065F46' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                  transition: 'all 0.15s ease',
                }}
              >
                {consent && <Check size={16} color="white" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                I agree to the HOS Partner Terms, code of conduct &amp; 8% commission policy.
              </span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. Skills Selection Step ──
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '48px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Wrench size={20} color="#FCD34D" />
          <span style={{ color: '#FCD34D', fontSize: 12, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Skills &amp; Expertise
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
          Select Your Services
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
          Choose the service categories you can accept and fulfill in your area.
        </p>
      </div>

      <div style={{ padding: '20px 20px 100px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SERVICE_SKILLS.map((skill) => {
            const active = selectedCategories.has(skill.id);
            return (
              <div
                key={skill.id}
                onClick={() => toggleCategory(skill.id)}
                style={{
                  padding: '16px 18px',
                  borderRadius: 18,
                  border: `2px solid ${active ? '#065F46' : '#E2E8F0'}`,
                  background: active ? '#ECFDF5' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: active ? '0 4px 14px rgba(6, 95, 70, 0.12)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 28, width: 44, height: 44, borderRadius: 14, background: active ? '#D1FAE5' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {skill.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: active ? '#065F46' : '#0F172A' }}>
                    {skill.name}
                  </div>
                  <div style={{ fontSize: 12, color: active ? '#047857' : '#64748B', fontWeight: 500 }}>
                    {skill.desc}
                  </div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${active ? '#065F46' : '#CBD5E1'}`, background: active ? '#065F46' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {active && <Check size={14} color="white" strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 28px', background: 'linear-gradient(to top, #F0FDF4 80%, rgba(240, 253, 244, 0))', backdropFilter: 'blur(8px)', zIndex: 10 }}>
        <button
          onClick={handleCompleteOnboarding}
          disabled={loading || selectedCategories.size === 0}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            background: selectedCategories.size === 0 ? '#CBD5E1' : 'linear-gradient(135deg, #065F46, #047857)',
            color: selectedCategories.size === 0 ? '#64748B' : 'white',
            fontWeight: 800,
            fontSize: 16,
            border: 'none',
            cursor: selectedCategories.size === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: selectedCategories.size === 0 ? 'none' : '0 6px 20px rgba(6, 95, 70, 0.35)',
          }}
        >
          {loading ? 'Finalizing Setup…' : `Start Working (${selectedCategories.size} selected) →`}
        </button>
      </div>
    </div>
  );
}
