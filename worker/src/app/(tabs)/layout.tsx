'use client';

import React from 'react';
import { useWorker } from '../../context/WorkerContext';
import { BottomNav } from '../../components/BottomNav';
import { ShieldCheck } from 'lucide-react';
import WorkerLoginScreen from '../../components/screens/WorkerLoginScreen';

function Toast() {
  const { toast, dismissToast } = useWorker();
  if (!toast) return null;
  const icons: Record<string, string> = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className="toast-container" onClick={dismissToast} style={{ cursor: 'pointer' }}>
      <div className={`toast toast-${toast.type}`}>
        <span style={{ fontSize: 16 }}>{icons[toast.type]}</span>
        <span style={{ flex: 1 }}>{toast.message}</span>
      </div>
    </div>
  );
}

export default function WorkerTabsLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAuthLoading, offers } = useWorker();

  if (isAuthLoading) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', color: 'white',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'rgba(255,255,255,0.12)',
          border: '2px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <ShieldCheck size={36} color="#FCD34D" strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.3px', margin: 0 }}>
          Hero Hand
        </h1>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <WorkerLoginScreen />
        </div>
        <Toast />
      </>
    );
  }

  const pendingCount = offers.filter(o => o.status === 'offered').length;

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
