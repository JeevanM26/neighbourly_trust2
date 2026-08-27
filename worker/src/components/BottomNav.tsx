'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Bell, Briefcase, TrendingUp, User } from 'lucide-react';
import { useWorker } from '../context/WorkerContext';
import { getNavLabel } from '../lib/i18n';

type Tab = 'dashboard' | 'requests' | 'jobs' | 'earnings' | 'profile';

const NAV_ITEMS: { key: Tab; defaultLabel: string; icon: any; path: string }[] = [
  { key: 'dashboard', defaultLabel: 'Home',     icon: LayoutGrid, path: '/dashboard' },
  { key: 'requests',  defaultLabel: 'Requests', icon: Bell,       path: '/requests'  },
  { key: 'jobs',      defaultLabel: 'Jobs',     icon: Briefcase,  path: '/jobs'      },
  { key: 'earnings',  defaultLabel: 'Earnings', icon: TrendingUp, path: '/earnings'  },
  { key: 'profile',   defaultLabel: 'Profile',  icon: User,       path: '/profile'   },
];

export function BottomNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const { settings } = useWorker();
  const lang = settings?.language || 'en';

  return (
    <nav className="bottom-nav" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)` }}>
      {NAV_ITEMS.map(item => {
        const isActive = pathname?.startsWith(item.path) || (pathname === '/' && item.path === '/dashboard');
        const label = getNavLabel(item.key, lang);
        
        return (
          <Link 
            href={item.path} 
            key={item.key} 
            className={`nav-item${isActive ? ' active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{ position: 'relative' }}>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {item.key === 'requests' && pendingCount > 0 && (
                <div style={{ position: 'absolute', top: -5, right: -5, background: '#EF4444', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', animation: 'pulse 1.5s infinite' }}>
                  {pendingCount > 9 ? '9+' : pendingCount}
                </div>
              )}
            </div>
            <span style={{ fontSize: 9, fontWeight: isActive ? 800 : 500 }}>{label}</span>
            <div className="nav-item-dot" />
          </Link>
        );
      })}
    </nav>
  );
}
