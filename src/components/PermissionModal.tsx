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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4, 27, 48, 0.7)', backdropFilter: 'blur(4px)', padding: 16
    }}>
      <div style={{
        background: 'white', borderRadius: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        width: '100%', maxWidth: 360, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
      }}>
        <div style={{
          width: 64, height: 64, background: '#FEF3C7', color: '#D97706', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
        }}>
          {icon}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>{title}</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 32px 0', lineHeight: 1.5 }}>
          {description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 12 }}>
          <button 
            onClick={onAllow}
            style={{
              width: '100%', minHeight: 48, background: '#F59E0B', color: 'white', fontWeight: 700,
              borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            Continue
          </button>
          <button 
            onClick={onDeny}
            style={{
              width: '100%', minHeight: 48, background: '#F1F5F9', color: '#334155', fontWeight: 700,
              borderRadius: 12, border: 'none', cursor: 'pointer'
            }}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
