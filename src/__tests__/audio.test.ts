import { describe, it, expect } from 'vitest';
import { LANG_BCP47, normalizeLangKey } from '../lib/audio';

const DIALECT_MAP: Record<string, string[]> = {
  'Electrician': ['electrician', 'बिजली', 'करंट', 'फ्यूज', 'लाइट', 'तार', 'current', 'wire', 'light', 'spark', 'electric'],
  'Plumber': ['plumber', 'नल', 'पानी', 'पाइप', 'लीकेज', 'टंकी', 'प्लंबर', 'पानी टपक', 'water', 'pipe', 'leak', 'tap'],
  'Carpenter': ['carpenter', 'लकड़ी', 'दरवाजा', 'खिड़की', 'बढ़ई', 'फर्नीचर', 'मिस्त्री', 'wood', 'door', 'furniture', 'table', 'chair'],
  'Home Clean': ['home clean', 'clean', 'सफाई', 'झाड़ू', 'पोछा', 'कचरा', 'धोना', 'सफाई वाली', 'maid', 'sweep', 'mop', 'wash'],
};

function matchDialectCategory(q: string): string | null {
  const lower = q.toLowerCase();
  for (const [category, keywords] of Object.entries(DIALECT_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return null;
}

describe('Zero-Lag Audio Engine & Multi-Lingual Sync', () => {
  it('normalizes language inputs from codes, native labels, and English names', () => {
    expect(normalizeLangKey('kn')).toBe('ಕನ್ನಡ');
    expect(normalizeLangKey('Kannada')).toBe('ಕನ್ನಡ');
    expect(normalizeLangKey('ಕನ್ನಡ')).toBe('ಕನ್ನಡ');

    expect(normalizeLangKey('hi')).toBe('हिंदी');
    expect(normalizeLangKey('Hindi')).toBe('हिंदी');
    expect(normalizeLangKey('हिंदी')).toBe('हिंदी');

    expect(normalizeLangKey('en')).toBe('English');
    expect(normalizeLangKey('English')).toBe('English');
  });

  it('maps all language variants to correct BCP47 voice tags', () => {
    expect(LANG_BCP47['en']).toBe('en-US');
    expect(LANG_BCP47['kn']).toBe('kn-IN');
    expect(LANG_BCP47['hi']).toBe('hi-IN');
  });

  it('resolves voice search transcript dialect phrases to correct service categories', () => {
    expect(matchDialectCategory('i need an electrician to fix light')).toBe('Electrician');
    expect(matchDialectCategory('पानी टपक रहा है pipe leak')).toBe('Plumber');
    expect(matchDialectCategory('door repair wood furniture')).toBe('Carpenter');
    expect(matchDialectCategory('home sweep mop cleaning')).toBe('Home Clean');
  });
});
