import { NextResponse } from 'next/server';
import { reorderProjects } from '@/utils/db';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.some((id: unknown) => typeof id !== 'string')) {
      return NextResponse.json(
        { error: 'ids must be an array of strings' },
        { status: 400 }
      );
    }

    await reorderProjects(ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
