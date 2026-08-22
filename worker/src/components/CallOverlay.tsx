import React, { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { CallAudioSynthesizer, formatCallDuration } from '../lib/callEngine';

export function CallOverlay({ webrtc }: { webrtc?: ReturnType<typeof useWebRTC> }) {
  if (!webrtc) return null;
  const { callStatus, incomingCall, answerCall, declineCall, endCall, toggleMute, toggleSpeaker, isMuted, isSpeakerOn, audioRef } = webrtc;
  
  const [duration, setDuration] = useState(0);
  const synthRef = useRef<CallAudioSynthesizer | null>(null);

  // Handle synth tones and vibration based on status
  useEffect(() => {
    if (!synthRef.current) synthRef.current = new CallAudioSynthesizer();

    if (callStatus === 'ringing') {
      synthRef.current.playIncomingCall(incomingCall?.callerName || 'Customer');
    } else if (callStatus === 'calling') {
      synthRef.current.playRingback();
    } else if (callStatus === 'connected') {
      synthRef.current.stop();
    } else if (callStatus === 'idle') {
      synthRef.current.stop();
      if (duration > 0) synthRef.current.playEndCall();
    }
    
    return () => {
      synthRef.current?.stop();
    };
  }, [callStatus, incomingCall?.callerName]);

  // Handle duration timer
  useEffect(() => {
    if (callStatus !== 'connected') {
      setDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  if (callStatus === 'idle') return null;

  return (
    <>
      <style>{`
        @keyframes nt-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nt-pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          80% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(2,6,23,0.95)', backdropFilter: 'blur(12px)', color: 'white', animation: 'nt-fade-in 0.2s ease forwards' }}>
        <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
        
        <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'linear-gradient(180deg, #0F172A 0%, #0F172A 50%, #020617 100%)', borderRadius: 24, padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: 520 }}>
          
          {/* Top Header */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94A3B8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(30,41,59,0.8)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(51,65,85,0.5)' }}>
              <ShieldCheck size={14} color="#34D399" />
              <span style={{ fontWeight: 500, color: '#E2E8F0' }}>Hero Hand Privacy Shield</span>
            </div>
          </div>

          {/* Center Content: Avatar & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto 0', padding: '24px 0', textAlign: 'center', width: '100%' }}>
            
            <div style={{ position: 'relative', marginBottom: 24 }}>
              {(callStatus === 'ringing' || callStatus === 'calling') && (
                <div style={{ position: 'absolute', top: -16, left: -16, right: -16, bottom: -16, borderRadius: '50%', border: '4px solid rgba(59,130,246,0.3)', animation: 'nt-pulse-ring 2s infinite' }} />
              )}
              
              <div style={{ position: 'relative', width: 112, height: 112, borderRadius: '50%', overflow: 'hidden', border: '2px solid #334155', backgroundColor: '#1E293B', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                {incomingCall?.callerAvatar ? (
                  <img src={incomingCall.callerAvatar} alt={incomingCall.callerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 36, color: '#94A3B8' }}>📞</span>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5, color: 'white', margin: '0 0 8px' }}>
              {incomingCall ? incomingCall.callerName : 'Hero Hand Call'}
            </h3>

            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 0.5 }}>
              {callStatus === 'calling' && <span style={{ color: '#93C5FD' }}>Calling...</span>}
              {callStatus === 'ringing' && <span style={{ color: '#FCD34D' }}>Incoming Voice Call...</span>}
              {callStatus === 'connected' && (
                <span style={{ color: '#34D399', fontFamily: 'monospace', fontSize: 18, fontWeight: 700 }}>
                  {formatCallDuration(duration)}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Control Buttons */}
          <div style={{ width: '100%' }}>
            {callStatus === 'ringing' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', padding: '0 16px', marginBottom: 16 }}>
                <button
                  onClick={declineCall}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: '50%', backgroundColor: '#E11D48', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(159,18,57,0.4)' }}
                >
                  <PhoneOff size={32} color="white" />
                </button>
                <button
                  onClick={answerCall}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: '50%', backgroundColor: '#10B981', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(6,78,59,0.4)' }}
                >
                  <Phone size={32} color="white" fill="white" />
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center', padding: '0 8px', marginBottom: 8 }}>
                {/* Mute Toggle */}
                <button
                  onClick={toggleMute}
                  disabled={callStatus !== 'connected'}
                  style={{ padding: 16, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: isMuted ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(51,65,85,0.6)', backgroundColor: isMuted ? 'rgba(245,158,11,0.2)' : 'rgba(30,41,59,0.8)', color: isMuted ? '#FCD34D' : '#CBD5E1', cursor: callStatus === 'connected' ? 'pointer' : 'not-allowed', opacity: callStatus === 'connected' ? 1 : 0.4 }}
                >
                  <MicOff size={24} style={{ marginBottom: 4, display: isMuted ? 'block' : 'none' }} />
                  <Mic size={24} style={{ marginBottom: 4, display: !isMuted ? 'block' : 'none' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                {/* End Call Button */}
                <button
                  onClick={endCall}
                  style={{ padding: 16, borderRadius: 16, backgroundColor: '#E11D48', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(159,18,57,0.4)' }}
                >
                  <PhoneOff size={28} fill="white" style={{ marginBottom: 4 }} />
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>End</span>
                </button>

                {/* Speaker Toggle */}
                <button
                  onClick={toggleSpeaker}
                  disabled={callStatus !== 'connected'}
                  style={{ padding: 16, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: isSpeakerOn ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(51,65,85,0.6)', backgroundColor: isSpeakerOn ? 'rgba(59,130,246,0.2)' : 'rgba(30,41,59,0.8)', color: isSpeakerOn ? '#93C5FD' : '#CBD5E1', cursor: callStatus === 'connected' ? 'pointer' : 'not-allowed', opacity: callStatus === 'connected' ? 1 : 0.4 }}
                >
                  <Volume2 size={24} color="#60A5FA" style={{ marginBottom: 4, display: isSpeakerOn ? 'block' : 'none' }} />
                  <VolumeX size={24} style={{ marginBottom: 4, display: !isSpeakerOn ? 'block' : 'none' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{isSpeakerOn ? 'Speaker' : 'Speaker'}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
