import { createClient } from "@supabase/supabase-js";
import type { Project } from "@/types/project";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  
export const supabase = createClient(supabaseUrl ?? '', supabaseKey);

// --- Mapping helpers ---

// DB type (snake_case)
export type ProjectDb = {
  id: string;
  title: string;
  url: string;
  tags: string[];
  partner?: string;
  completion_date?: string;
  screenshot_locked?: boolean;
  screenshot_error?: string | null;
  created_at?: string;
  updated_at?: string;
};

// snake_case to camelCase
export function projectFromDb(
  db: ProjectDb | null | undefined
): Project | null | undefined {
  if (!db) return db;
  return {
    id: db.id,
    title: db.title,
    url: db.url,
    tags: db.tags,
    partner: db.partner,
    completionDate: db.completion_date,
    screenshotLocked: db.screenshot_locked,
    screenshotError: db.screenshot_error,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// camelCase to snake_case
export function projectToDb(
  project: Project | null | undefined
): ProjectDb | null | undefined {
  if (!project) return project;
  return {
    id: project.id,
    title: project.title,
    url: project.url,
    tags: project.tags,
    partner: project.partner,
    completion_date: project.completionDate,
    screenshot_locked: project.screenshotLocked,
    screenshot_error: project.screenshotError,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}
