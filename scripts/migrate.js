#!/usr/bin/env node
/**
 * Run database migrations.
 * Usage: node scripts/migrate.js
 * Requires: DATABASE_URL in .env
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const name = path.basename(file, '.sql');
      const { rows } = await pool.query(
        'SELECT 1 FROM _migrations WHERE name = $1',
        [name]
      );
      if (rows.length > 0) {
        console.log(`Skip ${name} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
      console.log(`Applied ${name}`);
    }

    console.log('Migrations complete.');
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
