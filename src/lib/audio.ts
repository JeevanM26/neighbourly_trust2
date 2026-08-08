// Zero-Latency Multi-lingual Text-to-Speech Engine for Neighborly Trust

export const LANG_BCP47: Record<string, string> = {
  // English
  en: 'en-US',
  English: 'en-US',

  // Hindi
  hi: 'hi-IN',
  Hindi: 'hi-IN',
  'हिंदी': 'hi-IN',

  // Kannada
  kn: 'kn-IN',
  Kannada: 'kn-IN',
  'ಕನ್ನಡ': 'kn-IN',

  // Tamil
  ta: 'ta-IN',
  Tamil: 'ta-IN',
  'தமிழ்': 'ta-IN',

  // Telugu
  te: 'te-IN',
  Telugu: 'te-IN',
  'తెలుగు': 'te-IN',

  // Marathi
  mr: 'mr-IN',
  Marathi: 'mr-IN',
  'मराठी': 'mr-IN',

  // Bengali
  bn: 'bn-IN',
  Bengali: 'bn-IN',
  'বাংলা': 'bn-IN',

  // Gujarati
  gu: 'gu-IN',
  Gujarati: 'gu-IN',
  'ગુજરાતી': 'gu-IN',

  // Malayalam
  ml: 'ml-IN',
  Malayalam: 'ml-IN',
  'മലയാളം': 'ml-IN',

  // Punjabi
  pa: 'pa-IN',
  Punjabi: 'pa-IN',
  'ਪੰਜਾਬੀ': 'pa-IN',
};

// Maps any language code/name/native string to canonical native/English key
export function normalizeLangKey(input: string): string {
  if (!input) return 'English';
  const lower = input.toLowerCase().trim();

  if (lower === 'kn' || lower === 'kannada' || lower === 'ಕನ್ನಡ') return 'ಕನ್ನಡ';
  if (lower === 'hi' || lower === 'hindi' || lower === 'हिंदी') return 'हिंदी';
  if (lower === 'te' || lower === 'telugu' || lower === 'తెలుగు') return 'తెలుగు';
  if (lower === 'ta' || lower === 'tamil' || lower === 'தமிழ்') return 'தமிழ்';
  if (lower === 'mr' || lower === 'marathi' || lower === 'मराठी') return 'मराठी';
  if (lower === 'bn' || lower === 'bengali' || lower === 'বাংলা') return 'বাংলা';
  if (lower === 'gu' || lower === 'gujarati' || lower === 'ગુજરાતી') return 'ગુજરાતી';
  if (lower === 'ml' || lower === 'malayalam' || lower === 'മലയാളം') return 'മലയാളം';
  if (lower === 'pa' || lower === 'punjabi' || lower === 'ਪੰਜਾਬੀ') return 'ਪੰਜਾਬੀ';
  return 'English';
}

let listeners: Array<(text: string) => void> = [];
let cachedVoices: SpeechSynthesisVoice[] = [];

export function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const v = window.speechSynthesis.getVoices();
    if (v && v.length > 0) {
      cachedVoices = v;
    }
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    refreshVoices();
  };
}

export function registerSpeakListener(listener: (text: string) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifyListeners(text: string) {
  listeners.forEach((l) => l(text));
}

export function speakAudio(text: string, langName: string = 'English') {
  if (typeof window === 'undefined' || !text) return;

  notifyListeners(text);

  // Normalize language to BCP47 tag
  const targetLang =
    LANG_BCP47[langName] ||
    LANG_BCP47[normalizeLangKey(langName)] ||
    'en-US';
  const shortLang = targetLang.split('-')[0];

  if ('speechSynthesis' in window) {
    try {
      const synth = window.speechSynthesis;
      if (synth.speaking || synth.pending) {
        synth.cancel();
      }
      if (synth.paused) {
        synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;
      utterance.rate = 1.0; // Standard rate = 0ms hardware latency
      utterance.pitch = 1.0; // Standard pitch = no buffer delay
      utterance.volume = 1.0;

      const voices = refreshVoices();
      if (voices && voices.length > 0) {
        let match: SpeechSynthesisVoice | undefined;

        if (shortLang === 'en') {
          // For English: Prioritize instant local system English voices (en-US, en-GB, en-IN, en)
          match =
            voices.find((v) => v.lang.toLowerCase() === 'en-us' && v.localService) ||
            voices.find((v) => v.lang.toLowerCase() === 'en-us') ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en') && v.localService) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        } else {
          // For Indian languages: Match exact tag (e.g. kn-IN) first, then short tag (e.g. kn)
          match =
            voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
            voices.find((v) => v.lang.toLowerCase().startsWith(shortLang));
        }

        if (match) {
          utterance.voice = match;
        }
      }

      // Micro-task timeout ensures synth.cancel() completes hardware buffer cleanup on Chromium
      setTimeout(() => {
        synth.speak(utterance);
      }, 10);
      return;
    } catch (e) {
      console.warn('Native speech error, fallback to audio stream', e);
    }
  }

  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${shortLang}&client=tw-ob`;
    const audio = new Audio(ttsUrl);
    audio.playbackRate = 1.0;
    audio.play().catch(() => {});
  } catch (e) {}
}

export function stopAudio() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  notifyListeners('');
}

export function playAudioFeedback(type: 'success' | 'click' | 'toggle') {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'toggle') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch {
    // Audio context fallbacks silently
  }
}
