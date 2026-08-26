'use client';
import React from 'react';
import { ShieldCheck, Mail, ArrowLeft, Phone, Wrench, Lock } from 'lucide-react';
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
            <div>
              <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.3px', display: 'block' }}>HeroHand Partner</span>
              <span style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 600 }}>Hands of ShramiXs Portal</span>
            </div>
          </div>
          <Link href="/" style={{ color: '#A7F3D0', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={16} /> Back to Portal
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 800, margin: '32px auto', padding: '0 20px 80px' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '36px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
              Partner Privacy Policy
            </span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Effective Date: August 2026 · DPDP Act 2023 & Google Play Compliant
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '12px 0 16px', letterSpacing: '-0.5px' }}>
            Service Partner Data Protection Notice
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            This policy outlines how <b>HeroHand / Hands of ShramiXs</b> (operated by <b>Neighborly Trust Technologies</b>) collects, processes, and safeguards personal data belonging to registered service specialists, technicians, and tradespeople in accordance with India’s <b>Digital Personal Data Protection (DPDP) Act 2023</b> and <b>Google Play Store Developer Policies</b>.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '24px 0' }} />

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              1. Information Collected from Service Partners
            </h2>
            <ul style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, paddingLeft: 20 }}>
              <li><b>Contact & Google Profile:</b> Full name, email address, and 10-digit mobile number for specialist account authentication and job dispatch.</li>
              <li><b>Professional Trade Skills:</b> Registered service categories (Electrical, Plumbing, Carpentry, AC Repair, Painting, etc.) to match you with appropriate customer requests.</li>
              <li><b>Geolocation (GPS):</b> Used while status is set to "Online" to calculate travel distances and dispatch customer bookings within your selected coverage radius (2–15 km).</li>
              <li><b>Microphone / Audio:</b> Used solely during direct in-app WebRTC customer voice calls. Audio is encrypted peer-to-peer and <b>never recorded or archived</b>.</li>
              <li><b>Settlement Information:</b> Optional UPI ID provided by you for direct payout and revenue tracking.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              2. Google User Data Protection
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              We access your Google account information solely for sign-in and profile creation. <b>We do NOT sell, rent, or transfer your Google user data to any external advertising companies or data brokers.</b>
            </p>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              3. Data Protection & Non-Commercialization
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              We <b>never sell or monetize</b> your personal or contact information. Direct customer phone numbers and specialist phone numbers are shielded during all pre-booking phases.
            </p>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              4. Permanent Account Deletion Rights (DPDP Act 2023)
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              Under DPDP 2023, you can permanently delete your partner profile, job history, and ratings at any time via <b>Profile &gt; Delete Worker Account</b>.
            </p>
          </section>

          <section style={{ background: '#ECFDF5', borderRadius: 16, padding: '20px 24px', border: '1px solid #A7F3D0' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#065F46', margin: '0 0 6px' }}>
              Partner Support & Grievance Contact
            </h3>
            <p style={{ fontSize: 13, color: '#047857', margin: '0 0 14px' }}>
              For queries regarding partner data privacy, verification, or grievance resolution:
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a 
                href="mailto:herohand4@gmail.com" 
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#065F46', color: 'white', textDecoration: 'none',
                  padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700
                }}
              >
                <Mail size={15} /> Email: herohand4@gmail.com
              </a>
              <a 
                href="tel:8867269712" 
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#059669', color: 'white', textDecoration: 'none',
                  padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700
                }}
              >
                <Phone size={15} /> Partner Helpline: 8867269712
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
