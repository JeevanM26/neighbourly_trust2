'use client';

// ── Universal Multi-lingual Voice Assistant for Tradespeople ──
// Supports Kannada, Hindi, and English with auto-fallback

export function speakText(text: string, lang: 'en' | 'kn' | 'hi' | 'te' | 'ta' = 'kn') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any previous ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92; // Slightly slower, very clear cadence for field clarity
    utterance.pitch = 1.0;

    // Pick appropriate language code
    const langMap: Record<string, string> = {
      kn: 'kn-IN',
      hi: 'hi-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      en: 'en-IN'
    };

    utterance.lang = langMap[lang] || 'en-IN';

    // Find a matching voice if available in browser
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)));
    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

export function playSuccessSound() {
  if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in window)) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3); // C6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}
