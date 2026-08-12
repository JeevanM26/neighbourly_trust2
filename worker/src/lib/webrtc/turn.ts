import { supabase } from '../supabase';

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

  // Use cache if valid
  if (cachedIceServers && Date.now() - lastFetchTime < CACHE_TTL_MS) {
    return cachedIceServers;
  }

  try {
    const { data, error } = await supabase.functions.invoke('get-turn-credentials');
    
    if (error) throw error;
    
    // Metered returns an array of ICE servers (including their own STUN and TURN)
    if (Array.isArray(data) && data.length > 0) {
      cachedIceServers = data;
      lastFetchTime = Date.now();
      return data;
    }
    
    throw new Error('Invalid format from TURN Edge Function');
  } catch (error) {
    console.warn('Failed to fetch TURN credentials via Edge Function (falling back to STUN):', error);
    return defaultStun;
  }
}
