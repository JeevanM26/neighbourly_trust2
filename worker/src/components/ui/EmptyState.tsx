import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-lg border border-slate-100">
      {icon && <div className="text-slate-400 mb-4">{icon}</div>}
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-[280px] leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="min-h-[48px] min-w-[48px] px-6 py-2 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-transform active:scale-95 shadow-md flex items-center justify-center"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
