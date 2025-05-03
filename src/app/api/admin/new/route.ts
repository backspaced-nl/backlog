import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import sharp from "sharp";

const projectsFilePath = path.join(process.cwd(), "src/data/projects.json");
const screenshotsDir = path.join(process.cwd(), "public/screenshots");

export async function POST(request: Request) {
  let browser;
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const projectId = uuidv4();

    // Create new project object with default values
    const newProject = {
      id: projectId,
      title: '',  // Will be filled in later
      url: data.url,
      completionDate: '',  // Will be filled in later
      tags: [],
      partner: '',
      screenshotLocked: false, // Start unlocked
      screenshotError: null as string | null, // Add error field with explicit type
      createdAt: new Date().toISOString(),
    };

    // First get the website title
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ 
        width: 1440, 
        height: 2000,
        deviceScaleFactor: 1
      });
      
      await page.goto(data.url, { 
        waitUntil: 'domcontentloaded', // Use domcontentloaded for faster title fetch
        timeout: 10000
      });

      // Get the website title
      const title = await page.title();
      newProject.title = title;

      // Now try to generate screenshot
      try {
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

        // Ensure screenshots directory exists
        await fs.mkdir(screenshotsDir, { recursive: true });
        
        // Take screenshot
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

        // Process the screenshot with sharp
        await sharp(screenshotBuffer)
          .resize(600, 800, {
            fit: 'cover',
            position: 'top'
          })
          .toFile(path.join(screenshotsDir, `${projectId}.jpg`));
        
        // Only lock if screenshot was generated successfully
        newProject.screenshotLocked = true;
        newProject.screenshotError = null;
      } catch (screenshotError) {
        console.error('Error generating screenshot:', screenshotError);
        newProject.screenshotLocked = false;
        newProject.screenshotError = screenshotError instanceof Error ? screenshotError.message : 'Failed to generate screenshot';
      }
    } catch (error) {
      console.error('Error accessing website:', error);
      newProject.screenshotLocked = false;
      newProject.screenshotError = error instanceof Error ? error.message : 'Failed to access website';
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    // Read existing projects
    const fileContent = await fs.readFile(projectsFilePath, "utf-8");
    const { projects } = JSON.parse(fileContent);

    // Add new project
    projects.push(newProject);

    // Write back to file
    await fs.writeFile(projectsFilePath, JSON.stringify({ projects }, null, 2));

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
