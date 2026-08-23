import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sortProvidersByDistanceAndFeatured } from '../lib/commission';

describe('Owner Access & Control System', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OWNER_PHONES', '9999999999,8888888888');
    vi.resetModules();
  });

  it('recognizes designated owner phone numbers', async () => {
    const { OWNER_PHONE_NUMBERS } = await import('../lib/types');
    expect(OWNER_PHONE_NUMBERS).toContain('9999999999');
    expect(OWNER_PHONE_NUMBERS).toContain('8888888888');
  });

  it('filters out blacklisted providers from search results', () => {
    const providers: any[] = [
      {
        id: 'w1', name: 'Active Provider', category: 'Electrician', role: 'Pro',
        hourly_rate: 350, description: '', rating: 4.9, reviews_count: 20,
        is_online: true, lat: 13.93, lng: 75.57, featured: false, is_blacklisted: false
      },
      {
        id: 'w2', name: 'Banned Provider', category: 'Electrician', role: 'Pro',
        hourly_rate: 300, description: '', rating: 2.0, reviews_count: 5,
        is_online: true, lat: 13.93, lng: 75.57, featured: false, is_blacklisted: true
      }
    ];

    const sorted = sortProvidersByDistanceAndFeatured(providers, 13.9299, 75.5681);
    expect(sorted.length).toBe(1);
    expect(sorted[0].name).toBe('Active Provider');
  });

  it('boosts featured paid top-placement providers to the top of listings', () => {
    const providers: any[] = [
      {
        id: 'w1', name: 'Standard Nearby Provider', category: 'Plumber', role: 'Pro',
        hourly_rate: 400, description: '', rating: 4.8, reviews_count: 10,
        is_online: true, lat: 13.9300, lng: 75.5680, featured: false, is_blacklisted: false
      },
      {
        id: 'w2', name: 'Paid Top Placement Provider', category: 'Plumber', role: 'Pro',
        hourly_rate: 450, description: '', rating: 4.9, reviews_count: 50,
        is_online: true, lat: 13.9400, lng: 75.5800, featured: true, is_blacklisted: false
      }
    ];

    const sorted = sortProvidersByDistanceAndFeatured(providers, 13.9299, 75.5681);
    expect(sorted[0].name).toBe('Paid Top Placement Provider');
  });
});
