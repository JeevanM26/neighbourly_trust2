'use client';

import React, { useState } from 'react';
import { useWorker } from '../context/WorkerContext';
import { ShieldCheck, LayoutGrid, Bell, Briefcase, TrendingUp, User } from 'lucide-react';
import WorkerLoginScreen from '../components/screens/WorkerLoginScreen';
import DashboardScreen from '../components/screens/DashboardScreen';
import RequestsScreen from '../components/screens/RequestsScreen';
import JobsScreen from '../components/screens/JobsScreen';
import EarningsScreen from '../components/screens/EarningsScreen';
import WorkerProfileScreen from '../components/screens/WorkerProfileScreen';
import { CallOverlay } from '../components/CallOverlay';

type Tab = 'dashboard' | 'requests' | 'jobs' | 'earnings' | 'profile';

const NAV_ITEMS: { key: Tab; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Home',     icon: LayoutGrid },
  { key: 'requests',  label: 'Requests', icon: Bell       },
  { key: 'jobs',      label: 'Jobs',     icon: Briefcase  },
  { key: 'earnings',  label: 'Earnings', icon: TrendingUp },
  { key: 'profile',   label: 'Profile',  icon: User       },
];

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

export default function WorkerMainPage() {
  const { isLoggedIn, isAuthLoading, offers, webrtc } = useWorker();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (isAuthLoading) {
    return (
      <div style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
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
          HOS: Workers
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
          Loading Partner Dashboard...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <WorkerLoginScreen />
        <Toast />
      </div>
    );
  }

  const pendingCount = offers.filter(o => o.status === 'offered').length;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: '#F0FDF4' }}>
      {/* Active Tab Screen */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {activeTab === 'dashboard' && (
          <DashboardScreen 
            onGoToRequests={() => setActiveTab('requests')} 
            onGoToJobs={() => setActiveTab('jobs')} 
          />
        )}
        {activeTab === 'requests' && <RequestsScreen />}
        {activeTab === 'jobs' && <JobsScreen />}
        {activeTab === 'earnings' && <EarningsScreen />}
        {activeTab === 'profile' && <WorkerProfileScreen />}
      </div>

      {/* Embedded Single-Page Bottom Nav */}
      <nav className="bottom-nav" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)` }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`nav-item${isActive ? ' active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div style={{ position: 'relative' }}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {item.key === 'requests' && pendingCount > 0 && (
                  <div style={{
                    position: 'absolute', top: -5, right: -5,
                    background: '#EF4444', color: 'white',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 9, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid white', animation: 'pulse 1.5s infinite'
                  }}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 9, fontWeight: isActive ? 800 : 500 }}>{item.label}</span>
              <div className="nav-item-dot" />
            </button>
          );
        })}
      </nav>

      {/* WebRTC Call Overlay if active */}
      {webrtc && webrtc.callState !== 'idle' && (
        <CallOverlay 
          callState={webrtc.callState}
          remoteName="Customer"
          isMuted={webrtc.isMuted}
          isSpeakerOn={webrtc.isSpeakerOn}
          onAccept={() => webrtc.acceptCall()}
          onReject={() => webrtc.rejectCall()}
          onHangup={() => webrtc.endCall()}
          onToggleMute={() => webrtc.toggleMute()}
          onToggleSpeaker={() => webrtc.toggleSpeaker()}
        />
      )}

      <Toast />
    </div>
  );
}
