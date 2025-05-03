import { NextResponse } from 'next/server';
import { generateSingleScreenshot } from '@/utils/screenshot';

interface Project {
  id: string;
  url: string;
}

export async function POST(request: Request) {
  try {
    const { projectId, url } = await request.json();

    if (!projectId || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await generateSingleScreenshot({ id: projectId, url });

    return NextResponse.json(
      { message: 'Screenshot generation started' },
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