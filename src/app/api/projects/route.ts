import { NextResponse } from 'next/server';
import { supabase, projectFromDb, projectToDb } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Map all projects to camelCase
  const projects = (data || []).map(projectFromDb);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const body = await request.json();
  const newProject = {
    id: uuidv4(),
    title: body.title || '',
    url: body.url,
    completionDate: body.completionDate || '',
    tags: body.tags || [],
    partner: body.partner || '',
    screenshotLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabase.from('projects').insert([projectToDb(newProject)]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(newProject, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updateData } = body;

  // Compose update object in camelCase, then map
  const mappedData = projectToDb({
    id,
    ...updateData,
    updatedAt: new Date().toISOString(),
  });

  const { error } = await supabase
    .from('projects')
    .update(mappedData)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 