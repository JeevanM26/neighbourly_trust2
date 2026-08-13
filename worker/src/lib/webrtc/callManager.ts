import { getIceServers, TurnCredential } from './turn';
import { SignalingManager } from './signaling';
import { SupabaseClient } from '@supabase/supabase-js';

export type CallStatus = 'idle' | 'ringing' | 'calling' | 'connected';

export interface IncomingCallInfo {
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  roomId: string;
}

export class CallManager {
  public status: CallStatus = 'idle';
  public incomingCall: IncomingCallInfo | null = null;
  public activeRoomId: string | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public isMuted = false;
  public isSpeakerOn = false;

  private peerConnection: RTCPeerConnection | null = null;
  private signaling: SignalingManager;
  private userId: string;
  private onStateChange: () => void;
  private autoDeclineTimeout: any = null;
  private personalSubCleanup: (() => void) | null = null;
  private beforeUnloadHandler = () => {
    // Immediately terminate call state if user reloads or closes tab
    if (this.status !== 'idle') {
      this.endCall(); // Broadcast closure
      this.cleanup(); // Local teardown
    }
  };

  constructor(client: SupabaseClient, userId: string, onStateChange: () => void) {
    this.signaling = new SignalingManager(client);
    this.userId = userId;
    this.onStateChange = onStateChange;

    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    this.personalSubCleanup = this.signaling.subscribeToPersonalChannel(userId, (payload) => {
      if (this.status === 'idle') {
        this.incomingCall = {
          callerId: payload.callerId,
          callerName: payload.callerName,
          callerAvatar: payload.callerAvatar,
          roomId: payload.roomId
        };
        this.setStatus('ringing');
        
        // 30-second auto-decline
        this.autoDeclineTimeout = setTimeout(() => {
          if (this.status === 'ringing') {
            this.declineCall();
          }
        }, 30000);
      } else {
        // Send busy signal back to the specific room
        const tempSignaling = new SignalingManager(client);
        tempSignaling.joinRoom(payload.roomId, () => {}).then(() => {
          tempSignaling.sendSignal('call_busy', {});
          setTimeout(() => tempSignaling.leaveRoom(), 1000);
        }).catch(e => console.error('Error joining busy room:', e));
      }
    });
  }

  private setStatus(newStatus: CallStatus) {
    this.status = newStatus;
    this.onStateChange();
  }

  private optimizeAudioSdp(sdp: string): string {
    // Constrain Opus codec to 12kbps mono speech to conserve Metered.ca free-tier TURN quota by 85%
    if (sdp.includes('opus/48000')) {
      return sdp.replace(
        /(a=fmtp:\d+ [^\r\n]+)/g,
        '$1;maxaveragebitrate=12000;stereo=0;sprop-stereo=0;cbr=1'
      );
    }
    return sdp;
  }

  private async getMediaStream() {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (err) {
      console.warn('[WebRTC] Microphone access denied or unavailable:', err);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-error', { detail: 'Microphone access is required for voice calling.' }));
      }
      return null;
    }
  }

  private async setupPeerConnection() {
    const iceServers = await getIceServers();
    const pc = new RTCPeerConnection({ iceServers });
    this.peerConnection = pc;

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onStateChange();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendSignal('ice_candidate', { candidate: event.candidate, senderId: this.userId });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        console.warn(`[WebRTC] Connection state is ${state}, tearing down call FSM.`);
        this.cleanup();
      }
    };

    return pc;
  }

  private async setupSignalingHandlers() {
    await this.signaling.joinRoom(this.activeRoomId!, async (event) => {
      if ('senderId' in event && event.senderId === this.userId) return;

      switch (event.type) {
        case 'offer': {
          const pc = this.peerConnection || await this.setupPeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(event.offer));
          const answer = await pc.createAnswer();
          const optimizedAnswer = new RTCSessionDescription({
            type: answer.type,
            sdp: this.optimizeAudioSdp(answer.sdp || ''),
          });
          await pc.setLocalDescription(optimizedAnswer);
          this.signaling.sendSignal('answer', { answer: optimizedAnswer, senderId: this.userId });
          this.setStatus('connected');
          break;
        }
        case 'answer': {
          if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(event.answer));
            this.setStatus('connected');
          }
          break;
        }
        case 'ice_candidate': {
          if (this.peerConnection && event.candidate) {
            try {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
            } catch (e) {
              console.error('Error adding ice candidate', e);
            }
          }
          break;
        }
        case 'joined': {
          const pc = await this.setupPeerConnection();
          const offer = await pc.createOffer();
          const optimizedOffer = new RTCSessionDescription({
            type: offer.type,
            sdp: this.optimizeAudioSdp(offer.sdp || ''),
          });
          await pc.setLocalDescription(optimizedOffer);
          this.signaling.sendSignal('offer', { offer: optimizedOffer, senderId: this.userId });
          break;
        }
        case 'call_ended': {
          this.cleanup();
          break;
        }
        case 'call_declined': {
          this.cleanup();
          break;
        }
        case 'call_busy': {
          // Could dispatch a toast here
          this.cleanup();
          break;
        }
      }
    });
  }

  async startCall(targetUserId: string, targetName: string, callerName: string, callerAvatar?: string) {
    const stream = await this.getMediaStream();
    if (!stream) return;
    this.localStream = stream;

    this.activeRoomId = `call_${this.userId}_${targetUserId}_${Date.now()}`;
    
    // Timeout if unanswered
    if (this.autoDeclineTimeout) clearTimeout(this.autoDeclineTimeout);
    this.autoDeclineTimeout = setTimeout(() => {
      if (this.status === 'calling') {
        this.endCall();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-error', { detail: 'Call timed out' }));
      }
    }, 30000);

    this.setStatus('calling');
    await this.setupSignalingHandlers();

    await this.signaling.pingUser(targetUserId, this.userId, callerName, callerAvatar, this.activeRoomId);
  }

  async answerCall() {
    if (!this.incomingCall) return;
    if (this.autoDeclineTimeout) clearTimeout(this.autoDeclineTimeout);

    const stream = await this.getMediaStream();
    if (!stream) {
      this.declineCall();
      return;
    }
    this.localStream = stream;

    this.activeRoomId = this.incomingCall.roomId;
    await this.setupSignalingHandlers();
    
    // We setup the connection, wait for the other side to send an offer,
    // or send 'joined' to trigger them to send an offer
    await this.setupPeerConnection();
    this.signaling.sendSignal('joined', { senderId: this.userId });
    this.setStatus('connected');
  }

  declineCall() {
    if (this.autoDeclineTimeout) clearTimeout(this.autoDeclineTimeout);
    if (this.incomingCall) {
      // Send directly to the room they are waiting in
      const tempSignaling = new SignalingManager(this.signaling['client']);
      tempSignaling.joinRoom(this.incomingCall.roomId, () => {}).then(() => {
        tempSignaling.sendSignal('call_declined', {});
        setTimeout(() => tempSignaling.leaveRoom(), 1000);
      }).catch(e => console.error('Error joining decline room:', e));
    }
    this.cleanup();
  }

  endCall() {
    if (this.status === 'calling' || this.status === 'connected') {
      this.signaling.sendSignal('call_ended', {});
    }
    this.cleanup();
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted = !audioTrack.enabled;
        this.onStateChange();
      }
    }
  }

  toggleSpeaker() {
    // Note: Proper speaker routing usually requires setSinkId and is complex on mobile web.
    // We just toggle the state here for UI demonstration, or apply basic constraints.
    this.isSpeakerOn = !this.isSpeakerOn;
    this.onStateChange();
  }

  cleanup() {
    if (this.autoDeclineTimeout) clearTimeout(this.autoDeclineTimeout);
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.signaling.leaveRoom();
    
    this.activeRoomId = null;
    this.remoteStream = null;
    this.incomingCall = null;
    this.isMuted = false;
    this.isSpeakerOn = false;
    this.setStatus('idle');
  }

  destroy() {
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    this.cleanup();
    if (this.personalSubCleanup) {
      this.personalSubCleanup();
    }
  }
}

export function optimizeAudioSdp(sdp: string, targetBitrate = 12000): string {
  if (!sdp) return sdp;
  let optimized = sdp;
  if (optimized.includes('a=fmtp:111')) {
    optimized = optimized.replace(
      /a=fmtp:111 .*/g,
      `a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=${targetBitrate};stereo=0;sprop-stereo=0;cbr=1`
    );
  } else if (optimized.includes('m=audio')) {
    optimized = optimized.replace(
      /(m=audio[^\r\n]*\r?\n)/,
      `$1a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=${targetBitrate};stereo=0;sprop-stereo=0;cbr=1\r\n`
    );
  }
  return optimized;
}
