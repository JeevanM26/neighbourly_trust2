'use client';
import React from 'react';
import { X, ShieldCheck, MapPin, Mic, Lock, UserCheck, Trash2, Mail, ExternalLink, Bell } from 'lucide-react';

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
              <ShieldCheck size={22} color="#F59E0B" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                Hero Hand Privacy Policy
              </h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0', fontWeight: 500 }}>
                DPDP Act 2023 & Google Play Compliant
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
          <div style={{ background: '#F0F7FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '12px 14px', marginBottom: 18, fontSize: 12, color: '#0369A1', fontWeight: 600 }}>
            📌 <b>Effective Date:</b> August 30, 2026<br />
            <b>Entity:</b> Hero Hand Technologies, Shivamogga, Karnataka, India (<a href="https://herohand.me" target="_blank" rel="noreferrer" style={{ color: '#0369A1', textDecoration: 'underline' }}>HeroHand.me</a>).
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 12, marginBottom: 6 }}>
            1. Information We Collect
          </h3>
          <p style={{ margin: '0 0 10px' }}>
            We only collect the minimum personal data strictly necessary to facilitate local home services:
          </p>
          <ul style={{ paddingLeft: 20, margin: '0 0 14px' }}>
            <li><b>Mobile Number:</b> Used exclusively for SMS OTP account verification and authentication.</li>
            <li><b>Location (GPS):</b> Used in real-time to locate nearby electricians, plumbers, and technicians within your service radius. Location is <b>never tracked in the background</b> when the app is closed.</li>
            <li><b>Audio / Microphone:</b> Used exclusively for live peer-to-peer WebRTC voice calls between you and your booked specialist. <b>Audio is NEVER recorded or stored.</b></li>
            <li><b>Push Notifications & Service Workers:</b> Used to send instant booking status updates and incoming audio call alerts even when your phone is in pocket or screen is locked.</li>
            <li><b>Service Reviews:</b> Star ratings and comments you voluntarily submit for completed jobs.</li>
          </ul>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 16, marginBottom: 6 }}>
            2. Number Privacy Shield & WebRTC
          </h3>
          <p style={{ margin: '0 0 14px' }}>
            Your phone number is masked in the app interface. When contacting a specialist, voice calls are established directly via encrypted peer-to-peer WebRTC, meaning neither party needs to reveal their private phone number.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 16, marginBottom: 6 }}>
            3. How We Use & Protect Your Data
          </h3>
          <ul style={{ paddingLeft: 20, margin: '0 0 14px' }}>
            <li>We <b>DO NOT sell, rent, or trade</b> your personal data to any third-party advertisers.</li>
            <li>All network data in transit is encrypted using HTTPS / TLS 1.3 encryption.</li>
            <li>Database access is guarded by strict PostgreSQL Row Level Security (RLS) policies.</li>
            <li>Infrastructure is powered by Supabase Inc., Google Firebase (FCM), and Metered.ca.</li>
          </ul>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 16, marginBottom: 6 }}>
            4. Your Rights & Account Deletion (DPDP Act 2023)
          </h3>
          <p style={{ margin: '0 0 14px' }}>
            Under India's Digital Personal Data Protection (DPDP) Act 2023, you have the absolute right to access, rectify, or erase your data at any time. You can permanently delete your account and all associated data directly from the <b>Profile</b> screen with 1 tap.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 16, marginBottom: 6 }}>
            5. Children's Privacy
          </h3>
          <p style={{ margin: '0 0 14px' }}>
            Hero Hand is intended for users who are at least 18 years of age. We do not knowingly collect personal information from minors.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 16, marginBottom: 6 }}>
            6. Contact Data Protection Officer
          </h3>
          <p style={{ margin: '0 0 4px' }}>
            For privacy inquiries, data deletion requests, or grievance redressal:
          </p>
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={16} color="#0B3D66" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0B3D66' }}>
              privacy@neighborlytrust.in
            </span>
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
              flex: 1, padding: '12px', borderRadius: 12,
              background: '#0B3D66', color: 'white', border: 'none',
              fontWeight: 800, fontSize: 14, cursor: 'pointer'
            }}
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
