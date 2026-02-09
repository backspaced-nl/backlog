import { NextResponse } from 'next/server';
import { withPage } from '@/utils/puppeteer';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const title = await withPage(async (page) => {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      return page.title();
    });

    return NextResponse.json({ title });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch title' },
      { status: 500 }
    );
  }
} 