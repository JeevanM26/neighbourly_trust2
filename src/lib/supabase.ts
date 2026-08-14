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
      console.error("fetchServiceCategories query error:", error.message, error.details, error.hint);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-error', { detail: error.message || 'Database error occurred' }));
    }
    return data || [];
  } catch (e) { 
    console.error(e);
    return []; 
  }
}

// ─── Fetch Nearby Workers (RPC) ────────────────────────────
export async function findNearbyWorkers(categoryId: string, lat: number, lng: number): Promise<WorkerProfile[]> {
  const client = getClient();
  if (!client) return [];
  if (!categoryId) return [];

  try {
    const { data, error } = await client.rpc('nearby_workers', {
      p_category_id: categoryId,
      p_lat: lat,
      p_lng: lng,
      p_max_distance_km: 10
    });
    
    if (error || !data) {
      console.error("findNearbyWorkers error details:", error?.message, error?.details, error?.hint);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-error', { detail: error?.message || 'Database error occurred' }));
      return [];
    }
    
    return data.map((w: any, i: number) => ({
      ...w,
      category_id: categoryId,
      is_online: true, // The RPC only returns online workers but omits the field
      location: (w.lat !== undefined && w.lng !== undefined) 
        ? { lat: w.lat, lng: w.lng }
        // Fallback for older DB RPC version: place them slightly offset from user
        : { lat: lat + 0.005 + (i * 0.001), lng: lng + 0.005 + (i * 0.001) }
    }));
  } catch (e: any) { 
    console.error("findNearbyWorkers exception:", e?.message || e);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-error', { detail: e?.message || 'Error finding nearby workers' }));
    return []; 
  }
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
      console.error("fetchCustomerBookings error:", error);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-error', { detail: typeof error === 'string' ? error : error?.message || 'Database error occurred' }));
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
    console.error("fetchCustomerBookings exception:", err);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-error', { detail: typeof err === 'string' ? err : (err as any)?.message || 'Database error occurred' }));
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
}): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('bookings')
      .insert({
        customer_id: params.customerId,
        category_id: params.categoryId,
        worker_id: params.workerId,
        status: 'searching',
        customer_location: `SRID=4326;POINT(${params.lng} ${params.lat})`,
        customer_lat: params.lat,
        customer_lng: params.lng
      })
      .select('id')
      .single();

    if (error) {
      console.error("Booking error:", error);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-error', { detail: typeof error === 'string' ? error : error?.message || 'Database error occurred' }));
      return null;
    }
    return data?.id ?? null;
  } catch { return null; }
}

// ─── Upsert Profile ─────────────────────────────────────────
export async function upsertProfile(profile: {
  id: string;
  full_name: string;
  language: string;
  consent_given: boolean;
}): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from('profiles')
      .upsert({ 
        id: profile.id,
        full_name: profile.full_name,
        role: 'customer',
        preferred_language: profile.language,
        // Ensure avatar_url is explicitly handled if present, else undefined is fine
      });
    if (error) {
      console.error("upsert profile error details:", error.message, error.details, error.hint);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-error', { detail: error.message || 'Database error occurred' }));
    }
    return !error;
  } catch (e) { 
    console.error(e);
    return false; 
  }
}

// ─── Delete Account ─────────────────────────────────────────
export async function deleteCustomerAccount(): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    // Calls a dedicated RPC for customers to clean up their bookings and profile
    const { error } = await client.rpc('delete_customer_account');
    if (error) throw error;
    await client.auth.signOut();
    return true;
  } catch (err: any) { 
    console.error("Delete Account RPC Error details:", err?.message || err);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-error', { detail: err?.message || 'Database error occurred' }));
    return false; 
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
