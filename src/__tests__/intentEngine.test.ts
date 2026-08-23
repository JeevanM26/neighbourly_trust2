import { describe, it, expect } from 'vitest';
import { detectIntent } from '../lib/intentEngine';

// ─── English ───────────────────────────────────────────────────
describe('English intent detection', () => {
  it('detects Electrician for "light not working"', () => {
    expect(detectIntent('light not working')?.category).toBe('Electrician');
  });
  it('detects Electrician for "short circuit in my house"', () => {
    expect(detectIntent('short circuit in my house')?.category).toBe('Electrician');
  });
  it('detects Plumber for "water leaking from tap"', () => {
    expect(detectIntent('water leaking from tap')?.category).toBe('Plumber');
  });
  it('detects Plumber for "pipe burst need help"', () => {
    expect(detectIntent('pipe burst need help')?.category).toBe('Plumber');
  });
  it('detects Plumber for "toilet blocked"', () => {
    expect(detectIntent('toilet blocked')?.category).toBe('Plumber');
  });
  it('detects Carpenter for "door not closing properly"', () => {
    expect(detectIntent('door not closing properly')?.category).toBe('Carpenter');
  });
  it('detects Carpenter for "bed broken need repair"', () => {
    expect(detectIntent('bed broken need repair')?.category).toBe('Carpenter');
  });
  it('detects Home Clean for "need maid for house cleaning"', () => {
    expect(detectIntent('need maid for house cleaning')?.category).toBe('Home Clean');
  });
  it('detects Painter for "wall painting needed"', () => {
    expect(detectIntent('wall painting needed')?.category).toBe('Painter');
  });
  it('detects Pest Control for "cockroach problem"', () => {
    expect(detectIntent('cockroach problem')?.category).toBe('Pest Control');
  });
  it('returns null for unrelated input', () => {
    expect(detectIntent('hello world')).toBeNull();
  });
});

// ─── Hindi ────────────────────────────────────────────────────
describe('Hindi intent detection', () => {
  it('detects Electrician for "बिजली नहीं है"', () => {
    expect(detectIntent('बिजली नहीं है')?.category).toBe('Electrician');
  });
  it('detects Electrician for "लाइट नहीं जल रही"', () => {
    expect(detectIntent('लाइट नहीं जल रही')?.category).toBe('Electrician');
  });
  it('detects Plumber for "पानी लीक हो रहा है"', () => {
    expect(detectIntent('पानी लीक हो रहा है')?.category).toBe('Plumber');
  });
  it('detects Plumber for "नल से पानी टपक रहा है"', () => {
    expect(detectIntent('नल से पानी टपक रहा है')?.category).toBe('Plumber');
  });
  it('detects Home Clean for "घर की सफाई चाहिए"', () => {
    expect(detectIntent('घर की सफाई चाहिए')?.category).toBe('Home Clean');
  });
  it('detects Carpenter for "दरवाजा नहीं बंद हो रहा"', () => {
    expect(detectIntent('दरवाजा नहीं बंद हो रहा')?.category).toBe('Carpenter');
  });
  it('detects Painter for "दीवार रंगनी है"', () => {
    expect(detectIntent('दीवार रंगनी है')?.category).toBe('Painter');
  });
  it('detects Pest Control for "दीमक लगी है"', () => {
    expect(detectIntent('दीमक लगी है')?.category).toBe('Pest Control');
  });
});

// ─── Tamil ───────────────────────────────────────────────────
describe('Tamil intent detection', () => {
  it('detects Electrician for "மின் தடை"', () => {
    expect(detectIntent('மின் தடை')?.category).toBe('Electrician');
  });
  it('detects Plumber for "தண்ணீர் கசிகிறது"', () => {
    expect(detectIntent('தண்ணீர் கசிகிறது')?.category).toBe('Plumber');
  });
});

// ─── Telugu ──────────────────────────────────────────────────
describe('Telugu intent detection', () => {
  it('detects Electrician for "కరెంట్ రావడం లేదు"', () => {
    expect(detectIntent('కరెంట్ రావడం లేదు')?.category).toBe('Electrician');
  });
  it('detects Plumber for "నీరు లీకవుతోంది"', () => {
    expect(detectIntent('నీరు లీకవుతోంది')?.category).toBe('Plumber');
  });
});

// ─── Confidence ───────────────────────────────────────────────
describe('Confidence scoring', () => {
  it('returns confidence between 0 and 1', () => {
    const result = detectIntent('water tap leaking in bathroom');
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThan(0);
    expect(result!.confidence).toBeLessThanOrEqual(1);
  });

  it('longer problem phrase yields higher confidence than single word', () => {
    const single  = detectIntent('water')!;
    const phrase  = detectIntent('water leaking from tap pipe burst')!;
    expect(phrase.confidence).toBeGreaterThanOrEqual(single.confidence);
  });

  it('provides matchedOn debug array', () => {
    const result = detectIntent('light not working, fuse blown');
    expect(result?.matchedOn.length).toBeGreaterThan(0);
  });
});
