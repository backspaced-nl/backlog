-- Run against existing deployments to add position column.
-- New deployments use schema.sql which already includes position.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS position INTEGER;

UPDATE projects SET position = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
  FROM projects
) sub
WHERE projects.id = sub.id;

CREATE INDEX IF NOT EXISTS idx_projects_position ON projects (position);
