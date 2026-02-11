import { NextResponse } from 'next/server';
import { getProjects, createProject, updateProject, deleteProject, projectFromDb, projectToDb } from '@/utils/db';
import { deleteScreenshot, screenshotExists } from '@/utils/storage';
import { getScreenshotUrl } from '@/utils/screenshot';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const rows = await getProjects();
    const projects = await Promise.all(
      rows.map(async (p) => {
        const project = projectFromDb(p);
        if (!project) return project;
        const hasScreenshot = await screenshotExists(project.id);
        return { ...project, ...(hasScreenshot && { screenshotUrl: getScreenshotUrl(project.id) }) };
      })
    );
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    const projectId = uuidv4();
    // Create new project object with default values (camelCase)
    const newProject = {
      id: projectId,
      title: '',  // Will be filled in later
      url: body.url,
      completionDate: '',  // Will be filled in later
      tags: body.tags || [],
      partner: body.partner || '',
      screenshotLocked: false, // Start unlocked
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // --- Fetch website title and detect WooCommerce for E-commerce tag ---
    try {
      const { withPage } = await import('@/utils/puppeteer');
      const { title, isWooCommerce } = await withPage(async (page) => {
        try {
          await page.goto(body.url, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });
        } catch (gotoError) {
          throw gotoError;
        }
        const title = await page.title();
        const html = await page.content();
        const isWooCommerce = /woocommerce/i.test(html);
        return { title, isWooCommerce };
      });
      newProject.title = title;
      if (isWooCommerce) {
        const baseTags = body.tags || [];
        newProject.tags = baseTags.includes('E-commerce') ? baseTags : [...baseTags, 'E-commerce'];
      }
    } catch {
      newProject.title = '';
    }
    // --- Generate screenshot ---
    try {
      const { generateScreenshot } = await import('@/utils/screenshot');
      await generateScreenshot({ id: projectId, url: body.url, title: '', tags: [] });
      newProject.screenshotLocked = true;
    } catch {
      newProject.screenshotLocked = false;
    }
    const dbRow = projectToDb(newProject);
    if (!dbRow) throw new Error('projectToDb returned null');
    const inserted = await createProject(dbRow);

    const project = projectFromDb(inserted);
    const hasScreenshot = project ? await screenshotExists(project.id) : false;
    return NextResponse.json(
      project
        ? { ...project, ...(hasScreenshot && { screenshotUrl: getScreenshotUrl(project.id) }) }
        : project,
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const mapped = projectToDb({
      id,
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
    if (mapped) await updateProject(id, mapped);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    try {
      await deleteScreenshot(id);
    } catch {
      // ignore
    }
    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 