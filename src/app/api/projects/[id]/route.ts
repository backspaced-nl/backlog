import { NextResponse } from "next/server";
import { supabase, projectFromDb } from "@/utils/supabase";
import { getScreenshotUrl } from "@/utils/screenshot";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const project = projectFromDb(data);

  return NextResponse.json({
    project: project
      ? { ...project, screenshotUrl: getScreenshotUrl(project.id) }
      : project,
  });
}
