// In-App Calling Engine & Privacy Shield Utility for Neighborly Trust

export type CallStatus = 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended';

export interface CallSession {
  id: string;
  recipientName: string;
  recipientCategory: string;
  recipientAvatar?: string;
  maskedPhone: string;
  rawPhone: string;
  status: CallStatus;
  startedAt?: number;
  durationSeconds: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
}

/**
 * Safely masks phone numbers to protect customer and specialist privacy.
 * Example: "9876543210" -> "+91 98*** **210"
 * Example: "+919876543210" -> "+91 98*** **210"
 */
export function formatMaskedPhone(phone: string): string {
  if (!phone) return '+91 ** *** ****';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return `+91 ${clean.slice(0, 2)}*** ***`;
  
  const last10 = clean.slice(-10);
  const prefix = last10.slice(0, 2);
  const suffix = last10.slice(-3);
  return `+91 ${prefix}*** **${suffix}`;
}

/**
 * Formats duration seconds into digital clock display (e.g. 125 -> "02:05")
 */
export function formatCallDuration(seconds: number): string {
  if (seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const padMin = String(mins).padStart(2, '0');
  const padSec = String(secs).padStart(2, '0');
  return `${padMin}:${padSec}`;
}

/**
 * Sound FX Synthesizer using Web Audio API for call tones (no external audio assets required).
 */
export class CallAudioSynthesizer {
  private audioCtx: AudioContext | null = null;
  private ringOscillator: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringTimer: any = null;

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  playRingback() {
    this.stop();
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const playTone = () => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.2);
      };

      playTone();
      this.ringTimer = setInterval(playTone, 2500);
    } catch {
      // Audio context fallbacks ignored if user hasn't interacted
    }
  }

  playEndCall() {
    this.stop();
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.3);
    } catch {
      // Ignore audio failure
    }
  }

  stop() {
    if (this.ringTimer) {
      clearInterval(this.ringTimer);
      this.ringTimer = null;
    }
  }
}
