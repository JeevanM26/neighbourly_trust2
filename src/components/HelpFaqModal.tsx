'use client';
import React, { useState } from 'react';
import { 
  X, HelpCircle, Phone, Mail, MessageSquare, ChevronDown, 
  ChevronUp, ShieldCheck, Clock, Zap, CheckCircle2, Headphones
} from 'lucide-react';

interface HelpFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQS = [
  {
    q: "How do I book a service specialist?",
    a: "Browse categories on the Home screen or use the Map to find verified nearby specialists. Tap 'Book Specialist' or 'Book Now' to send an instant request. Once a technician accepts, you can track their status in real-time."
  },
  {
    q: "How does the 4-digit completion PIN work?",
    a: "To ensure safety and confirm the job is finished properly, a unique 4-digit PIN is generated for your active order (visible on your Bookings screen). Share this PIN with the specialist only after the service is fully completed."
  },
  {
    q: "Are voice calls through the app free?",
    a: "Yes! All in-app voice calls are 100% free and peer-to-peer encrypted via WebRTC. Your private phone number is completely shielded from the specialist."
  },
  {
    q: "How and when do I pay for the service?",
    a: "You pay the specialist directly upon job completion using Cash or UPI (Google Pay, PhonePe, Paytm). The technician will enter the final agreed amount before you provide the completion PIN."
  },
  {
    q: "How do I cancel a booking request?",
    a: "You can cancel a booking anytime from the Bookings screen or the specialist profile sheet before the technician arrives at your location."
  },
  {
    q: "How are specialists verified on HeroHand?",
    a: "Every specialist undergoes identity verification and skill checks before being approved to receive booking requests on our platform."
  }
];

const HELPLINES = [
  { label: "Primary Helpline", phone: "8867269712" },
  { label: "Support Line 2", phone: "9480150995" },
  { label: "Support Line 3", phone: "6364419562" },
];

export default function HelpFaqModal({ isOpen, onClose }: HelpFaqModalProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(4, 27, 48, 0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white', borderRadius: 24, width: '100%', maxWidth: 520,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #041B30 0%, #0B3D66 100%)',
          padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', color: 'white', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Headphones size={22} color="#F59E0B" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                Help & Support Center
              </h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0', fontWeight: 500 }}>
                HeroHand 24x7 Customer Assistance
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          padding: '20px 24px', overflowY: 'auto', flex: 1,
          fontSize: 13, color: '#334155', lineHeight: 1.6
        }}>
          
          {/* Direct Helplines Section */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Phone size={15} color="#0B3D66" />
              <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Direct Helplines (24x7 Support)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {HELPLINES.map((h, i) => (
                <div 
                  key={i} 
                  style={{
                    background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                    borderRadius: 14, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>{h.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>+91 {h.phone}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a
                      href={`tel:${h.phone}`}
                      style={{
                        background: '#0B3D66', color: 'white', textDecoration: 'none',
                        padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <Phone size={12} /> Call
                    </a>
                    {i === 0 && (
                      <a
                        href={`https://wa.me/91${h.phone}?text=${encodeURIComponent('Hello HeroHand Support Team, I need assistance with a service booking.')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#22C55E', color: 'white', textDecoration: 'none',
                          padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                          display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <MessageSquare size={12} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Support Box */}
          <div style={{ 
            background: '#EFF6FF', border: '1.5px solid #BFDBFE', 
            borderRadius: 14, padding: '14px', marginBottom: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Official Email Support</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#1E293B', marginTop: 2 }}>herohand4@gmail.com</div>
            </div>
            <a
              href="mailto:herohand4@gmail.com?subject=HeroHand%20Customer%20Support%20Inquiry"
              style={{
                background: '#2563EB', color: 'white', textDecoration: 'none',
                padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <Mail size={12} /> Send Email
            </a>
          </div>

          {/* Frequently Asked Questions */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <HelpCircle size={15} color="#0B3D66" />
              <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Frequently Asked Questions
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div 
                    key={idx}
                    style={{
                      border: `1.5px solid ${isOpen ? '#0B3D66' : '#E2E8F0'}`,
                      borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s ease'
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{
                        width: '100%', padding: '12px 14px', background: isOpen ? '#F8FAFC' : 'white',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 800, color: isOpen ? '#0B3D66' : '#1E293B' }}>
                        {faq.q}
                      </span>
                      {isOpen ? <ChevronUp size={16} color="#0B3D66" /> : <ChevronDown size={16} color="#94A3B8" />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: '10px 14px 14px', background: '#F8FAFC', fontSize: 12.5, color: '#475569', lineHeight: 1.5, borderTop: '1px solid #F1F5F9' }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #F1F5F9',
          display: 'flex', gap: 10, background: '#F8FAFC', flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '12px', borderRadius: 14,
              background: '#0B3D66', color: 'white', fontWeight: 800,
              fontSize: 14, border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(11,61,102,0.2)'
            }}
          >
            Close Help Center
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
