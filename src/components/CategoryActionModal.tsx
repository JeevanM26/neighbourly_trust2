'use client';

import React, { useState, useEffect } from 'react';
import { ServiceCategory } from '../lib/types';
import { getCategoryLocalizedName } from '../lib/i18n';
import { 
  X, PhoneCall, Zap, MapPin, ArrowLeft, 
  CheckCircle2, Clock, ShieldCheck, Sparkles, Loader2, AlertCircle
} from 'lucide-react';

interface CategoryActionModalProps {
  category: ServiceCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (params: {
    category: ServiceCategory;
    addressText: string;
    description: string;
    customerName?: string;
    customerPhone?: string;
  }) => Promise<boolean>;
  initialAddress?: string;
  userLocation?: { lat: number; lng: number } | null;
  currentUser?: { id: string; full_name?: string; phone?: string } | null;
  language?: string;
  t?: (key: string) => string;
}

export const CategoryActionModal: React.FC<CategoryActionModalProps> = ({
  category,
  isOpen,
  onClose,
  onConfirmBooking,
  initialAddress = '',
  userLocation,
  currentUser,
  language = 'en',
  t = (k: string) => k,
}) => {
  const [step, setStep] = useState<'action' | 'book_form'>('action');
  const [address, setAddress] = useState(initialAddress);
  const [description, setDescription] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('action');
      setAddress(initialAddress || '');
      setDescription('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialAddress]);

  if (!isOpen || !category) return null;

  const localizedName = getCategoryLocalizedName(category, (language || 'en') as any);
  const hotlinePhone = '7975182162';

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!address.trim()) {
      setErrorMessage(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ' : 
        language === 'hi' ? 'कृपया अपना पता दर्ज करें' : 
        'Please enter your service address or landmark'
      );
      return;
    }

    if (!currentUser && (!guestPhone || guestPhone.replace(/\D/g, '').length < 10)) {
      setErrorMessage(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ' : 
        language === 'hi' ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें' : 
        'Please enter a valid 10-digit mobile number for dispatch updates'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onConfirmBooking({
        category,
        addressText: address.trim(),
        description: description.trim(),
        customerName: currentUser?.full_name || guestName.trim() || 'HeroHand Customer',
        customerPhone: currentUser?.phone || guestPhone.replace(/\D/g, ''),
      });

      if (success) {
        onClose();
      } else {
        setErrorMessage(
          language === 'kn' ? 'ಬುಕಿಂಗ್ ವಿಫಲವಾಗಿದೆ, ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ನೇರ ಕರೆ ಮಾಡಿ' : 
          language === 'hi' ? 'बुकिंग विफल रही, कृपया पुनः प्रयास करें या सीधे कॉल करें' : 
          'Unable to complete booking. Please try again or tap Call Now'
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong. Please try calling dispatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 27, 48, 0.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          width: '100%',
          maxWidth: 480,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drag / Handle Indicator */}
        <div style={{ padding: '12px 0 6px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 4, background: '#CBD5E1', borderRadius: 999 }} />
        </div>

        {/* Modal Header */}
        <div style={{
          padding: '8px 20px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #F1F5F9'
        }}>
          {step === 'book_form' ? (
            <button
              onClick={() => { setStep('action'); setErrorMessage(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#F1F5F9', border: 'none', borderRadius: 12,
                padding: '6px 12px', fontSize: 13, fontWeight: 800, color: '#0F172A',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} /> {language === 'kn' ? 'ಹಿಂದಕ್ಕೆ' : language === 'hi' ? 'वापस' : 'Back'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)', color: '#0284C7',
                fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                textTransform: 'uppercase', letterSpacing: '0.4px'
              }}>
                Instant Dispatch
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#F1F5F9', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748B'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '20px 20px 24px', overflowY: 'auto' }}>
          
          {step === 'action' ? (
            /* ─── STEP 1: CATEGORY SHOWCASE & CALL / BOOK CHOICES ─── */
            <div>
              {/* Category Showcase Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #081B2C 0%, #0B3D66 100%)',
                borderRadius: 22,
                padding: '20px 18px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 8px 24px rgba(11, 61, 102, 0.2)',
                marginBottom: 20,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', right: -20, top: -20, width: 100, height: 100,
                  borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', filter: 'blur(20px)'
                }} />

                {/* 3D Icon Render */}
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                }}>
                  {category.icon_url ? (
                    <img 
                      src={category.icon_url} 
                      alt={category.name_en} 
                      style={{ width: 62, height: 62, objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }} 
                    />
                  ) : (
                    <span style={{ fontSize: 32 }}>🛠️</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                    {localizedName}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8',
                      fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
                      border: '0.5px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      Starts ₹350/hr
                    </span>
                    <span style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600 }}>
                      Doorstep Service
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Assurance Perks */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: 18,
                padding: '14px 16px',
                border: '1px solid #E2E8F0',
                marginBottom: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                  <Clock size={16} color="#0284C7" />
                  <span>
                    {language === 'kn' ? '15-30 ನಿಮಿಷಗಳಲ್ಲಿ ಹತ್ತಿರದ ತಂತ್ರಜ್ಞ ಆಗಮನ' : 
                     language === 'hi' ? '15-30 मिनट में निकटतम तकनीशियन का आगमन' : 
                     'Nearby technician assigned within 15-30 mins'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                  <ShieldCheck size={16} color="#16A34A" />
                  <span>
                    {language === 'kn' ? '100% ಆಧಾರ್ ಮತ್ತು ಹಿನ್ನೆಲೆ ಪರಿಶೀಲಿತ ತಂತ್ರಜ್ಞರು' : 
                     language === 'hi' ? '100% आधार एवं बैकग्राउंड सत्यापित विशेषज्ञ' : 
                     '100% Aadhaar & background verified professionals'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155', fontWeight: 700 }}>
                  <CheckCircle2 size={16} color="#EAB308" />
                  <span>
                    {language === 'kn' ? 'ಸ್ಥಿರ ಮತ್ತು ಪಾರದರ್ಶಕ ದರ (ಯಾವುದೇ ಗುಪ್ತ ಶುಲ್ಕವಿಲ್ಲ)' : 
                     language === 'hi' ? 'मानक एवं पारदर्शी दरें (कोई छिपा शुल्क नहीं)' : 
                     'Fixed transparent pricing with zero surprise charges'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: 1. Call Now & 2. Book Now */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* 1. CALL NOW BUTTON */}
                <a
                  href={`tel:${hotlinePhone}`}
                  style={{
                    background: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
                    color: 'white',
                    padding: '16px 20px',
                    borderRadius: 18,
                    textDecoration: 'none',
                    fontWeight: 900,
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 6px 20px rgba(34, 197, 94, 0.35)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <PhoneCall size={20} />
                  <span>
                    {language === 'kn' ? 'ಈಗಲೇ ಕರೆ ಮಾಡಿ (ತಕ್ಷಣದ ಸಹಾಯ)' : 
                     language === 'hi' ? 'अभी कॉल करें (त्वरित सहायता)' : 
                     'Call Now (+91 7975182162)'}
                  </span>
                </a>

                {/* 2. BOOK NOW BUTTON */}
                <button
                  type="button"
                  onClick={() => { setStep('book_form'); setErrorMessage(''); }}
                  style={{
                    background: 'linear-gradient(135deg, #0B3D66 0%, #041B30 100%)',
                    color: 'white',
                    padding: '16px 20px',
                    borderRadius: 18,
                    border: 'none',
                    fontWeight: 900,
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(11, 61, 102, 0.25)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Zap size={20} fill="#38BDF8" color="#38BDF8" />
                  <span>
                    {language === 'kn' ? 'ಆನ್‌ಲೈನ್ ಬುಕ್ ಮಾಡಿ ➔' : 
                     language === 'hi' ? 'ऑनलाइन बुक करें ➔' : 
                     'Book Now Online ➔'}
                  </span>
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                  {language === 'kn' ? 'ಹೀರೋ ಹ್ಯಾಂಡ್ ನಿಯಂತ್ರಣ ಕೊಠಡಿಯಿಂದ ನಿರ್ವಹಿಸಲ್ಪಡುತ್ತದೆ' : 
                   language === 'hi' ? 'हीरो हैंड कंट्रोल रूम द्वारा सीधे प्रबंधित' : 
                   'Directly dispatched & coordinated by Hero Hand Dispatch Desk'}
                </span>
              </div>
            </div>
          ) : (
            /* ─── STEP 2: QUICK BOOKING CONFIRMATION FORM ─── */
            <form onSubmit={handleBookSubmit}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>🛠️</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
                    {localizedName}
                  </span>
                  <span style={{
                    marginLeft: 'auto', background: '#FEF3C7', color: '#92400E',
                    fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8
                  }}>
                    Standard ₹350/hr
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                  {language === 'kn' ? 'ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ; ಹತ್ತಿರದ ತಂತ್ರಜ್ಞರನ್ನು ನಿಯೋಜಿಸಲಾಗುತ್ತದೆ' : 
                   language === 'hi' ? 'विवरण भरें; तुरंत नजदीकी तकनीशियन को भेजा जाएगा' : 
                   'Confirm details; we will search and dispatch the nearest expert'}
                </p>
              </div>

              {errorMessage && (
                <div style={{
                  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
                  padding: '10px 12px', color: '#DC2626', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Guest Contact Inputs if not logged in */}
              {!currentUser && (
                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                      {language === 'kn' ? 'ನಿಮ್ಮ ಹೆಸರು' : language === 'hi' ? 'आपका नाम' : 'Your Full Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 12,
                        padding: '11px 14px', fontSize: 14, color: '#0F172A', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                      {language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಕಡ್ಡಾಯ)' : language === 'hi' ? 'मोबाइल नंबर (आवश्यक)' : 'Mobile Number (Required)'} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 12, fontSize: 13, fontWeight: 800, color: '#64748B' }}>
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="7975182162"
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 12,
                          padding: '11px 14px 11px 44px', fontSize: 14, color: '#0F172A', outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Service Address / Landmark */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
                    {language === 'kn' ? 'ಸೇವಾ ವಿಳಾಸ / ಗುರುತಿನ ಸ್ಥಳ' : language === 'hi' ? 'सेवा का पता / लैंडमार्क' : 'Service Address / Landmark'} *
                  </label>
                  {initialAddress && (
                    <button
                      type="button"
                      onClick={() => setAddress(initialAddress)}
                      style={{
                        background: 'none', border: 'none', color: '#0284C7',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2
                      }}
                    >
                      <MapPin size={11} /> Use GPS
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    language === 'kn' ? 'ಮನೆ ನಂ, ರಸ್ತೆ, ಹತ್ತಿರದ ಗುರುತಿನ ಸ್ಥಳ, ಪ್ರದೇಶ...' : 
                    language === 'hi' ? 'मकान नं, गली, नजदीकी लैंडमार्क, क्षेत्र...' : 
                    'Flat/Door No., Street, Landmark, Area...'
                  }
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 12,
                    padding: '10px 14px', fontSize: 14, color: '#0F172A', outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Issue Description / Notes */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  {language === 'kn' ? 'ಸಮಸ್ಯೆಯ ವಿವರ / ಸೂಚನೆಗಳು (ಐಚ್ಛಿಕ)' : 
                   language === 'hi' ? 'समस्या का विवरण / निर्देश (वैकल्पिक)' : 
                   'Issue Notes / Instructions (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={
                    language === 'kn' ? 'ಉದಾ: ಫ್ಯಾನ್ ತಿರುಗುತ್ತಿಲ್ಲ, ಬಾತ್‌ರೂಮ್ ಪೈಪ್ ಲೀಕ್...' : 
                    language === 'hi' ? 'उदा: पंखा नहीं चल रहा, नल से पानी टपक रहा है...' : 
                    'e.g. Fan not working, kitchen pipe leak, urgent...'
                  }
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 12,
                    padding: '11px 14px', fontSize: 14, color: '#0F172A', outline: 'none'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: isSubmitting ? '#94A3B8' : 'linear-gradient(135deg, #0B3D66 0%, #041B30 100%)',
                  color: 'white',
                  padding: '15px 20px',
                  borderRadius: 16,
                  border: 'none',
                  fontWeight: 900,
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(11, 61, 102, 0.25)',
                  transition: 'background 0.2s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} color="#38BDF8" />
                    <span>
                      {language === 'kn' ? 'ಬುಕಿಂಗ್ ಖಚಿತಪಡಿಸಿ (ತಕ್ಷಣ ನಿಯೋಜಿಸಿ)' : 
                       language === 'hi' ? 'बुकिंग कन्फर्म करें (तुरंत भेजें)' : 
                       'Confirm Booking & Dispatch Hero'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
