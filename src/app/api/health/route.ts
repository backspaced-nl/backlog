import { NextResponse } from 'next/server';

/** Lightweight health check for Coolify/load balancers. No DB, no Puppeteer. */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
