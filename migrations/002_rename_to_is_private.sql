-- Rename is_work_project to is_private (generic naming)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_work_project') THEN
    ALTER TABLE projects RENAME COLUMN is_work_project TO is_private;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_private') THEN
    ALTER TABLE projects ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
