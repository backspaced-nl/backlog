import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  let browser;
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 2000, deviceScaleFactor: 1 });
    
    // Set a timeout for navigation
    await page.setDefaultNavigationTimeout(10000); // 10 seconds
    
    // Navigate to the URL with a shorter timeout
    await Promise.race([
      page.goto(url, { 
        waitUntil: 'domcontentloaded', // Use domcontentloaded instead of networkidle0
        timeout: 10000 // 10 seconds
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Navigation timeout')), 10000)
      )
    ]);
    
    // Get the page title
    const title = await page.title();
    
    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error fetching title:', error);
    return NextResponse.json(
      { error: 'Failed to fetch title' },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
} 