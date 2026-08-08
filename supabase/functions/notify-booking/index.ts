import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record, type, table } = payload

    // We only care about booking_offers inserts or bookings status updates
    if (table === 'booking_offers' && type === 'INSERT') {
      const { worker_id, booking_id } = record
      
      // Fetch worker FCM token
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { data: profile } = await supabase
        .from('worker_profiles')
        .select('fcm_token')
        .eq('profile_id', worker_id)
        .single()
      
      const token = profile?.fcm_token
      const title = 'New Job Offer!'
      const body = 'You have a new job request nearby. Tap to view.'
      
      await sendPushNotification(token, title, body, { booking_id })
      
    } else if (table === 'bookings' && type === 'UPDATE') {
      const { customer_id, worker_id, status } = record
      const oldRecord = payload.old_record
      
      if (status !== oldRecord.status) {
        // Customer notification
        if (status === 'accepted') {
           await notifyCustomer(customer_id, 'Worker is on the way!', 'Your specialist has accepted the job.')
        } else if (status === 'completed') {
           await notifyCustomer(customer_id, 'Job Completed', 'Your service has been marked as completed.')
        } else if (status === 'cancelled') {
           await notifyCustomer(customer_id, 'Booking Cancelled', 'The booking was cancelled.')
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error("notify-booking error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})

async function notifyCustomer(customerId: string, title: string, body: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: profile } = await supabase
    .from('profiles')
    .select('fcm_token')
    .eq('id', customerId)
    .single()
  
  if (profile?.fcm_token) {
    await sendPushNotification(profile.fcm_token, title, body)
  }
}

async function sendPushNotification(token: string | undefined, title: string, body: string, data: any = {}) {
  if (!token) {
    console.log(`[FCM Mock] No token found. Skipping push for: ${title}`)
    return
  }
  
  const payload = {
    to: token,
    notification: {
      title,
      body,
      sound: 'default'
    },
    data
  }
  
  if (!FCM_SERVER_KEY) {
    console.log('[FCM Mock] Missing FCM_SERVER_KEY. Simulated push payload:')
    console.log(JSON.stringify(payload, null, 2))
    return
  }
  
  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify(payload)
    })
    const result = await res.json()
    console.log('FCM Send Result:', result)
  } catch (e) {
    console.error('Failed to send FCM:', e)
  }
}
