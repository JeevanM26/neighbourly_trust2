// In-App Calling Engine & Privacy Shield Utility for Neighborly Trust

export type CallStatus = 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended';

export interface CallSession {
  id: string;
  recipientName: string;
  recipientCategory: string;
  recipientAvatar?: string;
  maskedPhone: string;
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
 * Sound FX & Haptic Vibration Synthesizer using Web Audio API and Navigator Vibration API.
 * Provides high-audibility multi-tone synthesized ringtones and urgent phone vibration without external assets.
 */
export class CallAudioSynthesizer {
  private audioCtx: AudioContext | null = null;
  private ringTimer: any = null;
  private vibrateTimer: any = null;

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

  /**
   * Loud Multi-Tone Incoming Call Ringtone & Continuous Phone Vibration
   */
  playIncomingCall(callerName: string = 'Someone') {
    this.stop();
    this.initContext();

    const playHarmonicChime = () => {
      if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
      try {
        const now = this.audioCtx.currentTime;
        
        // High-audibility dual-tone telephone chord sequence (C5+E5 -> E5+G5 -> G5+C6)
        const notes = [
          { freq1: 523.25, freq2: 659.25, time: 0, dur: 0.20 },     // C5 + E5
          { freq1: 659.25, freq2: 783.99, time: 0.24, dur: 0.20 },   // E5 + G5
          { freq1: 783.99, freq2: 1046.50, time: 0.48, dur: 0.40 },  // G5 + C6
        ];

        notes.forEach(({ freq1, freq2, time, dur }) => {
          if (!this.audioCtx) return;
          const osc1 = this.audioCtx.createOscillator();
          const osc2 = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(freq1, now + time);
          osc2.frequency.setValueAtTime(freq2, now + time);

          gain.gain.setValueAtTime(0, now + time);
          gain.gain.linearRampToValueAtTime(0.32, now + time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc1.start(now + time);
          osc2.start(now + time);
          osc1.stop(now + time + dur + 0.05);
          osc2.stop(now + time + dur + 0.05);
        });
      } catch (e) {
        console.warn('[WebRTC Audio] Ring chime error:', e);
      }
    };

    // Play chime immediately and loop every 2.2 seconds
    playHarmonicChime();
    this.ringTimer = setInterval(playHarmonicChime, 2200);

    // Continuous Strong Phone Vibration ([800ms vibrate, 250ms pause, 800ms vibrate, 250ms pause])
    const triggerVibration = () => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([800, 250, 800, 250]);
        } catch {}
      }
    };
    triggerVibration();
    this.vibrateTimer = setInterval(triggerVibration, 2100);
  }

  /**
   * New Booking Request Alert Tone (Ascending Arpeggio + Urgent Haptic Pulses)
   */
  playNewBookingAlert(customerName: string = 'Customer', categoryName: string = 'Service') {
    this.stop();
    this.initContext();

    if (this.audioCtx && this.audioCtx.state !== 'suspended') {
      try {
        const now = this.audioCtx.currentTime;
        // 4-tone ascending alert arpeggio (D5 -> F#5 -> A5 -> D6)
        const freqs = [587.33, 739.99, 880.00, 1174.66];
        freqs.forEach((freq, idx) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.28);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.3);
        });
      } catch {}
    }

    // Strong Vibration pattern for new booking offer
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([500, 200, 500, 200, 800]);
      } catch {}
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
    if (this.vibrateTimer) {
      clearInterval(this.vibrateTimer);
      this.vibrateTimer = null;
    }
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
  }
}
