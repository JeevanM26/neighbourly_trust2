# Admin Dashboard — Agent Ground Rules & Architectural Conventions

## Overview
The Admin Dashboard (`admin/`, default port 3002) is the operations hub for Neighborly Trust / Hands of ShramiXs.
It manages technician verification, real-time concierge dispatching, daily work-done reviews, and category icon management.

## Real-Time Subscriptions
- **Bookings Sync**: `admin_bookings_realtime_sync` listens to `INSERT` and `UPDATE` on `public.bookings`. Incoming customer requests from the helpline or online booking appear live without page refreshes.
- **Service Categories Sync**: `admin_service_categories_sync` listens to changes on `public.service_categories`.

## Assisted Concierge Dispatch Flow
1. Customer requests can be initiated without a pre-assigned specialist (`worker_id = null`, `status = 'searching' | 'pending'`).
2. Admin Dashboard displays an attention-grabbing "DISPATCH NEEDED" badge on the booking card and an unassigned counter badge (`⚡ X to dispatch`) on the navigation tab.
3. The Admin opens the **Concierge Dispatch Modal** to review customer details, call technicians offline via `tel:+91...` to confirm immediate availability, and dispatch them with one tap (`status: 'accepted', worker_id: worker.id`).
4. Both the customer app and worker app reflect the assignment immediately via their respective Supabase Realtime subscriptions.

## TypeScript & Build Configuration
- `admin/tsconfig.json` compiles files under `src/` (`"src/**/*.ts"`, `"src/**/*.tsx"`).
- Always exclude `.next` and `node_modules` to prevent Next.js dev route artifact collisions during `tsc --noEmit`.
