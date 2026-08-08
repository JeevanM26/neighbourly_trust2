import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'Neighborly Trust Uptime Monitor',
      timestamp: '2026-07-31T00:00:00.000Z',
    },
    { status: 200 }
  );
}
