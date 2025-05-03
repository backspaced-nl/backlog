import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Project {
  id: string;
  title: string;
  url: string;
  tags: string[];
  completionDate?: string;
  partner?: string;
  screenshotLocked?: boolean;
  screenshotError?: string;
}

const projectsFilePath = path.join(process.cwd(), 'src/data/projects.json');
const screenshotsDir = path.join(process.cwd(), 'public/screenshots');

async function readProjects() {
  try {
    const fileContents = await fs.readFile(projectsFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading projects file:', error);
    return { projects: [] };
  }
}

async function writeProjects(projects: Project[]) {
  try {
    await fs.writeFile(projectsFilePath, JSON.stringify({ projects }, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing projects file:', error);
    return false;
  }
}

export async function GET() {
  try {
    const data = await readProjects();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json(
      { error: 'Failed to load projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const project = await request.json();
    const data = await readProjects();
    
    // Add new project
    data.projects.push(project);
    const success = await writeProjects(data.projects);
    
    if (!success) {
      throw new Error('Failed to write projects file');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding project:', error);
    return NextResponse.json(
      { error: 'Failed to add project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...projectData } = await request.json();
    const data = await readProjects();
    
    // Update project
    const index = data.projects.findIndex((p: Project) => p.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    data.projects[index] = { ...data.projects[index], ...projectData };
    const success = await writeProjects(data.projects);
    
    if (!success) {
      throw new Error('Failed to write projects file');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const data = await readProjects();
    
    // Find the project to delete
    const projectIndex = data.projects.findIndex((p: Project) => p.id === id);
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Remove the project from the array
    data.projects.splice(projectIndex, 1);

    // Write back to file
    const success = await writeProjects(data.projects);
    if (!success) {
      throw new Error('Failed to write projects file');
    }

    // Try to delete the screenshot file if it exists
    try {
      const screenshotPath = path.join(screenshotsDir, `${id}.jpg`);
      await fs.unlink(screenshotPath);
    } catch {
      // Ignore error if file doesn't exist
      console.log('Screenshot file not found or already deleted');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
} 