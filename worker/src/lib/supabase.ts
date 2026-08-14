import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { WorkerProfile, Booking, BookingOffer, ServiceCategory, COMMISSION_RATE } from './types';

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
    const { data } = await client.from('service_categories').select('*').eq('is_active', true);
    return data || [];
  } catch { return []; }
}

// ─── Fetch worker profile from Supabase ───────────────────
export async function fetchWorkerProfile(authUserId: string): Promise<WorkerProfile | null> {
  const client = getClient();
  if (!client) return null;
  try {
    // 1. Check if worker profile exists
    const { data, error } = await client
      .from('worker_profiles')
      .select(`
        bio, years_experience, is_online, is_verified, service_radius_km, avg_rating, total_jobs,
        profiles!profile_id ( full_name, preferred_language ),
        worker_categories ( category_id )
      `)
      .eq('profile_id', authUserId)
      .single();

    if (error || !data) return null;

    // Fetch actual category details
    const catIds = ((data as any).worker_categories || []).map((c: any) => c.category_id);
    let categories: ServiceCategory[] = [];
    if (catIds.length > 0) {
      const { data: cats } = await client.from('service_categories').select('*').in('id', catIds);
      if (cats) categories = cats;
    }

    return {
      id: authUserId,
      full_name: (data as any).profiles?.full_name ?? '',
      language: (data as any).profiles?.preferred_language ?? 'en',
      is_online: !!data.is_online,
      is_verified: !!data.is_verified,
      bio: data.bio,
      years_experience: data.years_experience || 0,
      service_radius_km: data.service_radius_km || 8,
      rating: Number(data.avg_rating) || 5.0,
      total_jobs: data.total_jobs || 0,
      categories,
    };
  } catch { return null; }
}

// ─── Create / onboard a new worker ────────────────────────
export async function createWorkerProfile(params: {
  id: string;
  name: string;
  categoryIds: string[];
}): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    // 1. Ensure profile exists
    const { data: existingProf } = await client.from('profiles').select('id').eq('id', params.id).maybeSingle();
    if (!existingProf) {
      await client.from('profiles').insert({ id: params.id, full_name: params.name, role: 'worker' });
    } else {
      await client.from('profiles').update({ full_name: params.name, role: 'worker' }).eq('id', params.id);
    }

    // 2. Insert worker_profile
    await client.from('worker_profiles').upsert({
      profile_id: params.id,
      is_online: false,
      avg_rating: 5.0,
      total_jobs: 0,
    });

    // 3. Insert categories
    for (const catId of params.categoryIds) {
      await client.from('worker_categories').upsert({
        worker_id: params.id,
        category_id: catId,
      });
    }
    return true;
  } catch { return false; }
}

// ─── Update worker profile (name, categories) ──────────────
export async function updateWorkerProfileData(workerId: string, name: string, categoryIds: string[]): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    // Update name or insert if missing
    const { data: existingProf } = await client.from('profiles').select('id').eq('id', workerId).maybeSingle();
    if (!existingProf) {
      const { error: profileErr } = await client.from('profiles').insert({ id: workerId, full_name: name, role: 'worker' });
      if (profileErr) console.error("Save profile insert error:", profileErr.message);
    } else {
      const { error: profileErr } = await client.from('profiles').update({ full_name: name }).eq('id', workerId);
      if (profileErr) console.error("Save profile update error:", profileErr.message);
    }
    
    // Ensure worker_profiles row exists
    const { data: existingWorker } = await client.from('worker_profiles').select('profile_id').eq('profile_id', workerId).maybeSingle();
    if (!existingWorker) {
      const { error: wpErr } = await client.from('worker_profiles').upsert({
        profile_id: workerId,
        is_online: false,
        avg_rating: 5.0,
        total_jobs: 0,
      });
      if (wpErr) console.error("Save worker_profile error:", wpErr.message, wpErr.details, wpErr.hint);
    }

    // Delete old categories and insert new ones
    const { error: delErr } = await client.from('worker_categories').delete().eq('worker_id', workerId);
    if (delErr) {
      console.error("Save categories delete error:", delErr.message, delErr.details, delErr.hint);
    }
    
    if (categoryIds.length > 0) {
      const inserts = categoryIds.map(id => ({ worker_id: workerId, category_id: id }));
      const { error: insErr } = await client.from('worker_categories').insert(inserts);
      if (insErr) {
        console.error("Save categories insert error:", insErr.message, insErr.details, insErr.hint);
        return false;
      }
    }
    
    return true;
  } catch (err: any) { 
    console.error("Save categories error:", err?.message || err);
    return false; 
  }
}

// ─── Toggle online status ─────────────────────────────────
export async function setWorkerOnline(workerId: string, online: boolean, lat?: number | null, lng?: number | null): Promise<void> {
  const client = getClient();
  if (!client) return;
  const updateData: any = { is_online: online };
  
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
    // Standard EWKT payload for PostgREST PostGIS
    updateData.location = `SRID=4326;POINT(${lng} ${lat})`;
    updateData.location_updated_at = new Date().toISOString();
  }
  
  await client.from('worker_profiles').update(updateData).eq('profile_id', workerId);
}

// ─── Fetch Active Bookings ────────────────────────────────
export async function fetchActiveBookings(workerId: string): Promise<Booking[]> {
  const client = getClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('bookings')
      .select(`
        *,
        profiles!customer_id ( full_name, phone ),
        service_categories!category_id ( name_en )
      `)
      .eq('worker_id', workerId)
      .in('status', ['accepted', 'on_the_way', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(mapBookingRow);
  } catch { return []; }
}

// ─── Fetch Booking History ────────────────────────────────
export async function fetchBookingHistory(workerId: string): Promise<Booking[]> {
  const client = getClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('bookings')
      .select(`
        *,
        profiles!customer_id ( full_name, phone ),
        service_categories!category_id ( name_en )
      `)
      .eq('worker_id', workerId)
      .in('status', ['completed', 'cancelled'])
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(mapBookingRow);
  } catch { return []; }
}

// ─── Fetch a single booking ───────────────────────────────
export async function fetchBookingDetails(bookingId: string): Promise<Booking | null> {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.from('bookings')
    .select('*, profiles!customer_id ( full_name, phone ), service_categories!category_id ( name_en )')
    .eq('id', bookingId).single();
  return data ? mapBookingRow(data) : null;
}

function mapBookingRow(b: any): Booking {
  return {
    ...b,
    customer_name: b.profiles?.full_name,
    customer_phone: b.profiles?.phone,
    category_name: b.service_categories?.name_en,
    customer_location: b.customer_lat && b.customer_lng ? { lat: b.customer_lat, lng: b.customer_lng } : undefined,
  };
}

// ─── Accept / Decline Offer ─────────────────────────────
export async function respondToOffer(offerId: string, bookingId: string, status: 'accepted' | 'declined' | 'timed_out'): Promise<boolean> {
  const client = getClient();
  if (!client) return true;
  try {
    if (status === 'accepted') {
      // Use the atomic RPC
      const { data, error } = await client.rpc('accept_booking_offer', { 
        p_offer_id: offerId, 
        p_booking_id: bookingId 
      });
      if (error) {
        console.error("Accept offer RPC error:", error);
        return false;
      }
      return data === true; // Returns true if successfully claimed
    } else {
      // Decline or Timed out
      const { error: offerErr } = await client.from('booking_offers')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', offerId);
      return !offerErr;
    }
  } catch { return false; }
}

// ─── Update Booking Status (Lifecycle) ───────────────────
export async function updateBookingStatus(bookingId: string, status: Booking['status']): Promise<boolean> {
  const client = getClient();
  if (!client) return true;
  try {
    const payload: any = { status };
    if (status === 'in_progress') payload.started_at = new Date().toISOString();
    if (status === 'completed') payload.completed_at = new Date().toISOString();
    
    const { error } = await client.from('bookings').update(payload).eq('id', bookingId);
    return !error;
  } catch { return false; }
}

// ─── Account Deletion ─────────────────────────────────────
export async function deleteWorkerAccount(workerId: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    // Call the RPC that securely cleans up user data
    const { error } = await client.rpc('delete_worker_account');
    if (error) throw error;
    await client.auth.signOut();
    return true;
  } catch (err) {
    console.error("Delete Account RPC Error:", err);
    return false;
  }
}

// ─── Real-time Offers Subscription ────────────────────────
export function subscribeToBookingOffers(
  workerId: string,
  onNewOffer: (offer: BookingOffer) => void
): RealtimeChannel | null {
  const client = getClient();
  if (!client) return null;

  return client
    .channel(`booking_offers:${workerId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'booking_offers',
      filter: `worker_id=eq.${workerId}`,
    }, async (payload) => {
      const offer = payload.new as any;
      if (offer.status === 'offered') {
        // Fetch booking details
        const booking = await fetchBookingDetails(offer.booking_id);
        if (booking) {
          onNewOffer({
            id: offer.id,
            booking_id: offer.booking_id,
            worker_id: offer.worker_id,
            status: offer.status,
            offered_at: offer.offered_at,
            booking,
          });
        }
      }
    })
    .subscribe();
}

// ─── Fetch Worker Customer Reviews ──────────────────────────
export async function fetchWorkerReviews(workerId: string) {
  const client = getClient();
  if (!client) return [];
  try {
    const { data } = await client
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        profiles!customer_id ( full_name )
      `)
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false })
      .limit(10);
    return (data || []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      customer_name: r.profiles?.full_name || 'Verified Customer'
    }));
  } catch {
    return [];
  }
}

