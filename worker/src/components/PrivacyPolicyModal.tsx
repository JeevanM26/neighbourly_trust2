'use client';
import React from 'react';
import { X, ShieldCheck, MapPin, Mic, Lock, UserCheck, Trash2, Mail, Phone } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(6, 95, 70, 0.8)', backdropFilter: 'blur(8px)',
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
          background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
          padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', color: 'white', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldCheck size={22} color="#FDE68A" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                Partner Privacy Policy
              </h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: '2px 0 0', fontWeight: 500 }}>
                HeroHand Partner · DPDP Act 2023 & Google Play Compliant
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

        {/* Scrollable Policy Content */}
        <div style={{
          padding: '20px 24px', overflowY: 'auto', flex: 1,
          fontSize: 13, color: '#334155', lineHeight: 1.6
        }}>
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '12px 14px', marginBottom: 18, fontSize: 12, color: '#047857', fontWeight: 600 }}>
            📌 <b>Effective Date:</b> August 2026<br />
            <b>Entity:</b> Neighborly Trust Technologies (HeroHand Partner Portal), Shivamogga, Karnataka, India.
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 12, marginBottom: 6 }}>
            1. Specialist Information We Collect
          </h3>
          <ul style={{ paddingLeft: 20, margin: '0 0 14px' }}>
            <li><b>Mobile Number & Google Profile:</b> For secure sign-in, specialist authentication, and communication.</li>
            <li><b>Service Category & Hourly Rates:</b> To match you with appropriate customer leads in your trade.</li>
            <li><b>Location (GPS):</b> Used while online to receive job requests within your configured service radius (2–15 km).</li>
            <li><b>Microphone / Audio:</b> Used for direct WebRTC voice calls with customers. <b>Calls are peer-to-peer encrypted and NEVER recorded or stored.</b></li>
            <li><b>UPI ID (Optional):</b> Provided by you for direct job payment settlements.</li>
          </ul>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 16, marginBottom: 6 }}>
            2. Google User Data Protection
          </h3>
          <p style={{ margin: '0 0 14px' }}>
            We only access your Google name and email for partner authentication. We never sell, transfer, or share Google user data with external advertisers or data brokers.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 16, marginBottom: 6 }}>
            3. Privacy Shielding & Security
          </h3>
          <p style={{ margin: '0 0 14px' }}>
            Your direct phone number is never broadcast publicly. Customers reach you via in-app WebRTC calls or system notifications. All data is protected with TLS 1.3 encryption and PostgreSQL security controls.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 16, marginBottom: 6 }}>
            4. Account Deletion & Data Rights (DPDP Act 2023)
          </h3>
          <p style={{ margin: '0 0 14px' }}>
            You have the right to request deletion of your partner profile, leads, and earnings history at any time. You can trigger permanent account deletion with 1 tap under <b>Profile &gt; Delete Worker Account</b>.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 16, marginBottom: 6 }}>
            5. Contact Partner Support
          </h3>
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={15} color="#059669" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                herohand4@gmail.com
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={15} color="#059669" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                +91 8867269712 · +91 9480150995 · +91 6364419562
              </span>
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
            I Understand & Agree
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
