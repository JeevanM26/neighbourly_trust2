import React, { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { CallAudioSynthesizer, formatCallDuration } from '../lib/callEngine';

export function CallOverlay({ webrtc }: { webrtc: ReturnType<typeof useWebRTC> }) {
  const { callStatus, incomingCall, answerCall, declineCall, endCall, toggleMute, toggleSpeaker, isMuted, isSpeakerOn, audioRef } = webrtc;
  
  const [duration, setDuration] = useState(0);
  const synthRef = useRef<CallAudioSynthesizer | null>(null);

  // Handle synth tones based on status
  useEffect(() => {
    if (callStatus === 'ringing' || callStatus === 'calling') {
      if (!synthRef.current) synthRef.current = new CallAudioSynthesizer();
      synthRef.current.playRingback();
    } else if (callStatus === 'connected') {
      synthRef.current?.stop();
    } else if (callStatus === 'idle') {
      synthRef.current?.stop();
      if (synthRef.current) synthRef.current.playEndCall(); // assuming we want an end call tone
    }
    
    return () => {
      synthRef.current?.stop();
    };
  }, [callStatus]);

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
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', color: 'white', animation: 'nt-fade-in 0.2s ease forwards' }}>
        <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
        
        <div style={{ position: 'relative', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100dvh', maxHeight: 850, padding: '48px 0' }}>
          
          {/* Top Header */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} color="#10B981" />
              <span style={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>End-to-end encrypted</span>
            </div>
          </div>

          {/* Center Content: Avatar & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto 0', width: '100%' }}>
            
            <div style={{ position: 'relative', marginBottom: 32 }}>
              {(callStatus === 'ringing' || callStatus === 'calling') && (
                <div style={{ position: 'absolute', top: -16, left: -16, right: -16, bottom: -16, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', animation: 'nt-pulse-ring 2s infinite' }} />
              )}
              <div style={{ position: 'relative', width: 128, height: 128, borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backdropFilter: 'blur(4px)' }}>
                {incomingCall?.callerAvatar ? (
                  <img src={incomingCall.callerAvatar} alt={incomingCall.callerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Phone size={48} color="rgba(255,255,255,0.4)" />
                )}
              </div>
            </div>

            <h3 style={{ fontSize: 30, fontWeight: 300, letterSpacing: 0.5, color: 'white', marginBottom: 8, textAlign: 'center', margin: 0 }}>
              {incomingCall ? incomingCall.callerName : 'Neighborly Trust Call'}
            </h3>

            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 0.5, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
              {callStatus === 'calling' && <span>Calling...</span>}
              {callStatus === 'ringing' && <span>Incoming Voice Call</span>}
              {callStatus === 'connected' && (
                <span style={{ color: 'white', fontFamily: 'monospace', fontSize: 18, fontWeight: 300 }}>
                  {formatCallDuration(duration)}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Control Buttons */}
          <div style={{ width: '100%', marginBottom: 32 }}>
            {callStatus === 'ringing' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 48px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={declineCall}
                    style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#FF3B30', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(255,59,48,0.2)' }}
                  >
                    <PhoneOff size={32} color="white" />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Decline</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={answerCall}
                    style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#34C759', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(52,199,89,0.2)' }}
                  >
                    <Phone size={32} color="white" fill="white" />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Accept</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, padding: '0 24px' }}>
                {/* Mute Toggle */}
                <button
                  onClick={toggleMute}
                  disabled={callStatus !== 'connected'}
                  style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isMuted ? 'white' : 'rgba(255,255,255,0.15)', color: isMuted ? 'black' : 'white', border: 'none', cursor: callStatus === 'connected' ? 'pointer' : 'not-allowed', opacity: callStatus === 'connected' ? 1 : 0.4 }}
                >
                  {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
                </button>

                {/* End Call Button */}
                <button
                  onClick={endCall}
                  style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#FF3B30', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(255,59,48,0.2)' }}
                >
                  <PhoneOff size={28} fill="white" />
                </button>

                {/* Speaker Toggle */}
                <button
                  onClick={toggleSpeaker}
                  disabled={callStatus !== 'connected'}
                  style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSpeakerOn ? 'white' : 'rgba(255,255,255,0.15)', color: isSpeakerOn ? 'black' : 'white', border: 'none', cursor: callStatus === 'connected' ? 'pointer' : 'not-allowed', opacity: callStatus === 'connected' ? 1 : 0.4 }}
                >
                  {isSpeakerOn ? <Volume2 size={28} /> : <VolumeX size={28} />}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
