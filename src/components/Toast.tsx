'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
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
