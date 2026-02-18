import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProjects, createProject, updateProject, deleteProjects, projectFromDb, projectToDb } from '@/utils/db';
import { deleteScreenshot, screenshotExists } from '@/utils/storage';
import { getScreenshotUrl } from '@/utils/screenshot';
import { v4 as uuidv4 } from 'uuid';

async function requireAuth() {
  const isAuthenticated = (await cookies()).get('admin_auth')?.value === 'true';
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

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
  const authError = await requireAuth();
  if (authError) return authError;

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
      isPrivate: body.isPrivate ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // --- Single Puppeteer session: title, WooCommerce, screenshot ---
    try {
      const { withPage } = await import('@/utils/puppeteer');
      const { generateScreenshotFromPage } = await import('@/utils/screenshot');
      const result = await withPage(async (page) => {
        await page.setViewport({
          width: 1440,
          height: 2000,
          deviceScaleFactor: 1,
        });
        await page.goto(body.url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        const title = await page.title();
        const html = await page.content();
        const isWooCommerce = /woocommerce/i.test(html);
        let screenshotOk = false;
        try {
          await generateScreenshotFromPage(page, { id: projectId });
          screenshotOk = true;
        } catch {
          // keep title and WooCommerce even if screenshot fails
        }
        return { title, isWooCommerce, screenshotOk };
      });
      newProject.title = result.title;
      if (result.isWooCommerce) {
        const baseTags = body.tags || [];
        newProject.tags = baseTags.includes('E-commerce') ? baseTags : [...baseTags, 'E-commerce'];
      }
      newProject.screenshotLocked = result.screenshotOk;
    } catch {
      newProject.title = '';
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
  const authError = await requireAuth();
  if (authError) return authError;

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
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const ids = body.ids ?? (body.id ? [body.id] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'id or ids required' }, { status: 400 });
    }
    for (const id of ids) {
      try {
        await deleteScreenshot(id);
      } catch {
        // ignore
      }
    }
    await deleteProjects(ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 