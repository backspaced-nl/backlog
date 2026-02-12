import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { getScreenshotPath } from '@/utils/storage';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const filePath = getScreenshotPath(id);
    const buffer = await fs.readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') {
      return new NextResponse(null, { status: 404 });
    }
    throw err;
  }
}
