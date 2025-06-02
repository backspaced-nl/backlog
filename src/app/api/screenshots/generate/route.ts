import { NextResponse } from 'next/server';
import { generateScreenshot } from '@/utils/screenshot';

export async function POST(request: Request) {
  try {
    const { projectId, url } = await request.json();

    if (!projectId || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId and url are required' },
        { status: 400 }
      );
    }

    await generateScreenshot({ id: projectId, url, title: '', tags: [] });

    return NextResponse.json(
      { message: 'Screenshot generated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating screenshot:', error);
    return NextResponse.json(
      { error: 'Failed to generate screenshot' },
      { status: 500 }
    );
  }
} 