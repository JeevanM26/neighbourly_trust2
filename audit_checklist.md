# Audit Checklist — Neighborly Trust (Complete File Index)

> Every file must be checked `[x]` before the audit is complete.

## Root Configuration Files
- [x] `.env.example`
- [x] `.env.local.example`
- [x] `.gitignore`
- [x] `AGENTS.md`
- [x] `CLAUDE.md`
- [x] `README.md`
- [x] `capacitor.config.ts`
- [x] `eslint.config.mjs`
- [x] `next.config.ts`
- [x] `package.json`
- [x] `postcss.config.mjs`
- [x] `tsconfig.json`
- [ ] `next-env.d.ts`
- [x] `public/manifest.json`
- [x] `public/.well-known/assetlinks.json`

## Root Scripts (Debug/Diagnostics/SQL)
- [ ] `check_db.js`
- [ ] `check_db2.js`
- [ ] `check_realtime.mjs`
- [ ] `db_query.mjs`
- [ ] `debug.js`
- [ ] `debug_rpc.sql`
- [ ] `diagnostics.mjs`
- [ ] `diagnostics_auth.mjs`
- [ ] `diagnostics_customer.mjs`
- [ ] `fix_categories.sql`
- [ ] `fix_dispatch.sql`
- [ ] `fix_schemas.py`
- [ ] `fix_schemas2.py`
- [ ] `fix_schemas3.py`
- [ ] `insert_test.mjs`
- [ ] `query_bookings.mjs`
- [ ] `query_latest_bookings.mjs`
- [ ] `query_offers.mjs`
- [ ] `query_test.mjs`
- [ ] `query_worker_cats.mjs`
- [ ] `query_workers.mjs`
- [ ] `recover.py`
- [ ] `recover2.py`
- [ ] `test_broadcast.mjs`
- [ ] `test_broadcast2.mjs`
- [ ] `test_exec.mjs`
- [ ] `test_insert.mjs`
- [ ] `test_nearby.mjs`
- [ ] `test_webrtc.mjs`

## GitHub CI/CD
- [ ] `.github/workflows/db-backup.yml`
- [ ] `.github/workflows/deploy-gh-pages.yml`

## Customer App — `/src/app`
- [x] `src/app/globals.css`
- [x] `src/app/layout.tsx`
- [x] `src/app/page.tsx`
- [x] `src/app/api/health/route.ts`

## Customer App — `/src/components`
- [x] `src/components/AppShell.tsx`
- [x] `src/components/BottomNav.tsx`
- [x] `src/components/CallOverlay.tsx`
- [x] `src/components/InteractiveMap.tsx`
- [x] `src/components/MapBanner.tsx`
- [x] `src/components/OfflineBanner.tsx`
- [x] `src/components/PermissionModal.tsx`
- [x] `src/components/SearchWithVoice.tsx`
- [x] `src/components/ToastNotification.tsx`
- [x] `src/components/WorkerCard.tsx`
- [x] `src/components/ui/EmptyState.tsx`
- [x] `src/components/ui/Skeleton.tsx`

## Customer App — `/src/components/screens`
- [x] `src/components/screens/BookingsScreen.tsx`
- [x] `src/components/screens/HomeScreen.tsx`
- [x] `src/components/screens/LoginScreen.tsx`
- [x] `src/components/screens/MapScreen.tsx`
- [x] `src/components/screens/OwnerPanel.tsx`
- [x] `src/components/screens/ProfileScreen.tsx`
- [x] `src/components/screens/ProviderDetail.tsx`
- [x] `src/components/screens/WorkerProfileSheet.tsx`
- [x] `src/components/screens/WorkerScreen.tsx`

## Customer App — `/src/context`
- [x] `src/context/AppContext.tsx`

## Customer App — `/src/hooks`
- [x] `src/hooks/useWebRTC.ts`

## Customer App — `/src/lib`
- [x] `src/lib/audio.ts`
- [x] `src/lib/callEngine.ts`
- [x] `src/lib/commission.ts`
- [x] `src/lib/i18n.ts`
- [x] `src/lib/intentEngine.ts`
- [x] `src/lib/supabase.ts`
- [x] `src/lib/telegramOtp.ts`
- [x] `src/lib/types.ts`
- [x] `src/lib/webrtc/callManager.ts`
- [x] `src/lib/webrtc/signaling.ts`
- [x] `src/lib/webrtc/turn.ts`

## Customer App — `/src/__tests__`
- [x] `src/__tests__/audio.test.ts`
- [x] `src/__tests__/calling.test.ts`
- [x] `src/__tests__/commission.test.ts`
- [x] `src/__tests__/intentEngine.test.ts`
- [x] `src/__tests__/setup.ts`
- [x] `src/__tests__/owner.test.ts`
- [x] `src/__tests__/realtime.test.ts`

## Worker App — Root Config
- [x] `worker/.env.local.example`
- [x] `worker/.gitignore`
- [x] `worker/AGENTS.md`
- [x] `worker/CLAUDE.md`
- [x] `worker/README.md`
- [x] `worker/capacitor.config.ts`

## Worker App — `/worker`
- [x] `worker/next.config.ts`
- [x] `worker/package.json`
- [x] `worker/tsconfig.json`

## Worker App — `/worker/src`
- [x] `worker/src/app/globals.css`
- [x] `worker/src/app/layout.tsx`
- [x] `worker/src/app/page.tsx`

## Worker App — Components
- [x] `worker/src/components/CallOverlay.tsx`
- [x] `worker/src/components/CustomerMap.tsx`
- [x] `worker/src/components/JobOfferModal.tsx`
- [x] `worker/src/components/OfflineBanner.tsx`
- [x] `worker/src/components/PermissionModal.tsx`
- [x] `worker/src/components/ui/EmptyState.tsx`
- [x] `worker/src/components/ui/Skeleton.tsx`

## Worker App — `/worker/src/components/screens`
- [x] `worker/src/components/screens/DashboardScreen.tsx`
- [x] `worker/src/components/screens/EarningsScreen.tsx`
- [x] `worker/src/components/screens/JobOfferModal.tsx`
- [x] `worker/src/components/screens/JobsScreen.tsx`
- [x] `worker/src/components/screens/RequestsScreen.tsx`
- [x] `worker/src/components/screens/WorkerLoginScreen.tsx`
- [x] `worker/src/components/screens/WorkerProfileScreen.tsx`

## Worker App — `/worker/src/context`
- [x] `worker/src/context/WorkerContext.tsx`

## Worker App — `/worker/src/hooks`
- [x] `worker/src/hooks/useWebRTC.ts`

## Worker App — `/worker/src/lib`
- [x] `worker/src/lib/callEngine.ts`
- [x] `worker/src/lib/sms.ts`
- [x] `worker/src/lib/supabase.ts`
- [x] `worker/src/lib/types.ts`
- [x] `worker/src/lib/webrtc/callManager.ts`
- [x] `worker/src/lib/webrtc/signaling.ts`
- [x] `worker/src/lib/webrtc/turn.ts`

## Supabase Backend
- [x] `supabase/config.toml`
- [x] `supabase/schema.sql`
- [x] `supabase/seed.sql`
- [x] `supabase/target_schema_migration.sql`
- [x] `supabase/fix_categories.sql`
- [x] `supabase/functions/notify-booking/index.ts`
- [x] `supabase/migrations/20260807000000_cascade_engine.sql`
- [x] `supabase/migrations/20260807000001_realtime_replication.sql`
- [x] `supabase/migrations/20260808000000_nearby_workers.sql`
- [x] `supabase/migrations/20260809000000_booking_lat_lng.sql`

---

**Total files to audit: ~120**
**Files audited: 0 / ~120**
