export interface TurnCredential {
  urls: string | string[];
  username?: string;
  credential?: string;
}

let cachedIceServers: TurnCredential[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches dynamic TURN credentials from Metered.ca.
 * Falls back to Google STUN if fetch fails or config is missing.
 */
export async function getIceServers(): Promise<TurnCredential[]> {
  const defaultStun = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  const domain = process.env.NEXT_PUBLIC_METERED_DOMAIN;
  // NOTE: In Next.js client side, we must expose with NEXT_PUBLIC prefix.
  // The backend might not expose it, so we'll check both.
  const apiKey = process.env.NEXT_PUBLIC_METERED_API_KEY || process.env.METERED_API_KEY;

  if (!domain || !apiKey) {
    console.warn('Metered TURN credentials not configured in environment. Using STUN only.');
    return defaultStun;
  }

  // Use cache if valid
  if (cachedIceServers && Date.now() - lastFetchTime < CACHE_TTL_MS) {
    return cachedIceServers;
  }

  try {
    const res = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`);
    if (!res.ok) throw new Error(`Metered API error: ${res.status}`);
    
    const data = await res.json();
    
    // Metered returns an array of ICE servers (including their own STUN and TURN)
    if (Array.isArray(data) && data.length > 0) {
      cachedIceServers = data;
      lastFetchTime = Date.now();
      return data;
    }
    
    throw new Error('Invalid format from Metered API');
  } catch (error) {
    console.error('Failed to fetch TURN credentials:', error);
    return defaultStun;
  }
}
