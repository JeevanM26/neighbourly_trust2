'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../../components/BottomNav';
import { ShieldCheck } from 'lucide-react';
import LoginScreen from '../../components/screens/LoginScreen';
import Toast from '../../components/Toast'; // Needs to be extracted

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isAuthLoading, bookings } = useApp();

  if (isAuthLoading) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'rgba(255,255,255,0.12)',
          border: '2px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <ShieldCheck size={36} color="#F59E0B" strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>
          Hands of Heros
        </h1>
      </div>
    );
  }

  const needsPhone = !user || !user.phone || user.phone.trim() === '';

  if (needsPhone) {
    return (
      <>
        <div className="screen" style={{ flex: 1 }}>
          <LoginScreen />
        </div>
        <Toast />
      </>
    );
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <>
      <div className="screen" style={{ flex: 1 }}>
        {children}
      </div>
      <BottomNav pendingCount={pendingCount} />
      <Toast />
    </>
  );
}
