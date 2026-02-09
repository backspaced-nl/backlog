import { Pool } from 'pg';
import type { Project } from '@/types/project';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

export async function getProjects() {
  const { rows } = await pool.query<ProjectDb>(
    `SELECT * FROM projects ORDER BY created_at DESC`
  );
  return rows;
}

export async function getProjectById(id: string) {
  const { rows } = await pool.query<ProjectDb>(
    `SELECT * FROM projects WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createProject(row: ProjectDb) {
  const { rows } = await pool.query<ProjectDb>(
    `INSERT INTO projects (id, title, url, tags, partner, completion_date, screenshot_locked, screenshot_error, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      row.id,
      row.title ?? '',
      row.url,
      row.tags ?? [],
      row.partner ?? '',
      row.completion_date ?? '',
      row.screenshot_locked ?? false,
      row.screenshot_error ?? null,
      row.created_at ?? new Date().toISOString(),
      row.updated_at ?? new Date().toISOString(),
    ]
  );
  return rows[0];
}

export async function updateProject(id: string, data: Partial<ProjectDb>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  const allowed = ['title', 'url', 'tags', 'partner', 'completion_date', 'screenshot_locked', 'screenshot_error', 'updated_at'];
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k) && v !== undefined) {
      fields.push(`${k} = $${i++}`);
      values.push(v);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  await pool.query(
    `UPDATE projects SET ${fields.join(', ')} WHERE id = $${i}`,
    values
  );
}

export async function deleteProject(id: string) {
  await pool.query(`DELETE FROM projects WHERE id = $1`, [id]);
}
