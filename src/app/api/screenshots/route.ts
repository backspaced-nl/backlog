import { NextResponse } from 'next/server';
import { generateAllScreenshots } from '@/utils/screenshot';
import fs from 'fs/promises';
import path from 'path';

interface Project {
  id: string;
  url: string;
  screenshotLocked?: boolean;
}

export async function POST() {
  try {
    // Read projects from the JSON file
    const projectsPath = path.join(process.cwd(), 'src', 'data', 'projects.json');
    const projectsData = await fs.readFile(projectsPath, 'utf-8');
    const { projects } = JSON.parse(projectsData);

    // Filter out projects with locked screenshots
    const projectsToProcess = projects
      .filter((project: Project) => !project.screenshotLocked)
      .map((project: Project) => ({
        id: project.id,
        url: project.url
      }));

    if (projectsToProcess.length === 0) {
      return NextResponse.json(
        { message: 'No projects to process' },
        { status: 200 }
      );
    }

    // Start screenshot generation asynchronously
    generateAllScreenshots(projectsToProcess).catch(error => {
      console.error('Error in background screenshot generation:', error);
    });

    return NextResponse.json(
      { message: 'Screenshot generation started' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating screenshots:', error);
    return NextResponse.json(
      { error: 'Failed to generate screenshots' },
      { status: 500 }
    );
  }
} 