import { describe, it, expect } from 'vitest';
import { calculateCommission, distanceKm, sortProvidersByDistanceAndFeatured } from '../lib/commission';


describe('Monetization & Commission Engine', () => {
  it('calculates 8% platform fee accurately', () => {
    expect(calculateCommission(1000)).toBe(80.00);
    expect(calculateCommission(850)).toBe(68.00);
    expect(calculateCommission(350)).toBe(28.00);
    expect(calculateCommission(0)).toBe(0);
  });

  it('calculates haversine distance correctly', () => {
    // Shivamogga to nearby location (~1 km)
    const dist = distanceKm(13.9299, 75.5681, 13.9381, 75.5745);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(2.0);
  });

  it('prioritizes featured providers at similar distance', () => {
    const providers: any[] = [
      {
        id: '1', name: 'Regular Provider', category: 'Electrician', role: 'Pro',
        hourly_rate: 300, description: '', rating: 4.8, reviews_count: 10,
        is_online: true, lat: 13.9300, lng: 75.5680, featured: false
      },
      {
        id: '2', name: 'Featured Provider', category: 'Electrician', role: 'Pro',
        hourly_rate: 350, description: '', rating: 4.9, reviews_count: 50,
        is_online: true, lat: 13.9310, lng: 75.5690, featured: true
      }
    ];

    const sorted = sortProvidersByDistanceAndFeatured(providers, 13.9299, 75.5681);
    expect(sorted[0].name).toBe('Featured Provider');
  });
});
