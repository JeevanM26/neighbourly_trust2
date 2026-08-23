import { describe, it, expect } from 'vitest';
import { formatMaskedPhone, formatCallDuration, CallAudioSynthesizer, CallStatus } from '../lib/callEngine';

describe('Neighborly Trust — Calling Feature & Privacy Shield Engine', () => {
  describe('Privacy Shield (formatMaskedPhone)', () => {
    it('masks standard 10-digit phone numbers correctly', () => {
      expect(formatMaskedPhone('9876543210')).toBe('+91 98*** **210');
      expect(formatMaskedPhone('8867269712')).toBe('+91 88*** **712');
    });

    it('handles phone numbers with +91 country code and spaces', () => {
      expect(formatMaskedPhone('+91 9876543210')).toBe('+91 98*** **210');
      expect(formatMaskedPhone('+91-98765-43210')).toBe('+91 98*** **210');
    });

    it('handles empty or invalid phone strings safely without crashing', () => {
      expect(formatMaskedPhone('')).toBe('+91 ** *** ****');
      expect(formatMaskedPhone('123')).toBe('+91 12*** ***');
    });
  });

  describe('Call Duration Formatter (formatCallDuration)', () => {
    it('formats 0 seconds to 00:00', () => {
      expect(formatCallDuration(0)).toBe('00:00');
    });

    it('formats single digit seconds to 00:05', () => {
      expect(formatCallDuration(5)).toBe('00:05');
    });

    it('formats minutes and seconds correctly (e.g. 134s -> 02:14)', () => {
      expect(formatCallDuration(134)).toBe('02:14');
      expect(formatCallDuration(3600)).toBe('60:00');
    });

    it('handles negative values gracefully', () => {
      expect(formatCallDuration(-10)).toBe('00:00');
    });
  });

  describe('Call State Transitions', () => {
    it('defines valid call status lifecycles', () => {
      const validStatuses: CallStatus[] = ['idle', 'dialing', 'ringing', 'connected', 'ended'];
      validStatuses.forEach(status => {
        expect(typeof status).toBe('string');
      });
    });
  });

  describe('CallAudioSynthesizer', () => {
    it('instantiates audio synthesizer cleanly in non-browser env', () => {
      const synth = new CallAudioSynthesizer();
      expect(synth).toBeDefined();
      expect(typeof synth.playRingback).toBe('function');
      expect(typeof synth.playEndCall).toBe('function');
      expect(typeof synth.stop).toBe('function');
      
      // Safety checks when invoked in node/vitest environment
      expect(() => synth.playRingback()).not.toThrow();
      expect(() => synth.playEndCall()).not.toThrow();
      expect(() => synth.stop()).not.toThrow();
    });
  });
});
