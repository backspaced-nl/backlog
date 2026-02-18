import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { reorderProjects } from '@/utils/db';

export async function PUT(request: Request) {
  const isAuthenticated = (await cookies()).get('admin_auth')?.value === 'true';
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
