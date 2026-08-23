'use client';

import React from 'react';
import { ToastNotification } from './ToastNotification';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-0 sm:py-6 px-0 sm:px-4 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[840px] sm:rounded-3xl sm:shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col relative">
        <ToastNotification />
        <main className="flex-1 overflow-y-auto flex flex-col">{children}</main>
      </div>
    </div>
  );
};
