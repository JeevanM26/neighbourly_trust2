'use client';
import React, { useState } from 'react';
import { 
  X, HelpCircle, Phone, Mail, MessageSquare, ChevronDown, 
  ChevronUp, ShieldCheck, Wrench, IndianRupee, MapPin, Headphones
} from 'lucide-react';

interface HelpFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WORKER_FAQS = [
  {
    q: "How do I receive incoming job booking requests?",
    a: "Make sure your status toggle on the Dashboard is set to 'Online'. When a customer in your service radius requests a service matching your skill categories, you'll receive a live audio chime, countdown alert, and push notification to Accept or Decline."
  },
  {
    q: "How does the 4-digit job completion PIN work?",
    a: "After arriving and finishing the task, tap 'Complete Job'. Enter the final cash/price collected from the customer and request their 4-digit completion PIN (displayed on the customer's app). Entering the correct PIN instantly settles the job and credits your earnings."
  },
  {
    q: "How do I collect payment from the customer?",
    a: "You collect payment directly from the customer upon job completion via Cash or personal UPI QR code (Google Pay, PhonePe, Paytm). You keep 92% of all earned revenue."
  },
  {
    q: "How do I update my skills or service radius?",
    a: "Go to the Profile tab. Under 'My Skills & Services', tap 'Manage' to add or remove trade categories (Electrician, Plumber, Carpenter, etc.). Use the Service Radius slider to adjust your coverage distance between 2 km and 15 km."
  },
  {
    q: "What if a customer is unresponsive or cancels?",
    a: "If a customer cancels, the job is immediately removed from your active queue. If you cannot reach the customer upon arrival, you can call them directly via the in-app phone button or contact our 24x7 Partner Support team."
  }
];

const HELPLINES = [
  { label: "Partner Priority Desk", phone: "8867269712" },
  { label: "Partner Helpline 2", phone: "9480150995" },
  { label: "Partner Helpline 3", phone: "6364419562" },
];

export default function HelpFaqModal({ isOpen, onClose }: HelpFaqModalProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(6, 78, 59, 0.8)', backdropFilter: 'blur(8px)',
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
          background: 'linear-gradient(135deg, #064E3B 0%, #059669 100%)',
          padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', color: 'white', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Headphones size={22} color="#FDE68A" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                Partner Support Center
              </h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: '2px 0 0', fontWeight: 500 }}>
                HeroHand Specialist 24x7 Assistance
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
              <Phone size={15} color="#059669" />
              <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Partner Priority Helplines
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
                        background: '#059669', color: 'white', textDecoration: 'none',
                        padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <Phone size={12} /> Call
                    </a>
                    {i === 0 && (
                      <a
                        href={`https://wa.me/91${h.phone}?text=${encodeURIComponent('Hello HeroHand Partner Team, I am a registered specialist needing assistance.')}`}
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
            background: '#ECFDF5', border: '1.5px solid #A7F3D0', 
            borderRadius: 14, padding: '14px', marginBottom: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>Partner Support Email</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#064E3B', marginTop: 2 }}>herohand4@gmail.com</div>
            </div>
            <a
              href="mailto:herohand4@gmail.com?subject=HeroHand%20Partner%20Support%20Inquiry"
              style={{
                background: '#059669', color: 'white', textDecoration: 'none',
                padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <Mail size={12} /> Send Email
            </a>
          </div>

          {/* Partner FAQs */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <HelpCircle size={15} color="#059669" />
              <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Technician & Partner FAQs
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WORKER_FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div 
                    key={idx}
                    style={{
                      border: `1.5px solid ${isOpen ? '#059669' : '#E2E8F0'}`,
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
                      <span style={{ fontSize: 13, fontWeight: 800, color: isOpen ? '#065F46' : '#1E293B' }}>
                        {faq.q}
                      </span>
                      {isOpen ? <ChevronUp size={16} color="#059669" /> : <ChevronDown size={16} color="#94A3B8" />}
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
              background: '#059669', color: 'white', fontWeight: 800,
              fontSize: 14, border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5,150,105,0.2)'
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
