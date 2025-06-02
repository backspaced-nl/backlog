import sharp from 'sharp';
import { withPage } from './puppeteer';
import { supabase } from './supabase';
import type { Project } from '@/types/project';

const BUCKET = 'screenshots';

export async function generateScreenshot(project: Project) {
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

    // Process with sharp
    const processedImage = await sharp(screenshotBuffer)
      .resize(600, 800, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${project.id}.jpg`, processedImage, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (error) throw error;
  } catch (error) {
    console.error(`Error generating/uploading screenshot for ${project.url}:`, error);
    throw error;
  }
}

export function getScreenshotUrl(projectId: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${projectId}.jpg`);
  return data.publicUrl;
} 