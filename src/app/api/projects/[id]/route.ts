import { NextResponse } from 'next/server';
import { supabase, projectFromDb } from '@/utils/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json({ project: projectFromDb(data) });
} 