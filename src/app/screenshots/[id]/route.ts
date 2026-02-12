import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { getScreenshotPath } from '@/utils/storage';

/** Serves screenshot from storage path (same as API write path). Use this when files live outside public/ or have permission issues. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const rawId = (await context.params).id;
  const projectId = rawId?.endsWith('.jpg') ? rawId.slice(0, -4) : rawId;
  if (!projectId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const filePath = getScreenshotPath(projectId);
    const buffer = await fs.readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') return new NextResponse(null, { status: 404 });
    if (e.code === 'EACCES') return new NextResponse(null, { status: 403 });
    throw err;
  }
}
