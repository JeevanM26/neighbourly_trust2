// ============================================================
// NEIGHBORLY TRUST — Worker App Domain Types
// ============================================================

export type LanguageCode = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'gu' | 'kn' | 'ml' | 'pa';

// Map to public.service_categories
export interface ServiceCategory {
  id: string;
  slug: string;
  name_en: string;
  icon_url?: string;
}

export type BookingStatus = 'searching' | 'pending' | 'accepted' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled' | 'no_workers_found';
export type OfferStatus = 'offered' | 'accepted' | 'declined' | 'timed_out' | 'cancelled';

// ─── Worker Profile ────────────────────────────────────────
export interface WorkerProfile {
  id: string; // references profiles.id
  full_name: string; // from profiles
  phone?: string; // from local state/auth
  language: LanguageCode; // preferred_language from profiles
  avatar_url?: string;
  
  // From worker_profiles
  bio?: string;
  years_experience: number;
  is_online: boolean;
  is_verified: boolean;
  service_radius_km: number;
  rating: number; // avg_rating
  total_jobs: number;
  
  // From worker_categories join
  categories: ServiceCategory[];
}

// ─── Booking (matches target schema) ───────────────────────
export interface Booking {
  id: string;
  customer_id: string;
  customer_name?: string; // Joined from profiles
  customer_phone?: string; // Joined for WebRTC fallback
  worker_id?: string;
  category_id: string;
  category_name?: string; // Joined from service_categories
  status: BookingStatus;
  description?: string;
  voice_transcript?: string;
  detected_language?: string;
  address_text?: string;
  price_estimate?: number;
  final_price?: number;
  created_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_reason?: string;
  customer_location?: { lat: number; lng: number }; // parsed from geography
}

// ─── Booking Offer (incoming jobs) ────────────────────────
export interface BookingOffer {
  id: string;
  booking_id: string;
  worker_id: string;
  status: OfferStatus;
  offered_at: string;
  responded_at?: string;
  booking?: Booking; // Populated from join
}

// ─── Earnings Summary ─────────────────────────────────────
export interface EarningsSummary {
  gross: number;
  commission: number;
  net: number;
  jobs_count: number;
  period: 'today' | 'week' | 'month';
  by_category: { category: string; amount: number; count: number }[];
}

// ─── App Settings ─────────────────────────────────────────
export interface WorkerSettings {
  language: LanguageCode;
  sounds: boolean;
  notifications: boolean;
}

// ─── Toast ────────────────────────────────────────────────
export interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Owner Config ─────────────────────────────────────────
export const PRIMARY_SUPER_OWNER = process.env.NEXT_PUBLIC_PRIMARY_OWNER_PHONE || '';
export const OWNER_PHONES: string[] = process.env.NEXT_PUBLIC_OWNER_PHONES ? process.env.NEXT_PUBLIC_OWNER_PHONES.split(',') : [];
export const COMMISSION_RATE = process.env.NEXT_PUBLIC_COMMISSION_PERCENTAGE 
  ? parseFloat(process.env.NEXT_PUBLIC_COMMISSION_PERCENTAGE) / 100 
  : 0.08;

// ─── Default Location ─────────────────────────────────────
export const DEFAULT_LOCATION = { lat: 13.9299, lng: 75.5681 };
