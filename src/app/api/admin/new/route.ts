import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { generateSingleScreenshot } from "@/utils/screenshot";

const projectsFilePath = path.join(process.cwd(), "src/data/projects.json");

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
      createdAt: new Date().toISOString(),
    };

    // First get the website title
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      try {
        await page.goto(data.url, { 
          waitUntil: 'domcontentloaded', // Use domcontentloaded for faster title fetch
          timeout: 10000
        });
      } catch (gotoError) {
        console.error('Detailed page.goto error:', {
          url: data.url,
          error: gotoError,
          message: gotoError instanceof Error ? gotoError.message : 'Unknown error',
          stack: gotoError instanceof Error ? gotoError.stack : undefined,
          name: gotoError instanceof Error ? gotoError.name : 'Unknown error type'
        });
        throw gotoError;
      }

      // Get the website title
      const title = await page.title();
      newProject.title = title;
      await page.close();

      // Now try to generate screenshot using the shared function
      try {
        await generateSingleScreenshot({ id: projectId, url: data.url });
        newProject.screenshotLocked = true;
      } catch (screenshotError) {
        console.error('Error generating screenshot:', screenshotError);
        newProject.screenshotLocked = false;
        // Return error response but still create the project
        return NextResponse.json(
          { 
            ...newProject,
            error: screenshotError instanceof Error ? screenshotError.message : 'Failed to generate screenshot'
          },
          { status: 201 }
        );
      }
    } catch (error) {
      console.error('Error accessing website:', error);
      newProject.screenshotLocked = false;
      // Return error response but still create the project
      return NextResponse.json(
        { 
          ...newProject,
          error: error instanceof Error ? error.message : 'Failed to access website'
        },
        { status: 201 }
      );
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
