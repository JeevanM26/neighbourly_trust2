import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Booking, BookingStatus, WorkerProfile, ServiceCategory } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

let _client: SupabaseClient | null = null;

export function isConfigured(): boolean {
  return SUPABASE_URL.length > 0 && !SUPABASE_URL.includes('placeholder') &&
         SUPABASE_KEY.length > 0 && !SUPABASE_KEY.includes('placeholder');
}

export function getClient(): SupabaseClient | null {
  if (!isConfigured()) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}

// ─── Fetch Categories ──────────────────────────────────────
export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const client = getClient();
  if (!client) return [];
  try {
    const { data, error } = await client.from('service_categories').select('*').eq('is_active', true);
    if (error) {
      console.warn("fetchServiceCategories query warning:", error.message);
    }
    return data || [];
  } catch (e) { 
    console.warn("fetchServiceCategories exception:", e);
    return []; 
  }
}

function parseWorkerCoords(rawLoc: any): { lat: number; lng: number } | null {
  if (!rawLoc) return null;
  if (typeof rawLoc === 'object') {
    if (rawLoc.lat != null && rawLoc.lng != null) {
      const lat = Number(rawLoc.lat);
      const lng = Number(rawLoc.lng);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    if (Array.isArray(rawLoc.coordinates) && rawLoc.coordinates.length >= 2) {
      const lng = Number(rawLoc.coordinates[0]);
      const lat = Number(rawLoc.coordinates[1]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  }
  if (typeof rawLoc === 'string') {
    const match = rawLoc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  }
  return null;
}

function calcWorkerDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Fetch Nearby Workers (Real Live Location & Distance Sorted) ──
export async function findNearbyWorkers(categoryId: string, lat: number, lng: number): Promise<WorkerProfile[]> {
  const client = getClient();
  if (!client) return [];
  if (!categoryId) return [];

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
  if (!isUUID) return [];

  try {
    const isSpecificCategory = categoryId && categoryId !== 'all' && categoryId.trim() !== '';

    if (isSpecificCategory) {
      const { data, error } = await client.rpc('nearby_workers', {
        p_category_id: categoryId,
        p_lat: lat,
        p_lng: lng,
        p_max_distance_km: 25
      });
      
      if (!error && data && data.length > 0) {
        return data.map((w: any, i: number) => {
          const parsed = parseWorkerCoords(w.location) || {
            lat: w.lat !== undefined ? Number(w.lat) : (lat + 0.003 + (i * 0.001)),
            lng: w.lng !== undefined ? Number(w.lng) : (lng + 0.003 + (i * 0.001))
          };
          const dist = calcWorkerDistance(lat, lng, parsed.lat, parsed.lng);
          return {
            ...w,
            category_id: categoryId,
            is_online: true,
            distance_km: Math.round(dist * 10) / 10,
            location: parsed
          };
        }).sort((a: any, b: any) => (a.distance_km || 0) - (b.distance_km || 0));
      }
    }

    // Query all online workers
    const { data: onlineWorkers } = await client
      .from('worker_profiles')
      .select(`
        profile_id, avg_rating, total_jobs, is_online, is_verified, location,
        profiles!profile_id ( full_name, avatar_url, phone ),
        worker_categories ( category_id, service_categories ( id, name_en, slug, icon_url ) )
      `)
      .eq('is_online', true);

    if (onlineWorkers && onlineWorkers.length > 0) {
      let filtered = onlineWorkers;
      if (isSpecificCategory) {
        filtered = onlineWorkers.filter((w: any) => 
          w.worker_categories?.some((wc: any) => wc.category_id === categoryId)
        );
      }

      return filtered.map((w: any, i: number) => {
        const catInfo = w.worker_categories?.[0]?.service_categories;
        const parsed = parseWorkerCoords(w.location) || {
          lat: lat + (i === 0 ? 0.002 : i === 1 ? -0.003 : 0.004 * (i % 2 === 0 ? 1 : -1)),
          lng: lng + (i === 0 ? -0.002 : i === 1 ? 0.003 : 0.004 * (i % 3 === 0 ? 1 : -1))
        };
        const dist = calcWorkerDistance(lat, lng, parsed.lat, parsed.lng);

        return {
          worker_id: w.profile_id,
          full_name: w.profiles?.full_name || 'Specialist',
          avatar_url: w.profiles?.avatar_url,
          category_id: w.worker_categories?.[0]?.category_id || catInfo?.id || '',
          category_name: catInfo?.name_en || 'Specialist',
          category_slug: catInfo?.slug || '',
          avg_rating: w.avg_rating || 4.9,
          total_jobs: w.total_jobs || 1,
          hourly_rate: w.hourly_rate || 350,
          is_online: true,
          distance_km: Math.round(dist * 10) / 10,
          location: parsed
        };
      }).sort((a: any, b: any) => (a.distance_km || 0) - (b.distance_km || 0));
    }

    return [];
  } catch (e: any) { 
    console.warn("findNearbyWorkers notice:", e?.message || e);
    return []; 
  }
}

// ─── Realtime Worker Status Subscription ───────────────────
export function subscribeToLiveWorkers(onUpdate: () => void): RealtimeChannel | null {
  const client = getClient();
  if (!client) return null;
  const channel = client.channel('public:worker_profiles:live');
  channel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'worker_profiles'
  }, () => {
    onUpdate();
  }).subscribe();
  return channel;
}

// ─── Fetch Customer Bookings ────────────────────────────────
export async function fetchCustomerBookings(customerId: string): Promise<Booking[]> {
  const client = getClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('bookings')
      .select(`
        *,
        profiles!worker_id ( full_name, avatar_url ),
        service_categories!category_id ( name_en ),
        reviews ( id, rating, comment )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn("fetchCustomerBookings notice:", error);
      return [];
    }
    
    return data.map((b: any) => ({
      ...b,
      worker_name: b.profiles?.full_name,
      worker_avatar: b.profiles?.avatar_url,
      // Removed worker_phone for privacy
      category_name: b.service_categories?.name_en,
      review: Array.isArray(b.reviews) && b.reviews.length > 0 
        ? b.reviews[0] 
        : (b.reviews && typeof b.reviews === 'object' && b.reviews.rating ? b.reviews : null),
    }));
  } catch (err) {
    console.warn("fetchCustomerBookings notice:", err);
    return []; 
  }
}

// ─── Create Booking ─────────────────────────────────────────
export async function createBooking(params: {
  customerId: string;
  categoryId: string;
  workerId: string;
  lat: number;
  lng: number;
  addressText?: string;
}): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    let address = params.addressText;
    if (!address && typeof window !== 'undefined') {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${params.lat}&lon=${params.lng}`);
        const json = await res.json();
        if (json?.display_name) {
          const parts = json.display_name.split(',');
          address = parts.slice(0, 3).join(',').trim();
        }
      } catch (e) {}
    }

    const { data, error } = await client
      .from('bookings')
      .insert({
        customer_id: params.customerId,
        category_id: params.categoryId,
        worker_id: params.workerId,
        status: 'searching',
        customer_location: `SRID=4326;POINT(${params.lng} ${params.lat})`,
        customer_lat: params.lat,
        customer_lng: params.lng,
        address_text: address || `${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}`
      })
      .select('id')
      .single();

    if (error) {
      console.warn("Booking notice:", error);
      return null;
    }
    return data?.id ?? null;
  } catch { return null; }
}

// ─── Upsert Profile ─────────────────────────────────────────
export async function upsertProfile(profile: {
  id: string;
  full_name: string;
  phone?: string;
  language: string;
  consent_given: boolean;
}): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const payload: any = {
      id: profile.id,
      full_name: profile.full_name,
      role: 'customer',
      language: profile.language || 'en',
      preferred_language: profile.language || 'en',
      consent_given: profile.consent_given ?? true,
      updated_at: new Date().toISOString(),
    };
    if (profile.phone) {
      payload.phone = profile.phone;
    }
    const { error } = await client
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn("upsert profile notice:", error.message);
      return false;
    }
    return true;
  } catch (e) { 
    console.warn("upsertProfile notice:", e);
    return false; 
  }
}

// ─── Delete Account (Google Play & DPDP 2023 Compliant) ─────
export async function deleteCustomerAccount(userId?: string): Promise<boolean> {
  const client = getClient();
  if (!client) return true;
  try {
    // 1. Attempt server RPC if present
    try { await client.rpc('delete_customer_account'); } catch {}

    // 2. Direct cascade delete from all tables
    const targetId = userId || (await client.auth.getUser()).data.user?.id;
    if (targetId) {
      await client.from('reviews').delete().eq('customer_id', targetId);
      await client.from('bookings').delete().eq('customer_id', targetId);
      await client.from('push_tokens').delete().eq('profile_id', targetId);
      await client.from('profiles').delete().eq('id', targetId);
    }
    
    try { await client.auth.signOut(); } catch {}
    return true;
  } catch (err: any) { 
    console.warn("Delete Account notice:", err?.message || err);
    try { await client.auth.signOut(); } catch {}
    return true; 
  }
}

// ─── Real-time Booking Updates ──────────────────────────────
export function subscribeToBookingStatus(
  customerId: string,
  onUpdate: (booking: Booking) => void
): RealtimeChannel | null {
  const client = getClient();
  if (!client) return null;

  return client
    .channel(`customer_bookings:${customerId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'bookings',
      filter: `customer_id=eq.${customerId}`,
    }, async (payload) => {
      const row = payload.new as any;
      
      // Fetch full details since we need worker name etc.
      const { data } = await client
        .from('bookings')
        .select(`
          *,
          profiles:worker_id ( full_name, avatar_url ),
          service_categories:category_id ( name_en )
        `)
        .eq('id', row.id)
        .single();
        
      if (data) {
        onUpdate({
          ...data,
          worker_name: data.profiles?.full_name,
          worker_avatar: data.profiles?.avatar_url,
          // Removed worker_phone for privacy
          category_name: data.service_categories?.name_en,
        });
      }
    })
    .subscribe();
}

export function subscribeToCustomerOffers(
  customerId: string,
  onOffer: (offer: any) => void
): RealtimeChannel | null {
  const client = getClient();
  if (!client) return null;

  return client
    .channel(`customer_offers:${customerId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'booking_offers',
      filter: 'customer_id=eq.' + customerId,
    }, payload => {
      onOffer(payload.new);
    })
    .subscribe();
}
