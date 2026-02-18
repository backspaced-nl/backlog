-- Add is_private column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
