import fs from 'fs/promises';
import path from 'path';

// Next.js serves public/ at /. So public/screenshots/x.jpg → /screenshots/x.jpg
const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'public', 'screenshots');

function getFilePath(projectId: string): string {
  return path.join(SCREENSHOTS_DIR, `${projectId}.jpg`);
}

export async function ensureStorageDir() {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
}

export async function saveScreenshot(projectId: string, buffer: Buffer): Promise<void> {
  await ensureStorageDir();
  await fs.writeFile(getFilePath(projectId), buffer);
}

export async function deleteScreenshot(projectId: string): Promise<void> {
  try {
    await fs.unlink(getFilePath(projectId));
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code !== 'ENOENT') throw err;
  }
}

export async function screenshotExists(projectId: string): Promise<boolean> {
  try {
    await fs.access(getFilePath(projectId));
    return true;
  } catch {
    return false;
  }
}

/** URL for static file in public folder: /screenshots/{id}.jpg */
export function getScreenshotUrl(projectId: string): string {
  return `/screenshots/${projectId}.jpg`;
}

export function getScreenshotPath(projectId: string): string {
  return getFilePath(projectId);
}
