'use client';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LanguageCode } from '../../lib/types';
import { User, Globe, Volume2, VolumeX, LogOut, ChevronRight, Shield, HelpCircle, Bell } from 'lucide-react';

const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English',   native: 'English'  },
  { code: 'hi', label: 'Hindi',     native: 'हिंदी'     },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ'     },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు'    },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்'     },
  { code: 'mr', label: 'Marathi',   native: 'मराठी'     },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা'     },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી'   },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം'    },
  { code: 'pa', label: 'Punjabi',   native: 'ਪੰਜਾਬੀ'    },
];

export default function ProfileScreen({ onOpenOwnerPanel }: { onOpenOwnerPanel?: () => void }) {
  const { user, logoutUser, deleteAccount, settings, setLanguage, toggleSounds, toggleVoice, bookings, showToast } = useApp();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const totalSpent = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const selectedLang = LANGUAGES.find(l => l.code === settings.language) ?? LANGUAGES[0];

  function SettingRow({ icon, label, right, onClick }: { icon: React.ReactNode; label: string; right: React.ReactNode; onClick?: () => void }) {
    return (
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: '14px 0', background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{label}</span>
        <div style={{ flexShrink: 0 }}>{right}</div>
      </button>
    );
  }

  return (
    <div style={{ background: '#F0F7FF', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '28px 20px 56px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.3px' }}>
          My Profile
        </h2>
      </div>

      {/* Avatar + Name card */}
      <div style={{ margin: '0 16px', marginTop: -40, position: 'relative', zIndex: 2 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, flexShrink: 0,
            background: 'linear-gradient(135deg, #0B3D66, #041B30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 900, color: 'white',
            border: '3px solid rgba(11,61,102,0.1)',
          }}>
            {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 2, letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name ?? 'Guest'}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              +91 {user?.phone}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, background: '#F0F7FF', borderRadius: 20, padding: '2px 8px' }}>
              <Shield size={10} color="#0B3D66" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0B3D66' }}>
                {user?.role === 'owner' ? 'Owner Account' : 'Verified Customer'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '16px 16px 0' }}>
        {[
          { label: 'Bookings', value: totalBookings, emoji: '📋' },
          { label: 'Completed', value: completedBookings, emoji: '✅' },
          { label: 'Total Spent', value: `₹${totalSpent}`, emoji: '💰' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14, padding: '14px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.emoji}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{stat.value}</div>
            <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Saved Addresses Placeholder */}
      <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 20, padding: '4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 0 4px' }}>
          Saved Addresses
        </p>
        <SettingRow
          icon={<Globe size={18} color="#0B3D66" />}
          label="Home"
          right={<span style={{ fontSize: 11, color: '#94A3B8' }}>Coming Soon</span>}
        />
        <div style={{ borderBottom: '1px solid #F1F5F9' }} />
        <SettingRow
          icon={<Globe size={18} color="#0B3D66" />}
          label="Work"
          right={<span style={{ fontSize: 11, color: '#94A3B8' }}>Coming Soon</span>}
        />
      </div>

      {/* Settings */}
      <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 20, padding: '4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 0 4px' }}>
          Preferences
        </p>

        <div style={{ borderBottom: '1px solid #F1F5F9' }}>
          <SettingRow
            icon={<Globe size={18} color="#0B3D66" />}
            label="Language"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0B3D66' }}>{selectedLang.native}</span>
                <ChevronRight size={14} color="#94A3B8" />
              </div>
            }
            onClick={() => setShowLangPicker(true)}
          />
        </div>

        <div style={{ borderBottom: '1px solid #F1F5F9' }}>
          <SettingRow
            icon={settings.sounds ? <Volume2 size={18} color="#0B3D66" /> : <VolumeX size={18} color="#94A3B8" />}
            label="Sound Effects"
            right={
              <div
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: settings.sounds ? '#0B3D66' : '#E2E8F0',
                  position: 'relative', transition: 'background 0.2s ease',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, left: settings.sounds ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s ease',
                }} />
              </div>
            }
            onClick={toggleSounds}
          />
        </div>

        <SettingRow
          icon={<Bell size={18} color={settings.voice ? '#0B3D66' : '#94A3B8'} />}
          label="Voice Guidance"
          right={
            <div
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                background: settings.voice ? '#0B3D66' : '#E2E8F0',
                position: 'relative', transition: 'background 0.2s ease',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: settings.voice ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s ease',
              }} />
            </div>
          }
          onClick={toggleVoice}
        />
      </div>

      {/* Owner Admin Tools */}
      {user?.role === 'owner' && (
        <div style={{ margin: '12px 16px 0', background: 'white', borderRadius: 20, padding: '4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 0 4px' }}>
            Admin Tools
          </p>
          <SettingRow
            icon={<Shield size={18} color="#F59E0B" />}
            label="Owner Dashboard"
            right={<ChevronRight size={14} color="#94A3B8" />}
            onClick={onOpenOwnerPanel}
          />
        </div>
      )}

      {/* Help */}
      <div style={{ margin: '12px 16px 0', background: 'white', borderRadius: 20, padding: '4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 0 4px' }}>
          Support
        </p>
        <SettingRow
          icon={<HelpCircle size={18} color="#0B3D66" />}
          label="Help & FAQ"
          right={<ChevronRight size={14} color="#94A3B8" />}
          onClick={() => showToast('Help center coming soon!', 'info')}
        />
      </div>

      {/* Logout & Delete */}
      <div style={{ margin: '12px 16px 0', background: 'white', borderRadius: 20, padding: '4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <SettingRow
          icon={<LogOut size={18} color="#EF4444" />}
          label="Log Out"
          right={<ChevronRight size={14} color="#94A3B8" />}
          onClick={() => setShowLogoutConfirm(true)}
        />
        <div style={{ borderBottom: '1px solid #F1F5F9' }} />
        <SettingRow
          icon={<Shield size={18} color="#EF4444" />}
          label="Delete Account"
          right={<ChevronRight size={14} color="#94A3B8" />}
          onClick={() => setShowDeleteConfirm(true)}
        />
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#CBD5E1', fontWeight: 500, margin: '24px 0 100px' }}>
        Neighborly Trust v2.0 · DPDP Act 2023 compliant
      </p>

      {/* Language Picker Modal */}
      {showLangPicker && (
        <div className="modal-backdrop" onClick={() => setShowLangPicker(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 16 }}>
              Choose Language
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setShowLangPicker(false); showToast(`Language changed to ${lang.label}`); }}
                  style={{
                    padding: '14px 16px', borderRadius: 14, textAlign: 'left',
                    background: settings.language === lang.code ? '#0B3D66' : '#F8FAFC',
                    border: `2px solid ${settings.language === lang.code ? '#0B3D66' : '#E2E8F0'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, color: settings.language === lang.code ? 'white' : '#0F172A' }}>
                    {lang.native}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: settings.language === lang.code ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>
                    {lang.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Log Out?</h3>
              <p style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                You'll be signed out of your account.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); logoutUser(); }}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#EF4444', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Delete Account?</h3>
              <p style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                This action is permanent and cannot be undone. All your data will be erased.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => { 
                  setShowDeleteConfirm(false); 
                  const success = await deleteAccount(); 
                  if (!success) showToast('Failed to delete account.', 'error');
                }}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#EF4444', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
