'use client';
import React, { useState, useEffect } from 'react';
import AdminDashboard from '../../components/admin/AdminDashboard';
import AdminLogin from '../../components/admin/AdminLogin';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAllowedEnvironment, setIsAllowedEnvironment] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Check if running on localhost dev, Native Capacitor APK, or secret master token
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
      const urlParams = new URLSearchParams(window.location.search);
      const hasSecretKey = urlParams.get('auth') === '7975' || urlParams.get('secret') === '7975';
      const savedAuth = localStorage.getItem('hoh_admin_auth');

      // If on public web without secret key or saved session, block and disguise as 404
      if (!isLocalhost && !isCapacitor && !hasSecretKey && !savedAuth) {
        setIsAllowedEnvironment(false);
        return;
      }

      setIsAllowedEnvironment(true);

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

  // Disguise as standard 404 for unauthorized public web visitors
  if (isAllowedEnvironment === false) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fff', color: '#000' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0, paddingRight: 20, borderRight: '1px solid rgba(0,0,0,.3)' }}>404</h1>
          <h2 style={{ fontSize: 14, fontWeight: 400, margin: 0, paddingLeft: 20 }}>This page could not be found.</h2>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return null; // Silent load
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
