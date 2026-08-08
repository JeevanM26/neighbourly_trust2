import React from 'react';

interface PermissionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onAllow: () => void;
  onDeny: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen, title, description, icon, onAllow, onDeny
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-bounceIn p-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={onAllow}
            className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-transform text-white font-bold rounded-xl shadow-md"
          >
            Continue
          </button>
          <button 
            onClick={onDeny}
            className="w-full min-h-[48px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 transition-transform text-slate-700 dark:text-slate-200 font-bold rounded-xl"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
