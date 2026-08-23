'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      router.replace('/home/');
    }
  }, [router]);

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)',
      color: 'white',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 22,
        background: 'rgba(255,255,255,0.12)',
        border: '2px solid rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        <ShieldCheck size={36} color="#F59E0B" strokeWidth={2.5} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.3px', margin: 0 }}>
        Hero Hand
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
        Loading local specialists...
      </p>
    </div>
  );
}
