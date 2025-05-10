import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { withPage } from './puppeteer';

interface Project {
  id: string;
  url: string;
}

async function generateScreenshotForProject(project: Project) {
  try {
    const screenshotBuffer = await withPage(async (page) => {
      await page.setViewport({ 
        width: 1440, 
        height: 2000,
        deviceScaleFactor: 1
      });
      
      // Navigate to the page and wait for network to be idle
      await page.goto(project.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Elements to hide before taking screenshot
      const elementsToHide = [
        '#cookiescript_injected_wrapper',
        '.cky-consent-container',
        // Add more selectors here as needed
      ];

      // Hide specified elements
      await page.evaluate((selectors) => {
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            (element as HTMLElement).style.display = 'none';
          });
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
          height: Math.min(fullHeight, 2000)
        }
      });
    });

    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    await sharp(screenshotBuffer)
      .resize(600, 800, {
        fit: 'cover',
        position: 'top'
      })
      .toFile(path.join(screenshotsDir, `${project.id}.jpg`));
  } catch (error) {
    console.error(`Error generating screenshot for ${project.url}:`, error);
    throw error;
  }
}

export async function generateScreenshot(project: Project) {
  try {
    await generateScreenshotForProject(project);
  } catch (error) {
    console.error('Error in generateScreenshot:', error);
    throw error;
  }
} 