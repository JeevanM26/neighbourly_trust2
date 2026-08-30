'use client';
import React from 'react';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top Navigation */}
      <header style={{ background: '#041B30', color: 'white', padding: '16px 24px', borderBottom: '1px solid #1E293B', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0B3D66', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color="#F59E0B" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.3px' }}>Hero Hand</span>
          </div>
          <Link href="/" style={{ color: '#93C5FD', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={16} /> Back to App
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: 800, margin: '32px auto', padding: '0 20px 80px' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '36px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
              Official Policy
            </span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Last Updated: August 30, 2026
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '12px 0 16px', letterSpacing: '-0.5px' }}>
            Privacy Policy & Data Protection Notice
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            Hero Hand ("Hero Hand", "we", "us", or "our", hosted at <a href="https://herohand.me" target="_blank" rel="noreferrer" style={{ color: '#0284C7' }}>HeroHand.me</a>) is dedicated to protecting the privacy and personal data of our customers and service specialists. This policy discloses how we collect, handle, protect, and process your data in accordance with India’s <b>Digital Personal Data Protection (DPDP) Act 2023</b> and <b>Google Play Developer Policies</b>.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '24px 0' }} />

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              1. Data Controller & Contact
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
              <b>Entity:</b> Hero Hand Technologies<br />
              <b>Platform URLs:</b> <a href="https://herohand.me" target="_blank" rel="noreferrer" style={{ color: '#0284C7' }}>HeroHand.me</a> & <a href="https://partner.herohand.me" target="_blank" rel="noreferrer" style={{ color: '#0284C7' }}>partner.herohand.me</a><br />
              <b>Data Grievance Officer:</b> Jeevan M (<a href="mailto:privacy@neighborlytrust.in" style={{ color: '#0284C7' }}>privacy@neighborlytrust.in</a>)
            </p>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              2. Personal Data We Collect & Purpose
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <b style={{ color: '#0F172A', fontSize: 14 }}>📱 Phone Number & Name</b>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Collected strictly during login for SMS OTP authentication and account identification.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <b style={{ color: '#0F172A', fontSize: 14 }}>📍 Precise & Approximate Geolocation (GPS)</b>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Used solely in real-time when browsing or booking to match you with nearby service technicians (electricians, plumbers, carpenters) and calculate routing distance. We <b>never</b> track your location in the background when the app is closed.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <b style={{ color: '#0F172A', fontSize: 14 }}>🎙️ Audio / Microphone</b>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Used strictly for in-app peer-to-peer WebRTC voice calling between customer and specialist. <b>Audio is NEVER recorded, stored, or processed on any server.</b>
                </p>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <b style={{ color: '#0F172A', fontSize: 14 }}>🔔 Push Notifications & Background Service Worker</b>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Used to deliver real-time booking updates, specialist arrival notices, and incoming audio call alerts even when the screen is locked or in pocket.
                </p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              3. Privacy Shield & Data Masking
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              We implement proactive privacy shielding. Specialist and customer phone numbers are masked in all app views. Voice calls route through encrypted WebRTC protocols so neither party's personal phone number is disclosed.
            </p>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              4. Zero Data Selling & Third-Party Processors
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              We <b>DO NOT sell, rent, or monetise</b> your personal data with any third-party advertisers or brokers. We work with trusted infrastructure providers:
            </p>
            <ul style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, paddingLeft: 20 }}>
              <li><b>Supabase Inc.</b> (Database and authentication infrastructure protected with TLS 1.3 & Row Level Security).</li>
              <li><b>Google Firebase (FCM)</b> (High-priority cloud messaging and background push notifications).</li>
              <li><b>Metered.ca</b> (TURN relay servers for direct WebRTC NAT traversal).</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              5. User Rights & Account Deletion (DPDP Act 2023)
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              You maintain full ownership of your data. You may request data access, correction, or permanent account deletion at any time. You can also self-delete your account directly in the app under <b>Profile &gt; Delete Account</b>, which permanently purges all profile records, bookings, and associated data from our systems.
            </p>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              6. Children's Privacy
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              Hero Hand is intended exclusively for adults aged 18 and older. We do not knowingly solicit or collect data from children under 18 years of age.
            </p>
          </section>

          <section style={{ background: '#F0F7FF', borderRadius: 16, padding: '20px 24px', border: '1px solid #BAE6FD' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0369A1', margin: '0 0 6px' }}>
              Questions or Grievances?
            </h3>
            <p style={{ fontSize: 13, color: '#0284C7', margin: '0 0 12px' }}>
              Reach out to our Data Protection Officer directly:
            </p>
            <a 
              href="mailto:privacy@neighborlytrust.in" 
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#0B3D66', color: 'white', textDecoration: 'none',
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700
              }}
            >
              <Mail size={15} /> Contact Privacy Team
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
