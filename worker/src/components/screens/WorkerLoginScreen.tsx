'use client';
import React, { useState, useEffect } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { ServiceCategory, getAssetPath } from '../../lib/types';
import { getClient, fetchServiceCategories } from '../../lib/supabase';
import { 
  ShieldCheck, Check, ChevronRight,
  Zap, Droplet, Hammer, Paintbrush, Sparkles, Wrench, Bug, Flame, Scissors, Car, User
} from 'lucide-react';
import PrivacyPolicyModal from '../PrivacyPolicyModal';

const CategoryIcon = ({ slug, size = 24 }: { slug: string, size?: number }) => {
  const s = (slug || '').toLowerCase();
  if (s.includes('elec')) return <Zap size={size} color="#F59E0B" />;
  if (s.includes('plumb')) return <Droplet size={size} color="#38BDF8" />;
  if (s.includes('carp')) return <Hammer size={size} color="#FB923C" />;
  if (s.includes('paint')) return <Paintbrush size={size} color="#C084FC" />;
  if (s.includes('clean')) return <Sparkles size={size} color="#34D399" />;
  if (s.includes('pest')) return <Bug size={size} color="#F87171" />;
  if (s.includes('ac') || s.includes('appliance')) return <Flame size={size} color="#60A5FA" />;
  if (s.includes('salon') || s.includes('barber')) return <Scissors size={size} color="#F472B6" />;
  if (s.includes('mechanic') || s.includes('auto')) return <Car size={size} color="#818CF8" />;
  return <Wrench size={size} color="#059669" />;
};

type Step = 'login' | 'profile_phone' | 'skills';

export default function WorkerLoginScreen() {
  const { worker, completeOnboarding, isNewWorker, showToast } = useWorker();
  const [step, setStep] = useState<Step>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchServiceCategories().then(data => setCategories(data));
  }, []);

  useEffect(() => {
    if (worker) {
      setLoading(false);
      if (worker.full_name) setName(worker.full_name);
      if (worker.phone) setPhone(worker.phone);

      if (isNewWorker || !worker.phone || worker.phone.trim() === '') {
        setStep('profile_phone');
      } else if (!worker.skills || worker.skills.length === 0) {
        setStep('skills');
      }
    }
  }, [worker, isNewWorker]);

  const handleGoogleSignIn = async () => {
    if (!consent) {
      setError('Please agree to the Partner Terms & Privacy Policy.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const client = getClient();
      if (!client) {
        setError('Authentication service unavailable.');
        setLoading(false);
        return;
      }
      const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
      const redirectUrl = isNative 
        ? 'com.shramixs.worker://google-auth'
        : (typeof window !== 'undefined' ? window.location.href.split('#')[0] : undefined);

      const { data, error: authErr } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isNative,
        },
      });
      if (authErr) throw authErr;

      if (isNative && data?.url) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({
          url: data.url,
          windowName: '_self',
          presentationStyle: 'popover',
        });
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Google Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSaveProfilePhone = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setError('');
    setStep('skills');
  };

  const handleCompleteOnboarding = async () => {
    if (selectedCategories.size === 0) {
      showToast('Select at least one skill category.', 'error');
      return;
    }
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const client = getClient();
      if (worker?.id && client) {
        await client.from('profiles').update({
          phone: cleanPhone,
          full_name: name.trim() || worker.full_name,
          email: worker.email || undefined,
          updated_at: new Date().toISOString(),
        }).eq('id', worker.id);
      }
      await completeOnboarding(name.trim(), Array.from(selectedCategories));
      showToast('Profile setup complete! Welcome to HeroHand 🛠️', 'success');
    } catch (err) {
      console.warn('Partner onboarding notice:', err);
      completeOnboarding(name.trim(), Array.from(selectedCategories));
    } finally {
      setLoading(false);
    }
  };

  // ── 1. Front Page: Pure Google Sign-In ──
  if (step === 'login') {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '52px 24px 36px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <img src={getAssetPath('/logo.png')} alt="HeroHand" style={{ width: 62, height: 62, objectFit: 'contain' }} onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }} />
            <ShieldCheck size={42} color="#FCD34D" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', margin: '0 0 6px' }}>
            HeroHand
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, margin: '0 0 16px' }}>
            One App. All Workers. · HeroHand
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#A7F3D0' }}>
              💰 Daily Payouts
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#FDE047' }}>
              📍 Local Job Alerts
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#93C5FD' }}>
              ⭐ Build Reputation
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 20px 40px', flex: 1 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '28px 24px', boxShadow: '0 10px 40px -10px rgba(5, 150, 105, 0.12)', border: '1.5px solid #D1FAE5' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#065F46', marginBottom: 6, letterSpacing: '-0.3px' }}>
              Partner Sign-In
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 24, lineHeight: 1.4 }}>
              Sign in with your Google account to start receiving nearby service bookings.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 16,
                background: 'white',
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
                marginBottom: 20,
              }}
            >
              {loading ? (
                <span style={{ color: '#059669', fontWeight: 700 }}>Connecting to Google…</span>
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

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
              <div
                onClick={() => setConsent(!consent)}
                style={{
                  width: 22, height: 22, borderRadius: 7,
                  border: `2px solid ${consent ? '#059669' : '#CBD5E1'}`,
                  background: consent ? '#059669' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {consent && <Check size={14} color="white" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>
                I agree to the Partner Terms and{' '}
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPrivacyModal(true);
                  }}
                  style={{ color: '#059669', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Privacy Policy
                </span>.
              </span>
            </label>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginTop: 10, color: '#DC2626', fontSize: 12, fontWeight: 700 }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <PrivacyPolicyModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />
      </div>
    );
  }

  // ── 2. Profile Phone Step (For Partners after Google Login) ──
  if (step === 'profile_phone') {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '48px 24px 32px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
            Partner Profile Setup
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0, fontWeight: 500 }}>
            Enter your details so customers in your area can reach you for bookings.
          </p>
        </div>

        <div style={{ padding: '24px 20px', flex: 1 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '28px 22px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)', border: '1.5px solid #D1FAE5' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Full Name
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '0 14px' }}>
                <User size={18} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  style={{
                    flex: 1, padding: '14px 12px', border: 'none', background: 'transparent',
                    fontSize: 15, fontWeight: 600, color: '#0F172A', outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Mobile Number (For Job SMS & Calls)
              </label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ background: '#F1F5F9', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', fontSize: 15, fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span>🇮🇳</span> +91
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                  style={{
                    flex: 1, minWidth: 0, padding: '14px 16px', borderRadius: 14,
                    border: '1.5px solid #E2E8F0', fontSize: 16, fontWeight: 700,
                    outline: 'none', background: '#F8FAFC', color: '#0F172A', letterSpacing: '0.5px'
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginBottom: 18, color: '#DC2626', fontSize: 12, fontWeight: 700 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSaveProfilePhone}
              disabled={phone.length < 10 || !name.trim()}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                background: phone.length < 10 || !name.trim() ? '#CBD5E1' : 'linear-gradient(135deg, #059669, #065F46)',
                color: phone.length < 10 || !name.trim() ? '#64748B' : 'white',
                fontWeight: 800,
                fontSize: 16,
                border: 'none',
                cursor: phone.length < 10 || !name.trim() ? 'not-allowed' : 'pointer',
                boxShadow: phone.length < 10 || !name.trim() ? 'none' : '0 6px 20px rgba(5, 150, 105, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              Select Services →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Skills & Categories Selection Step ──
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4', position: 'relative' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '40px 24px 28px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px' }}>
          Select Your Services
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
          Choose all categories where you can provide professional services.
        </p>
      </div>

      <div style={{ padding: '24px 20px 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map(cat => {
            const selected = selectedCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategories(prev => {
                    const next = new Set(prev);
                    if (next.has(cat.id)) next.delete(cat.id);
                    else next.add(cat.id);
                    return next;
                  });
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'white',
                  border: `2px solid ${selected ? '#059669' : '#E2E8F0'}`,
                  borderRadius: 18,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: selected ? '0 4px 14px rgba(5, 150, 105, 0.12)' : 'none',
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: selected ? '#D1FAE5' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CategoryIcon slug={cat.slug || cat.name_en} size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: selected ? '#065F46' : '#1E293B' }}>
                    {cat.name_en}
                  </div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: selected ? '#059669' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selected ? <Check size={14} color="white" strokeWidth={3} /> : <span style={{ fontSize: 14, color: '#94A3B8' }}>+</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px 24px',
        background: 'linear-gradient(to top, rgba(240, 253, 244, 0.98) 75%, rgba(240, 253, 244, 0))',
        backdropFilter: 'blur(6px)',
        zIndex: 50
      }}>
        <button
          onClick={handleCompleteOnboarding}
          disabled={selectedCategories.size === 0 || loading}
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: 16, 
            background: selectedCategories.size === 0 || loading ? '#CBD5E1' : 'linear-gradient(135deg, #059669, #065F46)', 
            color: selectedCategories.size === 0 || loading ? '#64748B' : 'white', 
            fontWeight: 800, 
            fontSize: 16, 
            border: 'none', 
            cursor: selectedCategories.size === 0 || loading ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 8, 
            boxShadow: selectedCategories.size > 0 && !loading ? '0 6px 20px rgba(5,150,105,0.35)' : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          {loading ? 'Starting Partner Dashboard…' : (
            <>
              Start Taking Bookings 🚀 <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
