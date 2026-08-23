import { describe, it, expect } from 'vitest';
import { calculateCommission, distanceKm, sortProvidersByDistanceAndFeatured, formatDistance } from '../lib/commission';
import { BookingStatus, Booking } from '../lib/types';

describe('Worker App Lifecycle & Core Business Logic', () => {
  describe('Booking Lifecycle Transitions', () => {
    it('validates standard active lifecycle progression', () => {
      const validStatuses: BookingStatus[] = [
        'searching',
        'pending',
        'accepted',
        'on_the_way',
        'in_progress',
        'completed',
        'cancelled',
        'no_workers_found'
      ];

      const activeStatuses: BookingStatus[] = ['accepted', 'on_the_way', 'in_progress'];
      const terminalStatuses: BookingStatus[] = ['completed', 'cancelled', 'no_workers_found'];

      activeStatuses.forEach(s => {
        expect(validStatuses).toContain(s);
        expect(terminalStatuses).not.toContain(s);
      });
    });

    it('calculates net worker earnings correctly after commission', () => {
      const grossJobPrice = 500;
      const commissionRate = 0.08;
      const commission = calculateCommission(grossJobPrice, commissionRate);
      const netEarnings = grossJobPrice - commission;

      expect(commission).toBe(40);
      expect(netEarnings).toBe(460);
      expect(netEarnings).toBe(Math.round(grossJobPrice * (1 - commissionRate)));
    });

    it('handles zero or negative booking amounts without crashing', () => {
      expect(calculateCommission(0)).toBe(0);
      expect(calculateCommission(-150)).toBe(0);
    });
  });

  describe('Geolocation & Distance Privacy Logic', () => {
    it('returns Infinity for missing or invalid coordinates', () => {
      expect(distanceKm(null, null, 13.9299, 75.5681)).toBe(Infinity);
      expect(distanceKm(13.9299, 75.5681, undefined, undefined)).toBe(Infinity);
      expect(distanceKm(NaN, 75.5681, 13.9299, 75.5681)).toBe(Infinity);
    });

    it('formats distance correctly for close and far ranges', () => {
      expect(formatDistance(0.45)).toBe('450 m away');
      expect(formatDistance(2.34)).toBe('2.3 km away');
      expect(formatDistance(Infinity)).toBe('Location unavailable');
      expect(formatDistance(-1)).toBe('Location unavailable');
    });

    it('safely discards invalid worker coordinates during provider sorting', () => {
      const providers = [
        { id: '1', full_name: 'Worker 1', lat: null, lng: null },
        { id: '2', full_name: 'Worker 2', lat: 13.9300, lng: 75.5682 },
      ];

      const sorted = sortProvidersByDistanceAndFeatured(providers, 13.9299, 75.5681);
      expect(sorted[0].full_name).toBe('Worker 2');
      expect(sorted[0].distanceKm).toBeLessThan(1);
      expect(sorted[1].distanceKm).toBe(Infinity);
    });
  });

  describe('WebRTC Channel Hashing Security', () => {
    it('generates deterministic hashed channel names with salt', () => {
      const userId = 'usr_test_12345';
      const salt = '_WEBRTC_SALT';
      const channelName = `call_${btoa(userId + salt).replace(/=/g, '')}`;

      expect(channelName).toContain('call_');
      expect(channelName).not.toBe(`user_${userId}`);
      expect(channelName).toBe(`call_${btoa('usr_test_12345_WEBRTC_SALT').replace(/=/g, '')}`);
    });
  });
});
