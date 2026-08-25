import { getClient } from '../supabase';

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
 * Priority 1: Supabase Secure Edge Function
 * Priority 2: Direct Metered REST API fallback (using configured env key)
 * Priority 3: Google Public STUN servers
 */
export async function getIceServers(): Promise<TurnCredential[]> {
  const defaultStun: TurnCredential[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' }
  ];

  // Use cache if valid
  if (cachedIceServers && Date.now() - lastFetchTime < CACHE_TTL_MS) {
    return cachedIceServers;
  }

  // 1. Try secure Supabase Edge Function
  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client.functions.invoke('get-turn-credentials');
      if (!error && Array.isArray(data) && data.length > 0) {
        cachedIceServers = data;
        lastFetchTime = Date.now();
        return data;
      }
    }
  } catch (err) {
    // Silent failover to direct Metered REST API
  }

  // 2. Direct Metered REST API fallback
  try {
    const domain = process.env.NEXT_PUBLIC_METERED_DOMAIN || 'neighborly-trust.metered.live';
    const apiKey = process.env.NEXT_PUBLIC_METERED_API_KEY || 'g9svnC4ovDhTm62lwrPy7meTdKudH5FHQ1suxEDh0BFl8O3f';

    if (domain && apiKey) {
      const res = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          cachedIceServers = data;
          lastFetchTime = Date.now();
          return data;
        }
      }
    }
  } catch (directErr) {
    console.warn('Metered direct TURN fetch failed, falling back to STUN:', directErr);
  }

  // 3. Fallback to STUN servers
  return defaultStun;
}
