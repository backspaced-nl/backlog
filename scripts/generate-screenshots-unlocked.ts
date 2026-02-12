/**
 * Generate screenshots for all projects where screenshot_locked is false,
 * then set screenshot_locked = true for each successful run.
 * Load .env before running (or set DATABASE_URL).
 */
import 'dotenv/config';
import { getProjects, updateProject, projectFromDb } from '../src/utils/db';
import { generateScreenshot } from '../src/utils/screenshot';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set. Add it to .env or the environment.');
    process.exit(1);
  }

  const rows = await getProjects();
  const updateAll = process.env.UPDATE_ALL === '1';
  const toProcess = updateAll ? rows : rows.filter((r) => r.screenshot_locked !== true);

  if (toProcess.length === 0) {
    console.log(updateAll ? 'No projects found.' : 'No unlocked projects. Nothing to do.');
    return;
  }

  console.log(
    `Found ${toProcess.length} project(s) to process.${updateAll ? ' (--all: updating every project)' : ''}`
  );

  for (const row of toProcess) {
    const project = projectFromDb(row);
    if (!project?.url) {
      console.warn(`Skipping project ${row.id}: no URL`);
      continue;
    }
    try {
      await generateScreenshot(project);
      await updateProject(project.id, {
        screenshot_locked: true,
        screenshot_error: null,
        updated_at: new Date().toISOString(),
      });
      console.log(`  ✓ ${project.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await updateProject(project.id, {
        screenshot_error: msg,
        updated_at: new Date().toISOString(),
      });
      console.error(`  ✗ ${project.id}: ${msg}`);
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
