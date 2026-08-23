# 🛠️ Neighborly Trust — Worker / Provider Application

The **Neighborly Trust Worker App** is the provider-facing mobile & web application for skilled service workers in rural India.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (PostGIS & Realtime)**, **Metered.ca WebRTC**, and **Capacitor Android**.

---

## 🚀 Key Features

- **Realtime Job Dispatch**: Receive job offers from nearby customers via Supabase Realtime broadcast.
- **PostGIS Location Sync**: Atomic GPS tracking (`SRID=4326`) for precise geographic matching.
- **WebRTC Voice Calling**: Embedded audio calling overlay powered by Metered.ca TURN/STUN servers.
- **Earnings & Commission Ledger**: Live income tracking with automated platform commission math.
- **Offline Banner**: Global connectivity monitor with graceful reconnect handling.

---

## 🛠️ Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase project URL, anon key, and Metered credentials.

3. Run development server:
   ```bash
   npm run dev
   ```

---

## 📱 Mobile Build (Capacitor Android)

```bash
npm run build
npx cap sync android
npx cap open android
```

---

## 🛡️ License & Copyright
© 2026 Neighborly Trust Inc. All rights reserved.

