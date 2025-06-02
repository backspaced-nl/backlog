import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabase } from '@/utils/supabase';

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image with sharp
    const processedImage = await sharp(buffer)
      .resize(600, 800, {
        fit: 'cover',
        position: 'top'
      })
      .toBuffer();

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('screenshots')
      .upload(`${projectId}.jpg`, processedImage, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (error) {
      return NextResponse.json(
        { error: 'Failed to upload screenshot to Supabase' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Screenshot uploaded successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    return NextResponse.json(
      { error: 'Failed to upload screenshot' },
      { status: 500 }
    );
  }
} 