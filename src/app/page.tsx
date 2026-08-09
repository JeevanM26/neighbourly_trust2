'use client';
import React, { useState, Component } from 'react';
import { AppProvider, useApp } from '../context/AppContext';


// Screens
import LoginScreen from '../components/screens/LoginScreen';
import HomeScreen from '../components/screens/HomeScreen';
import MapScreen from '../components/screens/MapScreen';
import BookingsScreen from '../components/screens/BookingsScreen';
import ProfileScreen from '../components/screens/ProfileScreen';
import OwnerPanel from '../components/screens/OwnerPanel';
import WorkerProfileSheet from '../components/screens/WorkerProfileSheet';

// Icons (lucide-react)
import { Home, Map, BookOpen, User, ShieldCheck } from 'lucide-react';

// ─── Error Boundary ────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 32,
          background: '#F0F7FF', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😞</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#041B30', marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
            Please restart the app and try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '12px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, #0B3D66, #041B30)',
              color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Boot Loading Screen ───────────────────────────────────
function BootLoader() {
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
        Neighborly Trust
      </h1>
      <div style={{
        marginTop: 24, display: 'flex', gap: 6,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
            animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────
function Toast() {
  const { toast, dismissToast } = useApp();
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

// ─── Bottom Navigation ─────────────────────────────────────
type Tab = 'home' | 'map' | 'bookings' | 'profile';

const NAV_ITEMS: { key: Tab; label: string; icon: any }[] = [
  { key: 'home',     label: 'Home',     icon: Home      },
  { key: 'map',      label: 'Map',      icon: Map       },
  { key: 'bookings', label: 'Bookings', icon: BookOpen  },
  { key: 'profile',  label: 'Profile',  icon: User      },
];

function BottomNav({ active, onChange, pendingCount }: {
  active: Tab;
  onChange: (t: Tab) => void;
  pendingCount: number;
}) {
  return (
    <nav
      className="bottom-nav"
      style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)` }}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(item => (
        <button
          key={item.key}
          className={`nav-item${active === item.key ? ' active' : ''}`}
          onClick={() => onChange(item.key)}
          aria-current={active === item.key ? 'page' : undefined}
        >
          <div style={{ position: 'relative' }}>
            <item.icon
              size={22}
              strokeWidth={active === item.key ? 2.5 : 1.8}
            />
            {item.key === 'bookings' && pendingCount > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                background: '#EF4444', color: 'white', borderRadius: '50%',
                width: 14, height: 14, fontSize: 8, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid white',
              }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </div>
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: active === item.key ? 700 : 500 }}>
            {item.label}
          </span>
          <div className="nav-item-dot" />
        </button>
      ))}
    </nav>
  );
}

// ─── Main App (authenticated shell) ───────────────────────
function AuthenticatedApp() {
  const { bookings, user } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setTab('map');
  };

  const handleSelectWorker = (workerId: string, categoryId?: string) => {
    setSelectedWorkerId(workerId);
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
  };

  const handleBackToHome = () => {
    setSelectedCategoryId(null);
    setSelectedWorkerId(null);
  };

  const handleBackToResults = () => {
    setSelectedWorkerId(null);
  };

  const handleBooked = () => {
    setSelectedWorkerId(null);
    setSelectedCategoryId(null);
    setTab('bookings');
  };

  // If worker detail sheet is open, show it full-screen (or as an overlay)
  if (selectedWorkerId && selectedCategoryId) {
    return (
      <>
        <div className="screen" style={{ flex: 1, overflow: 'hidden' }}>
          <WorkerProfileSheet
            workerId={selectedWorkerId}
            categoryId={selectedCategoryId}
            onBack={handleBackToResults}
            onBooked={handleBooked}
          />
        </div>
        <Toast />
      </>
    );
  }

  // Note: We've removed the WorkerResultsScreen routing here. MapScreen will now handle category display natively.
  // The selectedCategoryId and selectedWorkerId are passed to MapScreen.

  // Owner panel
  if (showOwnerPanel) {
    return (
      <>
        <div className="screen" style={{ flex: 1, overflow: 'hidden' }}>
          <OwnerPanel onClose={() => setShowOwnerPanel(false)} />
        </div>
        <Toast />
      </>
    );
  }

  return (
    <>
      <Toast />

      {/* Screens */}
      <div className="screen" hidden={tab !== 'home'}>
        <HomeScreen onSelectCategory={handleSelectCategory} onSelectWorker={handleSelectWorker} />
      </div>

      {tab === 'map' && (
        <div className="screen">
          <MapScreen 
            categoryId={selectedCategoryId} 
            onSelectWorker={handleSelectWorker} 
            onSelectCategory={setSelectedCategoryId}
            onClearCategory={() => setSelectedCategoryId(null)}
            onLocationConfirmed={() => setTab('home')}
          />
        </div>
      )}

      <div className="screen" hidden={tab !== 'bookings'}>
        <BookingsScreen />
      </div>

      <div className="screen" hidden={tab !== 'profile'}>
        {/* Owner panel entry button */}
        {user?.role === 'owner' && tab === 'profile' && !showOwnerPanel && (
          <div style={{
            position: 'fixed', bottom: 80, right: 16, zIndex: 50,
          }}>
            <button
              onClick={() => setShowOwnerPanel(true)}
              style={{
                background: 'linear-gradient(135deg, #041B30, #0B3D66)',
                border: '2px solid rgba(245,158,11,0.4)',
                borderRadius: 20, padding: '10px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(11,61,102,0.4)',
              }}
            >
              <ShieldCheck size={16} color="#F59E0B" />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>Owner Panel</span>
            </button>
          </div>
        )}
        <ProfileScreen />
      </div>

      <BottomNav
        active={tab}
        onChange={setTab}
        pendingCount={pendingCount}
      />
    </>
  );
}

// ─── Root ──────────────────────────────────────────────────
function AppContent() {
  const { isLoggedIn, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return (
      <div className="screen" style={{ flex: 1 }}>
        <BootLoader />
      </div>
    );
  }

  return (
    <>
      {!isLoggedIn ? (
        <div className="screen" style={{ flex: 1 }}>
          <LoginScreen />
        </div>
      ) : (
        <AuthenticatedApp />
      )}
    </>
  );
}

// ─── Export with Provider ──────────────────────────────────
export default function Page() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
