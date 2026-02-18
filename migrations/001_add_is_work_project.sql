-- Add is_work_project column for projects made at previous employers (hidden section)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_work_project BOOLEAN NOT NULL DEFAULT false;
