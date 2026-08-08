'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { Home, Wrench, Briefcase, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { t, bookings } = useApp();

  // Hide nav on login screen
  if (pathname === '/') return null;

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  const navItems = [
    { href: '/home', label: t('homeNav'), icon: Home },
    { href: '/services', label: t('servicesNav'), icon: Wrench },
    {
      href: '/worker-dashboard',
      label: t('workerNav'),
      icon: Briefcase,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    { href: '/settings', label: t('settingsNav'), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg max-w-md mx-auto">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-blue-800 font-medium' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-blue-800 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
