import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FIREBASE_PROJECT_ID      = Deno.env.get('FIREBASE_PROJECT_ID') || 'hero-hand-e899f'
const FIREBASE_CLIENT_EMAIL    = Deno.env.get('FIREBASE_CLIENT_EMAIL')!
const FIREBASE_PRIVATE_KEY     = (Deno.env.get('FIREBASE_PRIVATE_KEY') || '').replace(/\\n/g, '\n')

// ─── Get OAuth2 Access Token from Service Account (FCM HTTP v1) ───────────────
async function getFcmAccessToken(): Promise<string | null> {
  if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('[FCM] Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY secrets')
    return null
  }

  try {
    const now = Math.floor(Date.now() / 1000)

    const encodeB64Url = (s: string) =>
      btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const header  = encodeB64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const claimsObj = {
      iss:   FIREBASE_CLIENT_EMAIL,
      sub:   FIREBASE_CLIENT_EMAIL,
      aud:   'https://oauth2.googleapis.com/token',
      iat:   now,
      exp:   now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    }
    const claims = encodeB64Url(JSON.stringify(claimsObj))
    const signingInput = `${header}.${claims}`

    // Import private key (PKCS8 PEM → DER)
    const pemBody = FIREBASE_PRIVATE_KEY
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '')
    const derBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      derBytes.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const sigBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signingInput),
    )

    const sig = encodeB64Url(String.fromCharCode(...new Uint8Array(sigBuffer)))
    const jwt = `${signingInput}.${sig}`

    // Exchange JWT → access_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('[FCM] Token exchange failed:', JSON.stringify(tokenData))
      return null
    }
    return tokenData.access_token as string
  } catch (e) {
    console.error('[FCM] JWT signing error:', e)
    return null
  }
}

// ─── FCM HTTP v1 Payload Types ────────────────────────────────────────────────
interface FcmPayload {
  token:     string | undefined
  channelId: 'booking_alert' | 'call_alert'
  title:     string
  body:      string
  sound:     string
  data?:     Record<string, string>
}

// ─── Send FCM Notification via HTTP v1 API ────────────────────────────────────
async function sendFcmNotification({ token, channelId, title, body, sound, data = {} }: FcmPayload) {
  if (!token) {
    console.log(`[FCM] No device token — skipping: ${title}`)
    return
  }

  const isCall    = channelId === 'call_alert'
  const vibration = isCall
    ? ['0s', '0.8s', '0.4s', '0.8s', '0.4s', '0.8s', '0.4s', '0.8s']  // Phone-like ringing
    : ['0s', '0.6s', '0.2s', '0.6s', '0.2s', '0.6s']                   // Booking alert pulses

  const message = {
    message: {
      token,
      // Notification block — shown even when app is killed
      notification: { title, body },
      // Android-specific: high priority, custom channel & sound
      android: {
        priority: 'high',
        ttl: isCall ? '60s' : '30s',
        notification: {
          title,
          body,
          sound,                          // must match res/raw/<sound>.mp3 (no extension)
          channel_id: channelId,          // must match channel created in MainActivity
          notification_priority: 'PRIORITY_MAX',
          visibility: 'PUBLIC',           // show on lock screen
          default_vibrate_timings: false,
          vibrate_timings: vibration,
          default_sound: false,
        },
      },
      // Data payload for JS/Capacitor to handle navigation
      data: {
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        click_action: 'OPEN_BOOKING_SCREEN',
      },
    },
  }

  const accessToken = await getFcmAccessToken()
  if (!accessToken) {
    console.error('[FCM] Cannot send — no access token obtained')
    return
  }

  try {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message),
      },
    )
    const result = await res.json()
    if (res.ok) {
      console.log('[FCM v1] ✅ Delivered:', result.name)
    } else {
      console.error('[FCM v1] ❌ Error:', JSON.stringify(result))
    }
  } catch (e) {
    console.error('[FCM v1] Fetch error:', e)
  }
}

// ─── Notify Customer (looks in `profiles` table) ──────────────────────────────
async function notifyCustomer(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  { title, body, data }: { title: string; body: string; data: Record<string, string> },
) {
  const { data: profile } = await supabase
    .from('profiles').select('fcm_token').eq('id', customerId).single()

  if (profile?.fcm_token) {
    await sendFcmNotification({
      token:     profile.fcm_token,
      channelId: 'booking_alert',
      title,
      body,
      sound:     'booking_ringtone',
      data,
    })
  }
}

// ─── Notify Worker (looks in `worker_profiles` table) ────────────────────────
async function notifyWorker(
  supabase: ReturnType<typeof createClient>,
  workerId: string,
  { title, body, sound, channelId, data }: {
    title: string; body: string; sound: string;
    channelId: 'booking_alert' | 'call_alert';
    data: Record<string, string>
  },
) {
  const { data: profile } = await supabase
    .from('worker_profiles').select('fcm_token').eq('profile_id', workerId).single()

  if (profile?.fcm_token) {
    await sendFcmNotification({ token: profile.fcm_token, channelId, title, body, sound, data })
  }
}

// ─── Main Request Handler ──────────────────────────────────────────────────────
serve(async (req) => {
  try {
    const payload  = await req.json()
    const { record, type, table } = payload
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ── New booking offer → notify the assigned worker ──────────────────────
    if (table === 'booking_offers' && type === 'INSERT') {
      const { worker_id, booking_id } = record

      const [{ data: profile }, { data: booking }] = await Promise.all([
        supabase.from('worker_profiles').select('fcm_token, full_name').eq('profile_id', worker_id).single(),
        supabase.from('bookings').select('category_name, customer_name, address').eq('id', booking_id).maybeSingle(),
      ])

      await sendFcmNotification({
        token:     profile?.fcm_token,
        channelId: 'booking_alert',
        title:     `🔔 New ${booking?.category_name || 'Service'} Booking!`,
        body:      `${booking?.customer_name || 'A customer'} needs help — tap to view and accept`,
        sound:     'booking_ringtone',
        data:      { type: 'booking', booking_id, worker_id },
      })

    // ── Booking status → notify customer ────────────────────────────────────
    } else if (table === 'bookings' && type === 'UPDATE') {
      const { customer_id, status } = record
      const oldRecord = payload.old_record

      if (status === oldRecord?.status) return new Response(JSON.stringify({ skipped: true }))

      const messages: Record<string, { title: string; body: string }> = {
        accepted:  { title: '✅ Worker on the way!', body: 'Your specialist accepted the job and is heading to you.' },
        completed: { title: '🎉 Job Completed!',     body: 'Your service is done. Please rate your experience.' },
        cancelled: { title: '❌ Booking Cancelled',  body: 'The booking was cancelled.' },
      }
      if (messages[status]) {
        await notifyCustomer(supabase, customer_id, {
          ...messages[status],
          data: { type: 'status', status, booking_id: record.id },
        })
      }

    // ── Incoming call signal → notify callee with call ringtone ─────────────
    // Supports BOTH directions: customer→worker and worker→customer
    } else if (table === 'call_signals' && type === 'INSERT') {
      const { callee_id, caller_id, caller_name, caller_type, booking_id } = record
      // caller_type: 'worker' | 'customer'
      const isWorkerCalling = caller_type === 'worker'

      const notifPayload = {
        channelId: 'call_alert' as const,
        title:     `📞 Incoming Call`,
        body:      `${caller_name || (isWorkerCalling ? 'Your Worker' : 'Customer')} is calling you`,
        sound:     'call_ringtone',
        data:      { type: 'call', booking_id: String(booking_id), caller_id: String(caller_id) },
      }

      if (isWorkerCalling) {
        // Worker calling customer → look in `profiles`
        await notifyCustomer(supabase, callee_id, {
          title: notifPayload.title,
          body:  notifPayload.body,
          data:  notifPayload.data,
        })
      } else {
        // Customer calling worker → look in `worker_profiles`
        await notifyWorker(supabase, callee_id, notifPayload)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('notify-booking error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
