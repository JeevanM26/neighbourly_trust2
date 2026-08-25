'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, BookOpen, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getNavLabel } from '../lib/i18n';

const NAV_ITEMS = [
  { key: 'home',     defaultLabel: 'Home',     icon: Home,     path: '/home' },
  { key: 'map',      defaultLabel: 'Map',      icon: Map,      path: '/map' },
  { key: 'bookings', defaultLabel: 'Bookings', icon: BookOpen, path: '/bookings' },
  { key: 'profile',  defaultLabel: 'Profile',  icon: User,     path: '/profile' },
];

export function BottomNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const { settings } = useApp();
  const lang = settings?.language || 'en';

  return (
    <nav
      className="bottom-nav"
      style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)` }}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(item => {
        const isActive = pathname?.startsWith(item.path) || (pathname === '/' && item.path === '/home');
        const label = getNavLabel(item.key, lang);

        return (
          <Link
            href={item.path}
            key={item.key}
            className={`nav-item${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            style={{ textDecoration: 'none' }}
          >
            <div style={{ position: 'relative' }}>
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
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
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>
              {label}
            </span>
            <div className="nav-item-dot" />
          </Link>
        );
      })}
    </nav>
  );
}
