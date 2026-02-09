import sharp from 'sharp';
import { withPage } from './puppeteer';
import { saveScreenshot } from './storage';
import type { Project } from '@/types/project';

export async function generateScreenshot(project: Project) {
  try {
    const screenshotBuffer = await withPage(async (page) => {
      await page.setViewport({
        width: 1440,
        height: 2000,
        deviceScaleFactor: 1,
      });

      await page.goto(project.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const elementsToHide = [
        '#cookiescript_injected_wrapper',
        '.cky-consent-container',
        '[id*="cookie"]',
        '[class*="cookie"]',
        '[id*="consent"]',
        '[class*="consent"]',
        '.cc-window',
        '#onetrust-banner-sdk',
        '.gdpr',
      ];

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
      }, elementsToHide);

      const fullHeight = await page.evaluate(() => {
        return Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        );
      });

      return page.screenshot({
        type: 'jpeg',
        quality: 80,
        clip: {
          x: 0,
          y: 0,
          width: 1440,
          height: Math.min(fullHeight, 2000),
        },
      });
    });

    const processedImage = await sharp(screenshotBuffer as Buffer)
      .resize(600, 800, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 80 })
      .toBuffer();

    await saveScreenshot(project.id, processedImage);
  } catch (error) {
    throw error;
  }
}

export { getScreenshotUrl } from './storage';
