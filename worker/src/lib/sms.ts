const FAST2SMS_KEY = process.env.NEXT_PUBLIC_FAST2SMS_API_KEY ?? '';

export type OtpDeliveryResult =
  | { ok: true; method: 'sms' | 'screen' }
  | { ok: false; error: string };

export function generateOtp(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return String(1000 + (arr[0] % 9000));
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function sendOtp(phone: string, otp: string): Promise<OtpDeliveryResult> {
  const clean = phone.replace(/\D/g, '').slice(-10);
  if (!FAST2SMS_KEY || FAST2SMS_KEY.length < 10) {
    console.info(`[DEV] OTP for ${clean}: ${otp}`);
    return { ok: true, method: 'screen' };
  }
  try {
    const url = new URL('https://www.fast2sms.com/dev/bulkV2');
    url.searchParams.set('authorization', FAST2SMS_KEY);
    url.searchParams.set('route', 'q');
    url.searchParams.set('message', `${otp} is your Neighborly Trust Worker OTP. Valid 5 mins. Do not share.`);
    url.searchParams.set('flash', '0');
    url.searchParams.set('numbers', clean);
    const res = await fetch(url.toString(), { method: 'GET', headers: { 'cache-control': 'no-cache' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.return === true || json.return === 'true') return { ok: true, method: 'sms' };
    return { ok: true, method: 'screen' };
  } catch {
    return { ok: true, method: 'screen' };
  }
}
