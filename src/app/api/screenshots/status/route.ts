import { NextResponse } from 'next/server';
import { getJobStatus } from '@/utils/screenshot';
import { promises as fs } from 'fs';
import path from 'path';

const jobsFilePath = path.join(process.cwd(), 'src/data/screenshot-jobs.json');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    // If jobId is provided, return specific job status
    if (jobId) {
      const status = await getJobStatus(jobId);
      if (!status) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(status);
    }

    // Otherwise, return all jobs
    try {
      const content = await fs.readFile(jobsFilePath, 'utf8');
      const data = JSON.parse(content);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ jobs: {} });
    }
  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
} 