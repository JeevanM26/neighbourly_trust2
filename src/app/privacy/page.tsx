'use client';
import React from 'react';
import { ShieldCheck, Mail, ArrowLeft, Phone, Lock, CheckCircle2, UserCheck, MapPin, Mic } from 'lucide-react';
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
            <div>
              <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.3px', display: 'block' }}>HeroHand</span>
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Hands of ShramiXs</span>
            </div>
          </div>
          <Link href="/" style={{ color: '#93C5FD', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={16} /> Back to App
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: 800, margin: '32px auto', padding: '0 20px 80px' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '36px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
              Official Privacy Policy
            </span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Effective Date: August 2026 · DPDP Act 2023 & Google Play Compliant
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '12px 0 16px', letterSpacing: '-0.5px' }}>
            Privacy Policy & Data Protection Notice
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            <b>HeroHand / Hands of ShramiXs</b> (operated by <b>Neighborly Trust Technologies</b>, "we", "us", or "our") is dedicated to protecting the privacy, confidentiality, and security of our customers and service specialists. This policy discloses how we collect, process, protect, and handle your data in strict compliance with India’s <b>Digital Personal Data Protection (DPDP) Act 2023</b> and <b>Google Play Store Developer Policies</b>.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '24px 0' }} />

          {/* Section 1 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              1. Data Controller & Grievance Contact
            </h2>
            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px', border: '1px solid #E2E8F0', fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
              <b>Legal Entity:</b> Neighborly Trust Technologies (HeroHand / Hands of ShramiXs)<br />
              <b>Operating Address:</b> Shivamogga, Karnataka, India<br />
              <b>Official Support Email:</b> <a href="mailto:herohand4@gmail.com" style={{ color: '#0284C7', fontWeight: 700 }}>herohand4@gmail.com</a><br />
              <b>24x7 Helplines:</b> +91 8867269712 · +91 9480150995 · +91 6364419562<br />
              <b>Grievance Officer:</b> Jeevan M (<a href="mailto:herohand4@gmail.com" style={{ color: '#0284C7' }}>herohand4@gmail.com</a>)
            </div>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              2. Personal Data We Collect & Usage Purpose
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <b style={{ color: '#0F172A', fontSize: 14 }}>📱 Mobile Phone Number & Name</b>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Collected during login for authentication, booking confirmation, and customer safety notifications.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <b style={{ color: '#0F172A', fontSize: 14 }}>📍 Foreground Geolocation (GPS)</b>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Used solely in real-time while you browse or request a service to find verified technicians in your neighborhood and calculate routing distances. <b>We NEVER track customer location in the background when the app is closed.</b>
                </p>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <b style={{ color: '#0F172A', fontSize: 14 }}>🎙️ Audio / Microphone & WebRTC Calling</b>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Used strictly for live in-app peer-to-peer WebRTC voice calls between you and your booked specialist. <b>Audio is peer-to-peer encrypted and NEVER recorded, stored, or processed on any server.</b>
                </p>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <b style={{ color: '#0F172A', fontSize: 14 }}>🔢 4-Digit Completion PIN & Feedback</b>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                  A unique 4-digit PIN is generated to validate order completion. Ratings and review comments are collected to maintain high service quality standards.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              3. Google User Data Policy Compliance
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              When you choose "Continue with Google", we access only your basic Google profile (Name, Email Address, and Avatar) strictly to create and secure your HeroHand account. <b>We DO NOT transfer, sell, or disclose Google user data to third parties, advertising networks, or data brokers.</b>
            </p>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              4. Number Privacy Shield & WebRTC Masking
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              We protect both customer and technician privacy by masking personal phone numbers. Direct communication happens over encrypted in-app WebRTC voice streams, ensuring your personal phone number is never exposed to unverified parties.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              5. Zero Data Selling & Secure Infrastructure
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              We <b>DO NOT sell, rent, or monetise</b> your personal data. We utilize enterprise-grade infrastructure providers:
            </p>
            <ul style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, paddingLeft: 20 }}>
              <li><b>Supabase Inc.:</b> Encrypted PostgreSQL storage with TLS 1.3 encryption and Row Level Security (RLS).</li>
              <li><b>Metered.ca:</b> Encrypted TURN/STUN relay servers for peer-to-peer NAT traversal without storing media.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              6. Your Rights & Permanent Account Deletion (DPDP Act 2023)
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              Under India's DPDP Act 2023, you maintain complete ownership of your personal data. You can permanently erase your account, addresses, and booking history anytime with 1-tap under <b>Profile &gt; Delete Account</b>.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              7. Children's Privacy
            </h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              HeroHand is intended for individuals aged 18 and older. We do not knowingly collect personal data from minors.
            </p>
          </section>

          {/* Section 8 - Contact Box */}
          <section style={{ background: '#F0F7FF', borderRadius: 16, padding: '20px 24px', border: '1px solid #BAE6FD' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0369A1', margin: '0 0 6px' }}>
              Questions, Grievances, or Data Requests?
            </h3>
            <p style={{ fontSize: 13, color: '#0284C7', margin: '0 0 14px' }}>
              Reach out to our Data Protection & Customer Support Team:
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a 
                href="mailto:herohand4@gmail.com" 
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#0B3D66', color: 'white', textDecoration: 'none',
                  padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700
                }}
              >
                <Mail size={15} /> Email: herohand4@gmail.com
              </a>
              <a 
                href="tel:8867269712" 
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#2563EB', color: 'white', textDecoration: 'none',
                  padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700
                }}
              >
                <Phone size={15} /> Helpline: 8867269712
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
