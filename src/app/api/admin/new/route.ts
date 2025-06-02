import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { withPage } from "@/utils/puppeteer";
import { generateScreenshot } from "@/utils/screenshot";
import { supabase, projectToDb, projectFromDb } from '@/utils/supabase';

export async function POST(request: Request) {
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

    // Create new project object with default values (camelCase)
    const newProject = {
      id: projectId,
      title: '',  // Will be filled in later
      url: data.url,
      completionDate: '',  // Will be filled in later
      tags: [],
      partner: '',
      screenshotLocked: false, // Start unlocked
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // First get the website title
    try {
      const title = await withPage(async (page) => {
        try {
          await page.goto(data.url, { 
            waitUntil: 'domcontentloaded',
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
        return page.title();
      });
      newProject.title = title;
    } catch (error) {
      console.error('Error accessing website:', error);
      newProject.title = '';
    }

    // Screenshot logic (local, as requested)
    try {
      await generateScreenshot({ id: projectId, url: data.url });
      newProject.screenshotLocked = true;
    } catch (screenshotError) {
      console.error('Error generating screenshot:', screenshotError);
      newProject.screenshotLocked = false;
    }

    // Insert new project into Supabase
    const { data: inserted, error } = await supabase.from('projects').insert([projectToDb(newProject)]).select('*').single();
    if (error) {
      console.error('Error writing project to Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to write project to Supabase' },
        { status: 500 }
      );
    }

    // Return camelCase project
    return NextResponse.json(projectFromDb(inserted), { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
