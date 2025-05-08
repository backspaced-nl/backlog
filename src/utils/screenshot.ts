import puppeteer from 'puppeteer';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

interface Project {
  id: string;
  url: string;
}

interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  startTime: number;
  endTime?: number;
  error?: string;
}

const JOBS_FILE = path.join(process.cwd(), 'src', 'data', 'screenshot-jobs.json');

async function updateJobStatus(jobId: string, status: Partial<JobStatus>) {
  try {
    let jobs: Record<string, JobStatus> = {};
    
    try {
      const jobsData = await fs.readFile(JOBS_FILE, 'utf-8');
      jobs = JSON.parse(jobsData);
    } catch {
      // File doesn't exist or is empty, start with empty object
    }

    jobs[jobId] = {
      ...jobs[jobId],
      ...status
    };

    await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error('Error updating job status:', error);
  }
}

async function generateScreenshotForProject(project: Project, jobId: string, progress: number) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
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

    const screenshotBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: Math.min(fullHeight, 2000)
      }
    });

    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    await sharp(screenshotBuffer)
      .resize(600, 800, {
        fit: 'cover',
        position: 'top'
      })
      .toFile(path.join(screenshotsDir, `${project.id}.jpg`));

    await page.close();
    await updateJobStatus(jobId, { progress });
  } catch (error) {
    console.error(`Error generating screenshot for ${project.url}:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

export async function generateAllScreenshots(projects: Project[]) {
  const jobId = 'all';
  const startTime = Date.now();

  try {
    await updateJobStatus(jobId, {
      status: 'pending',
      progress: 0,
      total: projects.length,
      startTime
    });

    await updateJobStatus(jobId, {
      status: 'processing',
      progress: 0
    });

    for (let i = 0; i < projects.length; i++) {
      await generateScreenshotForProject(projects[i], jobId, i + 1);
    }

    await updateJobStatus(jobId, {
      status: 'completed',
      progress: projects.length,
      endTime: Date.now()
    });
  } catch (error) {
    console.error('Error in generateAllScreenshots:', error);
    await updateJobStatus(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      endTime: Date.now()
    });
    throw error;
  }
}

export async function generateSingleScreenshot(project: Project) {
  const jobId = `single-${project.id}`;
  const startTime = Date.now();

  try {
    await updateJobStatus(jobId, {
      status: 'pending',
      progress: 0,
      total: 1,
      startTime
    });

    await updateJobStatus(jobId, {
      status: 'processing',
      progress: 0
    });

    await generateScreenshotForProject(project, jobId, 1);

    await updateJobStatus(jobId, {
      status: 'completed',
      progress: 1,
      endTime: Date.now()
    });
  } catch (error) {
    console.error('Error in generateSingleScreenshot:', error);
    await updateJobStatus(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      endTime: Date.now()
    });
    throw error;
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  try {
    const jobsData = await fs.readFile(JOBS_FILE, 'utf-8');
    const jobs = JSON.parse(jobsData);
    return jobs[jobId] || null;
  } catch {
    return null;
  }
} 