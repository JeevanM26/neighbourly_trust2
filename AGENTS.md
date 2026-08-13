<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# Neighborly Trust — Agent Ground Rules

## Non-negotiables
- Never delete or silently rewrite a working feature. If a fix needs a breaking
  schema change, propose a migration and ask before running it against real data.
- Both apps (worker, customer) read/write the SAME Supabase project. Any table
  name, enum value, or status string used by one app must be mirrored EXACTLY
  in the other. String drift (e.g. "Online" vs "online", "Accepted" vs
  "accepted") is the single most common cause of "works in one app, not the
  other" bugs in this codebase — check for it explicitly after every change.
- Every screen has three states beyond the happy path: loading, empty, and
  error-with-retry. No blank white screens, no silent failures.
- Every permission request (location, microphone, notifications) shows a
  plain-language rationale BEFORE the OS prompt fires, and has a graceful
  path if denied — never a crash or dead end.
- Never hardcode service categories, status strings, or copy in more than one
  place. Pull from the database or one shared constants file per app.
- After any change, explicitly check whether it could break the OTHER app —
  this is a shared backend; a "worker app" fix can silently break the
  customer app and vice versa.
- No phone number, in any form, is ever queried, stored in client state, or
  rendered on a screen belonging to the other role. `profiles` has no phone
  column on purpose — if you find yourself adding one, stop and ask first.
- Never commit or hardcode a Supabase `service_role` key, SMS provider key,
  Sarvam API key, or TURN credential anywhere in client code. These are
  Supabase secrets / Edge Function env vars only.
- If you discover you're about to reproduce a bug fixed in an earlier phase
  (e.g. reintroducing a status string that doesn't match the other app),
  stop and flag it instead of proceeding.

## Known likely-broken areas (check these first, don't assume they're fine)
1. Realtime replication may not be enabled per-table in the Supabase
   dashboard (`alter publication supabase_realtime add table x`) — the
   subscription code can be perfectly correct and still receive nothing.
2. RLS blocks fail SILENTLY — a blocked read returns zero rows, not an
   error. If a worker never sees incoming jobs, check RLS before assuming
   the query is wrong.
3. Location may never actually be written — confirm the online toggle
   requests permission, starts a location stream, AND persists to the DB,
   not just flips a local UI switch.
4. WebRTC TURN credentials are dynamically fetched via Metered.ca — verify
   `NEXT_PUBLIC_METERED_DOMAIN` and API key configuration in `.env.local` if calls fail.

