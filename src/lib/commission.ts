

const ENV_COMMISSION_RATE = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_COMMISSION_PERCENTAGE
  ? parseFloat(process.env.NEXT_PUBLIC_COMMISSION_PERCENTAGE) / 100
  : 0.08;

/**
 * Calculates the platform commission for a given booking total amount.
 * Reads rate from NEXT_PUBLIC_COMMISSION_PERCENTAGE env var (default 8%).
 */
export function calculateCommission(totalAmount: number, rate: number = ENV_COMMISSION_RATE): number {
  if (totalAmount <= 0) return 0;
  return Math.round(totalAmount * rate * 100) / 100;
}

/**
 * Formats a number to INR currency string (e.g., ₹850).
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Calculates haversine distance in kilometers between two lat/lng pairs.
 * Returns Infinity if coordinates are missing or invalid.
 */
export function distanceKm(lat1?: number | null, lng1?: number | null, lat2?: number | null, lng2?: number | null): number {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return Infinity;

  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Formats distance into m or km string.
 */
export function formatDistance(km: number): string {
  if (!isFinite(km) || km < 0) return 'Location unavailable';
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

/**
 * Sorts providers:
 * 1. Featured providers prioritized when distance is comparable
 * 2. Nearest distance first
 */
export function sortProvidersByDistanceAndFeatured(
  providers: any[],
  userLat: number,
  userLng: number
): any[] {
  if (!Array.isArray(providers)) return [];
  return providers
    .filter((w) => w && w.is_blacklisted !== true)
    .map((w) => {
      const km = distanceKm(userLat, userLng, w.lat, w.lng);
      return {
        ...w,
        distanceKm: km,
        distanceLabel: formatDistance(km),
      };
    })
    .sort((a, b) => {
      // 1. Featured / Paid Top-Placement providers prioritized first
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      // 2. Otherwise sort by distance ascending
      const distA = isFinite(a.distanceKm) ? a.distanceKm : Infinity;
      const distB = isFinite(b.distanceKm) ? b.distanceKm : Infinity;
      return distA - distB;
    });
}
