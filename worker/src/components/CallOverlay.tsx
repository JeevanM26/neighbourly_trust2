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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in text-white">
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
      
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 shadow-2xl border border-slate-800 flex flex-col items-center justify-between h-[520px]">
        
        {/* Top Header */}
        <div className="w-full flex items-center justify-center text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-slate-200">Neighborly Privacy Shield</span>
          </div>
        </div>

        {/* Center Content: Avatar & Info */}
        <div className="flex flex-col items-center my-auto py-6 text-center w-full">
          {/* Animated Avatar Ring */}
          <div className="relative mb-6">
            {(callStatus === 'ringing' || callStatus === 'calling') ? (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-pulse-ring" />
                <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse-dot" />
              </>
            ) : callStatus === 'connected' ? (
              <div className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-pulse-dot" />
            ) : null}

            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-xl flex items-center justify-center z-10">
              {incomingCall?.callerAvatar ? (
                <img src={incomingCall.callerAvatar} alt={incomingCall.callerName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-slate-400">📞</span>
              )}
            </div>
          </div>

          {/* Name & Status */}
          <h3 className="text-2xl font-black tracking-tight text-white mb-2">
            {incomingCall ? incomingCall.callerName : 'Neighborly Trust Call'}
          </h3>

          <div className="text-sm font-medium tracking-wide">
            {callStatus === 'calling' && <span className="text-blue-300 animate-pulse">Calling...</span>}
            {callStatus === 'ringing' && <span className="text-amber-300 animate-pulse">Incoming Voice Call...</span>}
            {callStatus === 'connected' && (
              <span className="text-emerald-400 font-mono text-lg font-bold">
                {formatCallDuration(duration)}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Control Buttons */}
        <div className="w-full">
          {callStatus === 'ringing' ? (
            <div className="flex items-center justify-around w-full px-4 mb-4">
              <button
                onClick={declineCall}
                className="flex flex-col items-center justify-center p-4 rounded-full bg-rose-600 hover:bg-rose-700 transition-transform active:scale-95 shadow-lg shadow-rose-900/40"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={answerCall}
                className="flex flex-col items-center justify-center p-4 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-transform active:scale-95 shadow-lg shadow-emerald-900/40 animate-bounce"
              >
                <Phone className="w-8 h-8 text-white fill-white" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center px-2 mb-2">
              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                disabled={callStatus !== 'connected'}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isMuted ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:bg-slate-800'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isMuted ? <MicOff className="w-6 h-6 mb-1" /> : <Mic className="w-6 h-6 mb-1" />}
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{isMuted ? 'Muted' : 'Mute'}</span>
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-900/40 transition-transform active:scale-95"
              >
                <PhoneOff className="w-7 h-7 mb-1 fill-white" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1">End</span>
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={toggleSpeaker}
                disabled={callStatus !== 'connected'}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSpeakerOn ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:bg-slate-800'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isSpeakerOn ? <Volume2 className="w-6 h-6 mb-1 text-blue-400" /> : <VolumeX className="w-6 h-6 mb-1" />}
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{isSpeakerOn ? 'Speaker' : 'Speaker'}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
