import puppeteer, { Browser, Page } from 'puppeteer-core';

let browserInstance: Browser | null = null;

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
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function withBrowser<T>(callback: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await getBrowser();
  try {
    return await callback(browser);
  } catch (error) {
    throw error;
  }
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