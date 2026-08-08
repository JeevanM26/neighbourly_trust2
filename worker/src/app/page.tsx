'use client';
import React, { useState } from 'react';
import { WorkerProvider, useWorker } from '../context/WorkerContext';
import { LayoutGrid, Bell, Briefcase, TrendingUp, User, ShieldCheck } from 'lucide-react';

// Screens
import WorkerLoginScreen from '../components/screens/WorkerLoginScreen';
import DashboardScreen from '../components/screens/DashboardScreen';
import RequestsScreen from '../components/screens/RequestsScreen';
import JobsScreen from '../components/screens/JobsScreen';
import EarningsScreen from '../components/screens/EarningsScreen';
import WorkerProfileScreen from '../components/screens/WorkerProfileScreen';

type Tab = 'dashboard' | 'requests' | 'jobs' | 'earnings' | 'profile';

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

function BottomNav({ active, onChange, pendingCount }: {
  active: Tab;
  onChange: (t: Tab) => void;
  pendingCount: number;
}) {
  const items: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Home',     icon: LayoutGrid },
    { key: 'requests',  label: 'Requests', icon: Bell       },
    { key: 'jobs',      label: 'Jobs',     icon: Briefcase  },
    { key: 'earnings',  label: 'Earnings', icon: TrendingUp },
    { key: 'profile',   label: 'Profile',  icon: User       },
  ];

  return (
    <nav className="bottom-nav" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map(item => (
        <button key={item.key} className={`nav-item${active === item.key ? ' active' : ''}`} onClick={() => onChange(item.key)}>
          <div style={{ position: 'relative' }}>
            <item.icon size={22} strokeWidth={active === item.key ? 2.5 : 1.8} />
            {item.key === 'requests' && pendingCount > 0 && (
              <div style={{ position: 'absolute', top: -5, right: -5, background: '#EF4444', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', animation: 'pulse 1.5s infinite' }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </div>
            )}
          </div>
          <span style={{ fontSize: 9, fontWeight: active === item.key ? 800 : 500 }}>{item.label}</span>
          <div className="nav-item-dot" />
        </button>
      ))}
    </nav>
  );
}

function AppShell() {
  const { isLoggedIn, isNewWorker, offers, isAuthLoading } = useWorker();
  const [tab, setTab] = useState<Tab>('dashboard');

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
          Neighborly Trust
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
          Connecting...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <div className="screen" style={{ flex: 1 }}>
          <WorkerLoginScreen />
        </div>
        <Toast />
      </>
    );
  }

  const screens: Record<Tab, React.ReactNode> = {
    dashboard: <DashboardScreen onGoToRequests={() => setTab('requests')} onGoToJobs={() => setTab('jobs')} />,
    requests:  <RequestsScreen />,
    jobs:      <JobsScreen />,
    earnings:  <EarningsScreen />,
    profile:   <WorkerProfileScreen />,
  };

  return (
    <>
      <Toast />
      <div className="screen" style={{ flex: 1, overflow: 'hidden' }}>
        {screens[tab]}
      </div>
      <BottomNav active={tab} onChange={setTab} pendingCount={offers.length} />
    </>
  );
}

export default function Page() {
  return (
    <WorkerProvider>
      <AppShell />
    </WorkerProvider>
  );
}
