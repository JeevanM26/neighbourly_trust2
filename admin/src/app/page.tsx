'use client';
import React, { useState, useEffect } from 'react';
import AdminDashboard from '../components/AdminDashboard';
import AdminLogin from '../components/AdminLogin';

export default function AdminRootPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('hoh_admin_auth');
      if (savedAuth) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('hoh_admin_auth');
    } catch {}
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Initializing ShramiXs Admin Cockpit…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
