import { NextResponse } from 'next/server';
import { supabase, projectFromDb, projectToDb } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { getScreenshotUrl } from '@/utils/screenshot';

export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Map all projects to camelCase and add screenshotUrl
  const projects = (data || []).map((p) => {
    const project = projectFromDb(p);
    return project ? { ...project, screenshotUrl: getScreenshotUrl(project.id) } : project;
  });
  return NextResponse.json({ projects });
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
    // --- Fetch website title ---
    try {
      const { withPage } = await import('@/utils/puppeteer');
      const title = await withPage(async (page) => {
        try {
          await page.goto(body.url, { 
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });
        } catch (gotoError) {
          // Log detailed error for debugging
          console.error('Detailed page.goto error:', {
            url: body.url,
            error: gotoError,
            message: gotoError instanceof Error ? gotoError.message : 'Unknown error',
            stack: gotoError instanceof Error ? gotoError.stack : undefined,
            name: gotoError instanceof Error ? gotoError.name : 'Unknown error type'
          });
          throw gotoError;
        }
        return page.title();
      });
      newProject.title = title;
    } catch (error) {
      // If title fetch fails, continue with empty title
      console.error('Error accessing website:', error);
      newProject.title = '';
    }
    // --- Generate screenshot ---
    try {
      const { generateScreenshot } = await import('@/utils/screenshot');
      await generateScreenshot({ id: projectId, url: body.url, title: '', tags: [] });
      newProject.screenshotLocked = true;
    } catch (screenshotError) {
      // If screenshot fails, continue but mark as not locked
      console.error('Error generating screenshot:', screenshotError);
      newProject.screenshotLocked = false;
    }
    // --- Insert new project into Supabase ---
    const { data: inserted, error } = await supabase.from('projects').insert([projectToDb(newProject)]).select('*').single();
    if (error) {
      // Database error
      console.error('Error writing project to Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to write project to Supabase' },
        { status: 500 }
      );
    }
    // Return camelCase project with screenshotUrl
    const project = projectFromDb(inserted);
    return NextResponse.json(
      project ? { ...project, screenshotUrl: getScreenshotUrl(project.id) } : project,
      { status: 201 }
    );
  } catch (error) {
    // Catch-all error
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updateData } = body;

  // Compose update object in camelCase, then map
  const mappedData = projectToDb({
    id,
    ...updateData,
    updatedAt: new Date().toISOString(),
  });

  const { error } = await supabase
    .from('projects')
    .update(mappedData)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  // Delete screenshot from Supabase Storage
  const { error: storageError } = await supabase.storage.from('screenshots').remove([`${id}.jpg`]);
  if (storageError) {
    // Log but do not block project deletion if screenshot removal fails
    console.error('Error deleting screenshot from Supabase:', storageError.message);
  }
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 