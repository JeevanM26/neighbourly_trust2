'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast } = useApp();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-blue-900 text-white p-4 rounded-2xl shadow-2xl border border-blue-700 flex items-start space-x-3"
        >
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-white">{toast.type === 'error' ? 'Error' : 'Notification'}</h4>
            <p className="text-xs text-blue-100 mt-0.5 leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={dismissToast}
            className="text-blue-300 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
