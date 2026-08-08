import { useState, useEffect, useRef } from 'react';
import { getClient } from '../lib/supabase';
import { CallManager, CallStatus, IncomingCallInfo } from '../lib/webrtc/callManager';

export function useWebRTC(userId: string) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const managerRef = useRef<CallManager | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!userId) return;
    const client = getClient();
    if (!client) return;

    managerRef.current = new CallManager(client, userId, () => {
      if (!managerRef.current) return;
      setCallStatus(managerRef.current.status);
      setIncomingCall(managerRef.current.incomingCall);
      setRemoteStream(managerRef.current.remoteStream);
      setIsMuted(managerRef.current.isMuted);
      setIsSpeakerOn(managerRef.current.isSpeakerOn);
    });

    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [userId]);

  // Connect remote stream to hidden audio element
  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(e => console.error('Audio play error', e));
    }
  }, [remoteStream, callStatus]);

  const startCall = (targetUserId: string, targetName: string, callerName: string, callerAvatar?: string) => {
    managerRef.current?.startCall(targetUserId, targetName, callerName, callerAvatar);
  };

  const answerCall = () => {
    managerRef.current?.answerCall();
  };

  const declineCall = () => {
    managerRef.current?.declineCall();
  };

  const endCall = () => {
    managerRef.current?.endCall();
  };

  const toggleMute = () => {
    managerRef.current?.toggleMute();
  };

  const toggleSpeaker = () => {
    managerRef.current?.toggleSpeaker();
  };

  return {
    callStatus,
    incomingCall,
    remoteStream,
    isMuted,
    isSpeakerOn,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    audioRef
  };
}
