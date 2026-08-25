'use client';
import React, { useState, useEffect } from 'react';
import AdminDashboard from '../components/AdminDashboard';
import AdminLogin from '../components/AdminLogin';

export interface AdminCredentials {
  phone: string;
  pin: string;
}

export default function AdminRootPage() {
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hoh_admin_auth_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.phone && parsed.pin) {
            setCredentials(parsed);
          }
        }
      } catch (e) {}
      setIsInitializing(false);
    }
  }, []);

  const handleLoginSuccess = (creds: AdminCredentials) => {
    setCredentials(creds);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hoh_admin_auth_session', JSON.stringify(creds));
      } catch (e) {}
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('hoh_admin_auth_session');
      localStorage.removeItem('hoh_admin_auth');
    } catch {}
    setCredentials(null);
  };

  if (isInitializing) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Initializing ShramiXs Admin Cockpit…</div>
      </div>
    );
  }

  if (!credentials) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard credentials={credentials} onLogout={handleLogout} />;
}
