-- Rename is_work_project to is_private (generic naming)
-- Handles: (1) only is_work_project exists, (2) only is_private missing, (3) both exist (duplicate migrations)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_work_project')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_private') THEN
    ALTER TABLE projects RENAME COLUMN is_work_project TO is_private;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_work_project')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_private') THEN
    -- Both columns exist: sync data from is_work_project, then drop it
    UPDATE projects SET is_private = is_work_project WHERE is_private IS DISTINCT FROM is_work_project;
    ALTER TABLE projects DROP COLUMN is_work_project;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_private') THEN
    ALTER TABLE projects ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
