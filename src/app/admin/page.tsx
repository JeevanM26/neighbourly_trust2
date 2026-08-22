'use client';
import React, { useState, useEffect } from 'react';
import AdminDashboard from '../../components/admin/AdminDashboard';
import AdminLogin from '../../components/admin/AdminLogin';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('hoh_admin_auth');
      if (savedAuth) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
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
      <div style={{ minHeight: '100vh', background: '#041B30', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>
        Loading Hands of Heros Admin Hub...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
