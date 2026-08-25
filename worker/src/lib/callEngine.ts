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
   * Loops continuously until accept, decline, or modal timeout.
   */
  playNewBookingAlert(customerName: string = 'Customer', categoryName: string = 'Service') {
    this.stop();
    this.initContext();

    const playAlertChime = () => {
      if (!this.audioCtx) this.initContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      if (!this.audioCtx) return;

      try {
        const now = this.audioCtx.currentTime;
        // 4-tone loud attention-grabbing ascending arpeggio (D5 -> F#5 -> A5 -> D6)
        const freqs = [587.33, 739.99, 880.00, 1174.66];
        freqs.forEach((freq, idx) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);

          gain.gain.setValueAtTime(0, now + idx * 0.14);
          gain.gain.linearRampToValueAtTime(0.40, now + idx * 0.14 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.32);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.35);
        });
      } catch (e) {
        console.warn('[WebRTC Audio] Booking alert chime error:', e);
      }
    };

    // Play chime immediately and repeat every 2.4s
    playAlertChime();
    this.ringTimer = setInterval(playAlertChime, 2400);

    // Urgent repeating vibration
    const triggerBookingVibration = () => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([600, 200, 600, 200, 800]);
        } catch {}
      }
    };
    triggerBookingVibration();
    this.vibrateTimer = setInterval(triggerBookingVibration, 2400);
  }

  /**
   * Outbound Call Ringback — heard by the CALLER (worker) while waiting.
   * Plays a classic dual-tone ringback (400Hz+450Hz, 1s on / 4s off)
   * and gives the caller a single buzz every 5 seconds so they feel it ringing.
   */
  playRingback() {
    this.stop();
    this.initContext();
    if (!this.audioCtx) return;

    const playRingbackTone = () => {
      if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
      try {
        const now = this.audioCtx.currentTime;
        // Classic PSTN ringback: 440Hz + 480Hz for 2s
        const frequencies = [440, 480];
        frequencies.forEach(freq => {
          if (!this.audioCtx) return;
          const osc  = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.setValueAtTime(0.12, now + 1.8);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now);
          osc.stop(now + 2.0);
        });
      } catch (e) {
        console.warn('[CallEngine] Ringback error:', e);
      }
    };

    // Play immediately, then every 5s (2s tone + 3s silence)
    playRingbackTone();
    this.ringTimer = setInterval(playRingbackTone, 5000);

    // Single buzz every 5s — lets caller feel the call is ringing
    const triggerCallerVibration = () => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([200]); } catch {}
      }
    };
    triggerCallerVibration();
    this.vibrateTimer = setInterval(triggerCallerVibration, 5000);
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
