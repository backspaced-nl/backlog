import sharp from 'sharp';
import type { Page } from 'puppeteer-core';
import { withPage } from './puppeteer';
import { saveScreenshot } from './storage';
import type { Project } from '@/types/project';

const ELEMENTS_TO_HIDE = [
  // Cookiebot
  '#CybotCookiebotDialog',
  '#CybotCookiebotDialogBodyUnderlay',
  // OneTrust
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  '#ot-sdk-cookie-policy',
  // CookieYes
  '.cky-consent-container',
  '#cky-consent-banner',
  // Osano
  '.osano-cm-dialog',
  '.osano-cm-window',
  // Cookie Consent (Insites)
  '.cc-window',
  '.cc_banner',
  '#cookie-law-info-bar',
  // CookieScript
  '#cookiescript_injected_wrapper',
  // Quantcast
  '.qc-cmp2-container',
  '#quantcast',
  // Didomi
  '#didomi-host',
  '.didomi-popup',
  // Usercentrics
  '#usercentrics-consent-banner',
  '.uc-banner',
  // Iubenda
  '.iubenda-cs-consent',
  '#iubenda-cs-banner',
  // Termly
  '#termly-code-snippet-support',
  '.termly',
  // TrustArc
  '#truste-consent-track',
  '.truste_overlay',
  // Generic / Fanboy list
  '[id*="cookie"]',
  '[class*="cookie"]',
  '[id*="consent"]',
  '[class*="consent"]',
  '.gdpr',
  '.hystmodal',
  '#CookieConsent',
  '#CookieBanner',
  '#EUCookie',
  '#GDPR-cookies-notice',
];

const WAIT_MS = 3000;

/** Uses an existing page (already loaded) to capture screenshot. Caller must set viewport and navigate. */
export async function generateScreenshotFromPage(page: Page, project: { id: string }) {
  await new Promise((resolve) => setTimeout(resolve, WAIT_MS));

  await page.evaluate((selectors) => {
    selectors.forEach((selector) => {
      try {
        document.querySelectorAll(selector).forEach((el) => {
          const html = el as HTMLElement;
          html.style.setProperty('display', 'none', 'important');
          html.remove();
        });
      } catch {
        // selector may be invalid for this page
      }
    });
  }, ELEMENTS_TO_HIDE);

  const fullHeight = await page.evaluate(() => {
    return Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
  });

  const screenshotBuffer = await page.screenshot({
    type: 'jpeg',
    quality: 80,
    clip: {
      x: 0,
      y: 0,
      width: 1440,
      height: Math.min(fullHeight, 2000),
    },
  });

  const processedImage = await sharp(screenshotBuffer as Buffer)
    .resize(600, 800, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 80 })
    .toBuffer();

  await saveScreenshot(project.id, processedImage);
}

export async function generateScreenshot(project: Project) {
  await withPage(async (page) => {
    await page.setViewport({
      width: 1440,
      height: 2000,
      deviceScaleFactor: 1,
    });

    await page.goto(project.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await generateScreenshotFromPage(page, project);
  });
}

export { getScreenshotUrl } from './storage';
