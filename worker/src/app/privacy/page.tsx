'use client';
import React from 'react';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function WorkerPrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top Navigation */}
      <header style={{ background: '#065F46', color: 'white', padding: '16px 24px', borderBottom: '1px solid #047857', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color="#FDE68A" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.3px' }}>Hero Hand Partner</span>
          </div>
          <Link href="/" style={{ color: '#A7F3D0', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={16} /> Back to Portal
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 800, margin: '32px auto', padding: '0 20px 80px' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '36px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
              Partner Privacy Policy
            </span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Effective: August 30, 2026
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '12px 0 16px', letterSpacing: '-0.5px' }}>
            Service Partner Data Protection Notice
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            This policy outlines how Hero Hand Technologies (operating at <a href="https://partner.herohand.me" target="_blank" rel="noreferrer" style={{ color: '#059669' }}>partner.herohand.me</a>) collects, processes, and protects personal data belonging to registered service specialists, technicians, and contractors in accordance with the <b>Digital Personal Data Protection (DPDP) Act 2023</b> and <b>Google Play Store Developer Policies</b>.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '24px 0' }} />

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              1. Information Collected from Partners
            </h2>
            <ul style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, paddingLeft: 20 }}>
              <li><b>Contact Data:</b> Full name, mobile number for SMS OTP verification and dispatch communications.</li>
              <li><b>Professional Skills:</b> Selected trade categories (electrical, plumbing, carpentry, AC repair, etc.) and hourly pricing rates.</li>
              <li><b>Live Geolocation:</b> Device location while online to calculate travel distances and dispatch local customer requests within your selected radius.</li>
              <li><b>Microphone / Audio:</b> Used solely during direct WebRTC customer calls. Audio is streamed peer-to-peer and <b>never recorded or archived</b>.</li>
              <li><b>Push Notifications & Service Workers:</b> Used to wake up the device and trigger loud, attention-grabbing job alerts and customer voice calls.</li>
              <li><b>Settlement Information:</b> Optional UPI ID provided by you for direct payout tracking.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              2. Data Protection & Non-Commercialization
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              We <b>never sell or monetize</b> your personal or contact information. Customer numbers and partner numbers are shielded during all pre-booking stages.
            </p>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              3. Permanent Account Deletion Rights
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              Under DPDP 2023, you can permanently delete your partner account, leads history, and ratings at any time via <b>Profile &gt; Delete Worker Account</b>.
            </p>
          </section>

          <section style={{ background: '#ECFDF5', borderRadius: 16, padding: '20px 24px', border: '1px solid #A7F3D0' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#065F46', margin: '0 0 6px' }}>
              Partner Support Contact
            </h3>
            <p style={{ fontSize: 13, color: '#047857', margin: '0 0 12px' }}>
              For queries regarding partner data privacy or grievance resolution:
            </p>
            <a 
              href="mailto:partners@neighborlytrust.in" 
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#065F46', color: 'white', textDecoration: 'none',
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700
              }}
            >
              <Mail size={15} /> Contact Partner Privacy Team
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
