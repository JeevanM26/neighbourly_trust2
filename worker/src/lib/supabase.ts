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
export async function fetchWorkerProfile(authUserId: string, phoneFallback?: string): Promise<WorkerProfile | null> {
  const client = getClient();
  if (!client) return null;
  try {
    // 1. Fetch categories directly from worker_categories (joined with service_categories)
    const { data: catData } = await client
      .from('worker_categories')
      .select('category_id, service_categories ( id, slug, name_en, icon_url )')
      .eq('worker_id', authUserId);

    let categories: ServiceCategory[] = (catData || [])
      .map((c: any) => c.service_categories)
      .filter(Boolean);

    // Fallback: If service_categories join wasn't expanded, query by IDs
    if (categories.length === 0 && catData && catData.length > 0) {
      const catIds = catData.map((c: any) => c.category_id).filter(Boolean);
      if (catIds.length > 0) {
        const { data: directCats } = await client.from('service_categories').select('*').in('id', catIds);
        if (directCats) categories = directCats;
      }
    }

    // 2. Fetch worker profile metadata
    const { data } = await client
      .from('worker_profiles')
      .select(`
        bio, years_experience, is_online, is_verified, service_radius_km, avg_rating, total_jobs,
        profiles!profile_id ( full_name, preferred_language, phone )
      `)
      .eq('profile_id', authUserId)
      .maybeSingle();

    if (data) {
      return {
        id: authUserId,
        full_name: (data as any).profiles?.full_name ?? '',
        phone: (data as any).profiles?.phone ?? '',
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
    }

    // 3. Fallback: Check if a master profile exists in public.profiles by ID
    const { data: prof } = await client.from('profiles').select('full_name, preferred_language, phone').eq('id', authUserId).maybeSingle();
    if (prof && prof.full_name && prof.full_name.trim() !== '' && prof.full_name !== 'Deleted User') {
      return {
        id: authUserId,
        full_name: prof.full_name,
        phone: prof.phone || '',
        language: prof.preferred_language || 'en',
        is_online: false,
        is_verified: false,
        rating: 5.0,
        total_jobs: 0,
        years_experience: 0,
        service_radius_km: 8,
        categories,
      };
    }

    // 4. Fallback by phone number if provided
    if (phoneFallback) {
      const clean = phoneFallback.replace(/\D/g, '');
      const { data: phoneProf } = await client
        .from('profiles')
        .select('id, full_name, preferred_language, phone')
        .or(`phone.eq.${clean},phone.eq.+91${clean}`)
        .maybeSingle();

      if (phoneProf && phoneProf.full_name && phoneProf.full_name.trim() !== '' && phoneProf.full_name !== 'Deleted User') {
        const { data: phoneCatData } = await client
          .from('worker_categories')
          .select('category_id, service_categories ( id, slug, name_en, icon_url )')
          .eq('worker_id', phoneProf.id);

        const phoneCats: ServiceCategory[] = (phoneCatData || [])
          .map((c: any) => c.service_categories)
          .filter(Boolean);

        return {
          id: phoneProf.id,
          full_name: phoneProf.full_name,
          phone: phoneProf.phone || clean,
          language: phoneProf.preferred_language || 'en',
          is_online: false,
          is_verified: false,
          rating: 5.0,
          total_jobs: 0,
          years_experience: 0,
          service_radius_km: 8,
          categories: phoneCats.length > 0 ? phoneCats : categories,
        };
      }
    }

    return null;
  } catch { return null; }
}

// ─── Create / onboard a new worker ────────────────────────
export async function createWorkerProfile(params: {
  id: string;
  name: string;
  categoryIds: string[];
  phone?: string;
}): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    // 1. Ensure profile exists
    const { data: existingProf } = await client.from('profiles').select('id').eq('id', params.id).maybeSingle();
    if (!existingProf) {
      await client.from('profiles').insert({ 
        id: params.id, 
        full_name: params.name, 
        phone: params.phone || null,
        role: 'worker' 
      });
    } else {
      await client.from('profiles').update({ 
        full_name: params.name, 
        role: 'worker',
        ...(params.phone ? { phone: params.phone } : {})
      }).eq('id', params.id);
    }

    // 2. Insert worker_profile
    await client.from('worker_profiles').upsert({
      profile_id: params.id,
      is_online: false,
      is_verified: true,
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
        is_verified: true,
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

// ─── Update worker service radius ──────────────────────────
export async function updateWorkerServiceRadius(workerId: string, radiusKm: number): Promise<boolean> {
  const client = getClient();
  if (!client || !workerId) return false;
  try {
    const { error } = await client
      .from('worker_profiles')
      .update({ service_radius_km: radiusKm })
      .eq('profile_id', workerId);
    if (error) {
      console.error('Update worker service radius error:', error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('Update worker service radius error:', err?.message || err);
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

function parseLocation(loc: any): { lat: number; lng: number } | undefined {
  if (!loc) return undefined;
  if (typeof loc === 'object') {
    if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return { lat: loc.lat, lng: loc.lng };
    }
    if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      return { lat: loc.latitude, lng: loc.longitude };
    }
    if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
      return { lat: Number(loc.coordinates[1]), lng: Number(loc.coordinates[0]) };
    }
  }
  if (typeof loc === 'string') {
    const trimmed = loc.trim();
    // 1. Check EWKB / WKB Hex string
    if (/^[0-9a-fA-F]{42,}$/.test(trimmed)) {
      try {
        const isLittleEndian = trimmed.substring(0, 2).toLowerCase() === '01';
        let offset = 2;
        const hasSrid = isLittleEndian ? (trimmed.substring(8, 10) === '20') : (trimmed.substring(2, 4) === '20');
        offset += 8;
        if (hasSrid) offset += 8;
        const xHex = trimmed.substring(offset, offset + 16);
        const yHex = trimmed.substring(offset + 16, offset + 32);
        if (xHex.length === 16 && yHex.length === 16) {
          const xBytes = new Uint8Array(8);
          const yBytes = new Uint8Array(8);
          for (let i = 0; i < 8; i++) {
            xBytes[i] = parseInt(xHex.substring(i * 2, i * 2 + 2), 16);
            yBytes[i] = parseInt(yHex.substring(i * 2, i * 2 + 2), 16);
          }
          const viewX = new DataView(xBytes.buffer, xBytes.byteOffset, xBytes.byteLength);
          const viewY = new DataView(yBytes.buffer, yBytes.byteOffset, yBytes.byteLength);
          const lng = viewX.getFloat64(0, isLittleEndian);
          const lat = viewY.getFloat64(0, isLittleEndian);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }
      } catch {}
    }

    // 2. Check EWKT: POINT(lng lat)
    const match = trimmed.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }
  return undefined;
}

function mapBookingRow(b: any): Booking {
  const loc = (b.customer_lat && b.customer_lng)
    ? { lat: Number(b.customer_lat), lng: Number(b.customer_lng) }
    : parseLocation(b.customer_location);

  return {
    ...b,
    customer_name: b.profiles?.full_name,
    customer_phone: b.profiles?.phone,
    category_name: b.service_categories?.name_en,
    customer_location: loc,
    address_text: b.address_text || (loc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : undefined),
  };
}

// ─── Accept / Decline Offer ─────────────────────────────
export async function respondToOffer(offerId: string, bookingId: string, status: 'accepted' | 'declined' | 'timed_out'): Promise<boolean> {
  const client = getClient();
  if (!client) return true;
  try {
    if (status === 'accepted') {
      // 1. Direct booking (no offer table row or direct offer ID)
      if (offerId?.startsWith('direct_') || !offerId) {
        const { error: bErr } = await client
          .from('bookings')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', bookingId);
        return !bErr;
      }

      // 2. Attempt atomic RPC
      try {
        const { data, error } = await client.rpc('accept_booking_offer', { 
          p_offer_id: offerId, 
          p_booking_id: bookingId 
        });
        if (!error && data === true) {
          return true;
        }
      } catch (rpcErr) {
        console.warn("RPC notice, falling back to direct update:", rpcErr);
      }

      // 3. Fallback: direct updates to booking_offers and bookings
      await client.from('booking_offers')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', offerId);

      const { error: directErr } = await client
        .from('bookings')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', bookingId);

      return !directErr;
    } else {
      // Decline or Timed out
      if (!offerId?.startsWith('direct_')) {
        await client.from('booking_offers')
          .update({ status, responded_at: new Date().toISOString() })
          .eq('id', offerId);
      }
      return true;
    }
  } catch (err) {
    console.warn("respondToOffer notice:", err);
    return false; 
  }
}

// ─── Update Booking Status (Lifecycle) ───────────────────
export async function updateBookingStatus(
  bookingId: string, 
  status: Booking['status'],
  finalPrice?: number
): Promise<boolean> {
  const client = getClient();
  if (!client) return true;
  try {
    const payload: any = { status };
    if (status === 'in_progress') payload.started_at = new Date().toISOString();
    if (status === 'completed') {
      payload.completed_at = new Date().toISOString();
      if (finalPrice !== undefined && finalPrice > 0) {
        payload.final_price = finalPrice;
      }
    }
    
    const { error } = await client.from('bookings').update(payload).eq('id', bookingId);
    return !error;
  } catch { return false; }
}

// ─── Account Deletion (Google Play & DPDP 2023 Compliant) ─────
export async function deleteWorkerAccount(workerId: string): Promise<boolean> {
  const client = getClient();
  if (!client) return true;
  try {
    // 1. Attempt server RPC
    try { await client.rpc('delete_worker_account'); } catch {}

    // 2. Direct cascade delete from all worker tables
    if (workerId) {
      await client.from('reviews').delete().eq('worker_id', workerId);
      await client.from('worker_categories').delete().eq('worker_id', workerId);
      await client.from('booking_offers').delete().eq('worker_id', workerId);
      await client.from('worker_profiles').delete().eq('profile_id', workerId);
      await client.from('push_tokens').delete().eq('profile_id', workerId);
      await client.from('profiles').delete().eq('id', workerId);
    }
    
    try { await client.auth.signOut(); } catch {}
    return true;
  } catch (err) {
    console.warn("Delete Worker Account notice:", err);
    try { await client.auth.signOut(); } catch {}
    return true;
  }
}

// ─── Fetch Pending Offers ─────────────────────────────────
export async function fetchPendingOffers(workerId: string): Promise<BookingOffer[]> {
  const client = getClient();
  if (!client) return [];
  try {
    const results: BookingOffer[] = [];
    const seenBookingIds = new Set<string>();

    // 1. Fetch from booking_offers
    const { data: offers } = await client
      .from('booking_offers')
      .select('id, booking_id, worker_id, status, offered_at')
      .eq('worker_id', workerId)
      .eq('status', 'offered');

    for (const off of offers || []) {
      const booking = await fetchBookingDetails(off.booking_id);
      if (booking && ['searching', 'pending'].includes(booking.status)) {
        seenBookingIds.add(off.booking_id);
        results.push({
          id: off.id,
          booking_id: off.booking_id,
          worker_id: off.worker_id,
          status: off.status,
          offered_at: off.offered_at,
          booking,
        });
      }
    }

    // 2. ALSO Fetch direct bookings assigned to this worker that are in searching/pending status
    const { data: directBookings } = await client
      .from('bookings')
      .select('id, created_at')
      .eq('worker_id', workerId)
      .in('status', ['searching', 'pending']);

    for (const db of directBookings || []) {
      if (!seenBookingIds.has(db.id)) {
        const booking = await fetchBookingDetails(db.id);
        if (booking && ['searching', 'pending'].includes(booking.status)) {
          results.push({
            id: `direct_${db.id}`,
            booking_id: db.id,
            worker_id: workerId,
            status: 'offered',
            offered_at: db.created_at || new Date().toISOString(),
            booking,
          });
        }
      }
    }

    return results;
  } catch (e) {
    console.warn("fetchPendingOffers notice:", e);
    return [];
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
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'bookings',
      filter: `worker_id=eq.${workerId}`,
    }, async (payload) => {
      const b = payload.new as any;
      if (b.status === 'searching' || b.status === 'pending') {
        const booking = await fetchBookingDetails(b.id);
        if (booking) {
          onNewOffer({
            id: `direct_${b.id}`,
            booking_id: b.id,
            worker_id: workerId,
            status: 'offered',
            offered_at: b.created_at || new Date().toISOString(),
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

