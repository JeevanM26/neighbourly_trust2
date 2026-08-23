'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export const MapBanner: React.FC = () => {
  const { workers, t } = useApp();
  const activeCount = workers.length; // WorkerProfile represents active nearby workers

  return (
    <div className="relative w-full h-44 bg-slate-900 overflow-hidden border-b border-slate-200">
      {/* Simulated Map Background Grid & Vector Terrain */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Simulated Road Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-25 stroke-blue-400" fill="none">
        <path d="M-20 60 Q 120 20, 240 90 T 480 70" strokeWidth="3" />
        <path d="M50 -10 Q 160 140, 320 80 T 450 180" strokeWidth="2" strokeDasharray="4 4" />
      </svg>

      {/* Interactive Map Pins for Online Workers */}
      <div className="absolute inset-0">
        {workers.map((worker, idx) => {
          // Position pins across map surface
          const positions = [
            { top: '25%', left: '20%' },
            { top: '35%', left: '68%' },
            { top: '60%', left: '35%' },
            { top: '65%', left: '80%' },
            { top: '45%', left: '50%' },
          ];
          const pos = positions[idx % positions.length];

          return (
            <motion.div
              key={worker.worker_id || idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              style={{ top: pos.top, left: pos.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-7 h-7 bg-emerald-500/30 rounded-full animate-ping" />
                <div className="w-8 h-8 rounded-full bg-blue-800 text-white p-0.5 border-2 border-emerald-400 shadow-lg flex items-center justify-center overflow-hidden">
                  <MapPin className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                </div>
              </div>
              {/* Tooltip on hover */}
              <div className="absolute left-1/2 -translate-x-1/2 top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                {worker.full_name} • ₹{worker.hourly_rate || 350}/h
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Map Header Overlay Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Active Specialists Count Badge */}
        <div className="bg-slate-900/90 backdrop-blur text-white px-3 py-1.5 rounded-full border border-slate-700 shadow-md flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold">
            {activeCount} {t('activeSpecialistsBadge')}
          </span>
        </div>

        {/* Location Badge */}
        <div className="bg-blue-800/90 backdrop-blur text-blue-100 px-2.5 py-1 rounded-full border border-blue-600/50 shadow-md flex items-center space-x-1.5 text-[11px] font-medium">
          <Navigation className="w-3 h-3 text-blue-300" />
          <span>{t('local_area') || 'Local Area'} • 2 km</span>
        </div>
      </div>
    </div>
  );
};
