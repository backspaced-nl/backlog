-- Run this once against your PostgreSQL database (e.g. in Coolify).

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  partner TEXT NOT NULL DEFAULT '',
  completion_date TEXT NOT NULL DEFAULT '',
  screenshot_locked BOOLEAN NOT NULL DEFAULT false,
  screenshot_error TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  position INTEGER
);

-- Add is_private column if it doesn't exist (for existing databases)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_position ON projects (position);
