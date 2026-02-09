import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { saveScreenshot } from '@/utils/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const processedImage = await sharp(buffer)
      .resize(600, 800, {
        fit: 'cover',
        position: 'top',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    await saveScreenshot(projectId, processedImage);

    return NextResponse.json(
      { message: 'Screenshot uploaded successfully' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to upload screenshot' },
      { status: 500 }
    );
  }
} 