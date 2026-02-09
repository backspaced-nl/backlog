import { NextResponse } from 'next/server';
import { getProjectById, projectFromDb } from '@/utils/db';
import { screenshotExists } from '@/utils/storage';
import { getScreenshotUrl } from '@/utils/screenshot';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    );
  }

  const data = await getProjectById(id);
  if (!data) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const project = projectFromDb(data);
  const hasScreenshot = project ? await screenshotExists(project.id) : false;
  return NextResponse.json({
    project: project
      ? { ...project, ...(hasScreenshot && { screenshotUrl: getScreenshotUrl(project.id) }) }
      : project,
  });
}
