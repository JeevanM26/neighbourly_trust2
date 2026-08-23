'use client';

import React, { useState } from 'react';
import { WorkerProfile } from '../lib/types';
import { useApp } from '../context/AppContext';
import { useLocation } from '../context/LocationContext';
import { Star, ShieldCheck, MapPin, Phone, Info, Zap, X } from 'lucide-react';
import Image from 'next/image';

export const WorkerCard: React.FC<{ worker: WorkerProfile }> = ({ worker }) => {
  const { t, webrtc, user, bookWorker } = useApp();
  const { userLocation } = useLocation();
  const [showDetails, setShowDetails] = useState(false);

  const nameStr = worker.full_name || 'Specialist';
  const catStr = worker.tags?.[0] || 'Specialist';
  const avatarStr = worker.avatar_url;

  return (
    <>
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative">
        <div className="flex items-start space-x-3.5">
          {/* Avatar & Online Dot */}
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
            <Image
              src={avatarStr || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'}
              alt={nameStr}
              fill
              className="object-cover"
            />
            <span
              className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-500`}
              title={'Online Now'}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm truncate">
                {nameStr}
              </h3>
              <div className="flex items-center space-x-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{worker.total_jobs > 0 ? (worker.avg_rating || 0).toFixed(1) : 'New'}</span>
                <span className="text-[10px] text-amber-600 font-normal">({worker.total_jobs ?? 0})</span>
              </div>
            </div>

            <p className="text-xs font-semibold text-blue-800 mt-0.5">
              {catStr}
            </p>

            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{worker.distance_km ? `${worker.distance_km.toFixed(1)} km away` : 'Nearby'}</span>
              </span>
              <span className="font-semibold text-slate-900">
                ₹{worker.hourly_rate || 350} <span className="text-[10px] text-slate-500 font-normal">/ hr</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowDetails(true)}
            className="w-full py-2 px-2 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 flex items-center justify-center space-x-1 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Info</span>
          </button>

          <button
            onClick={() => webrtc.startCall(worker.worker_id, nameStr, user?.full_name || 'Customer', user?.avatar_url)}
            className="w-full py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 flex items-center justify-center space-x-1 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
            <span>Call</span>
          </button>

          <button
            onClick={() => bookWorker(worker.category_id || 'general', worker.worker_id, userLocation || undefined)}
            className="w-full py-2 px-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs flex items-center justify-center space-x-1 shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Book</span>
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-200">
                  <Image src={avatarStr || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'} alt={nameStr} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{nameStr}</h3>
                  <p className="text-xs text-blue-800 font-semibold">{catStr}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="bg-blue-50/70 p-3 rounded-xl text-xs text-slate-700 leading-relaxed border border-blue-100">
                <p className="font-medium text-blue-900 mb-1">About Specialist:</p>
                {worker.description || `Independent community professional with ${worker.years_experience || 'several'} years of experience.`}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 text-[10px] block">Hourly Rate</span>
                  <span className="font-bold text-slate-900 text-sm">₹{worker.hourly_rate || 350} / hr</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 text-[10px] block">Community Rating</span>
                  <span className="font-bold text-amber-500 text-xs flex items-center space-x-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>
                      {worker.total_jobs > 0 
                        ? `${(worker.avg_rating || 0).toFixed(1)} (${worker.total_jobs} reviews)` 
                        : 'No reviews yet'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    webrtc.startCall(worker.worker_id, nameStr, user?.full_name || 'Customer', user?.avatar_url);
                  }}
                  className="flex items-center space-x-1 text-emerald-700 font-bold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call {nameStr}</span>
                </button>
                <span>{(worker.total_jobs ?? 0)} verified jobs</span>
              </div>
            </div>

            <div className="mt-5 flex space-x-2">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetails(false);
                  bookWorker(worker.category_id || 'general', worker.worker_id, userLocation || undefined);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-800 text-white font-semibold text-xs flex items-center justify-center space-x-1"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Confirm Book</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
