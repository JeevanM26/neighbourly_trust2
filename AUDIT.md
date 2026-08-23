# Neighborly Trust — Technical Audit Report

This document outlines the findings of a comprehensive technical and functional audit of the local Neighborly Trust workspace.

## 1. Stack & Architecture
- **Framework**: Next.js 16.2.12 with React 19.
- **Project Structure**: This is **NOT** a unified app with role-based routing. It is split into two entirely separate Next.js applications in the same repository:
  - `src/` (Main App): Serves the Customer and Owner interfaces.
  - `worker/` (Worker App): Serves the Provider/Worker interface.
- **State Management**: Uses React Context (`AppContext.tsx` and `WorkerContext.tsx`).
- **Styling**: Tailwind CSS combined with extensive inline styles.

## 2. Supabase Schema (`schema.sql`)
- **Present Tables**: `profiles`, `provider_profiles`, `bookings`, `ratings`, `payouts`.
- **Missing Table [CRITICAL]**: The `provider_skills` table is queried and upserted heavily in both the main and worker apps (e.g., `updateWorkerSkills`), but it is completely missing from `schema.sql`.
- **RLS Policies**: Implemented on all defined tables.
- **Realtime Config [CRITICAL]**: The client apps rely on Supabase Realtime Postgres Changes (e.g., `subscribeToBookings` filtering on `bookings`), but there is no `supabase_realtime` publication defined in `schema.sql`. Subscriptions will silently fail unless manually enabled in the Supabase dashboard.
- **Storage/Edge Functions**: None defined in the local repository.
- **Auth Configuration**: No local `config.toml` dictates a bypass OTP; this relies purely on cloud configuration.

## 3. Auth Flow
- **Mechanism**: Supabase native SMS OTP (`signInWithOtp`).
- **Role Assignment**: Owner roles are assigned statically via hardcoded phone numbers (`7975182162`, `8867269712`) in `src/lib/types.ts`, rather than via a database-driven RBAC system.
- **Telegram Fallback**: There is a Telegram OTP fallback engine (`src/lib/telegramOtp.ts`), seemingly intended for Owner logins.

## 4. Screen Inventory (Orphaned Code)
- **`src/components/screens/WorkerScreen.tsx`**: This file is completely **orphaned**. It is not imported in the main app router. The actual worker application was rebuilt entirely inside the separate `worker/` folder.

## 5. Worker Flow (Location & Online Status)
- **Location Tracking**: Uses standard HTML5 Geolocation (`navigator.geolocation.getCurrentPosition`).
- **Database Interaction**: Toggling "Go Online" actively writes the worker's current `lat`/`lng` coordinates and `is_online: true` directly to the `provider_profiles` table in Supabase.

## 6. Customer Flow (Voice Search)
- **Implementation**: Strictly client-side using the native `window.SpeechRecognition` (Web Speech API). No server-side STT or LLM is used.
- **Permission Handling**: Checks the `Permissions API` and triggers a brief `getUserMedia` stream to prompt for microphone access cleanly on Chrome.
- **Intent Engine**: Maps transcripts to categories via a hardcoded dictionary (`src/lib/intentEngine.ts`).

## 7. Calling & WebRTC (Connection Failures)
- **Signaling**: Uses Supabase Realtime broadcast channels (`user_${userId}`).
- **ICE Servers [CRITICAL]**: The `useWebRTC.ts` files (in both apps) only configure Google STUN servers (`stun.l.google.com:19302`).
- **Missing TURN**: There is **NO TURN server** configured. This guarantees that calls will fail to connect (stuck in "ringing" or "connecting") when users are on restrictive cellular networks (Jio/Airtel) or symmetric NATs, which is highly likely for mobile users.

## 8. Security Scan
- **Hardcoded Secrets [WARNING]**: A Telegram Bot Token is hardcoded in `src/lib/telegramOtp.ts`: `FALLBACK_BOT_TOKEN = '8830072583:AAEYhpGNTgD9AMR5hd5RC0eX3QlBi3is73c'`.
- **Privileged Keys**: No Supabase `service_role` keys were found in the local `.env` files (only `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## 9. Phone Number Privacy
- **Masking Logic**: Exists via `formatMaskedPhone()` (e.g., `+91 98*** **210`).
- **Leak 1 (Customer App) [CRITICAL]**: In `src/components/CallModal.tsx`, the raw `recipientPhone` is passed directly into a fallback dialer link: `href={"tel:${recipientPhone}"}`. A tech-savvy user can easily inspect the DOM and extract the worker's real phone number.
- **Leak 2 (Worker App)**: The worker app fetches the customer's raw phone number from the `bookings` join (`profiles!customer_id(phone)`). While it uses it for the WebRTC call initiation, the raw string resides in client memory.

## 10. UI Polish
- **General**: The UI mixes Tailwind CSS with heavy inline styles.
- **Empty/Skeleton States**: Some async operations lack skeleton loaders (e.g., initial provider fetches), though a loading overlay is present for OTP flows.
