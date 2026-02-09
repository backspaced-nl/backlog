import puppeteer, { Browser, Page } from 'puppeteer-core';

let browserInstance: Browser | null = null;

function isConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /connection closed|protocol error|session closed|target closed/i.test(msg);
}

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BLESS_TOKEN}`,
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch {
      // ignore close errors
    }
    browserInstance = null;
  }
}

export async function withBrowser<T>(callback: (browser: Browser) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const browser = await getBrowser();
      return await callback(browser);
    } catch (error) {
      lastError = error;
      if (isConnectionError(error)) {
        browserInstance = null;
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function withPage<T>(callback: (page: Page) => Promise<T>): Promise<T> {
  return withBrowser(async (browser) => {
    const page = await browser.newPage();
    try {
      return await callback(page);
    } finally {
      await page.close();
    }
  });
} 