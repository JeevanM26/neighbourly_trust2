// ============================================================
// NEIGHBORLY TRUST — Domain Types (Customer App)
// ============================================================

export type UserRole = 'customer' | 'owner';

export type LanguageCode =
  | 'en' | 'hi' | 'bn' | 'te' | 'mr'
  | 'ta' | 'gu' | 'kn' | 'ml' | 'pa';

export type BookingStatus = 'searching' | 'pending' | 'accepted' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled' | 'no_workers_found';

export interface ServiceCategory {
  id: string;
  name_en: string;
  slug: string;
  icon_url?: string;
  is_active: boolean;
  synonyms?: string[];
}

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

// ─── User Profile ─────────────────────────────────────────
export interface UserProfile {
  id: string;
  full_name: string;
  phone: string; // From auth.users primarily
  role: UserRole;
  language: LanguageCode;
  consent_given: boolean;
  avatar_url?: string;
}

// ─── Worker Profile (Nearby Result) ───────────────────────
export interface WorkerProfile {
  worker_id: string;
  full_name: string;
  avatar_url?: string;
  avg_rating: number;
  total_jobs: number;
  years_experience: number;
  distance_km: number;
  
  // From old schema / dummy data
  hourly_rate?: number;
  is_online?: boolean;
  description?: string;
  featured?: boolean;
  
  // Computed on client
  tags?: string[];
  location?: {
    lat: number;
    lng: number;
  };
}


// ─── Booking ──────────────────────────────────────────────
export interface Booking {
  id: string;
  customer_id: string;
  worker_id?: string;
  category_id: string;
  status: BookingStatus;
  
  customer_lat?: number;
  customer_lng?: number;
  
  // Joins
  worker_name?: string;
  worker_avatar?: string;
  worker_phone?: string;
  category_name?: string;

  total_amount?: number;
  commission_amount?: number;
  address_notes?: string;
  created_at: string;
}

// ─── App Settings ─────────────────────────────────────────
export interface AppSettings {
  language: LanguageCode;
  sounds: boolean;
  voice: boolean;
}

// ─── Owner Config ─────────────────────────────────────────
export const PRIMARY_SUPER_OWNER = '7975182162';
export const OWNER_PHONES: string[] = ['7975182162', '8867269712'];
export const OWNER_PHONE_NUMBERS = OWNER_PHONES;
export const DEFAULT_OWNER_PHONE_NUMBERS = OWNER_PHONES;

// ─── Toast ────────────────────────────────────────────────
export interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Default Location (Shivamogga, Karnataka) ─────────────
export const DEFAULT_LOCATION = { lat: 13.9299, lng: 75.5681 };
