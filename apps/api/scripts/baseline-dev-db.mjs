import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';

const root = path.resolve(process.cwd());
const migrationsPath = path.join(root, 'prisma', 'migrations');
const dbPath = path.join(root, 'data', 'dev.sqlite');

const migrations = fs.readdirSync(migrationsPath, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const db = new sqlite3.Database(dbPath);
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function onRun(error) {
    if (error) reject(error);
    else resolve(this);
  });
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (error, rows) => {
    if (error) reject(error);
    else resolve(rows);
  });
});

try {
  await run('PRAGMA busy_timeout = 10000');
  await run(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )`);

  const applied = new Set((await all('SELECT migration_name FROM "_prisma_migrations"')).map((row) => row.migration_name));
  for (const migrationName of migrations) {
    if (applied.has(migrationName)) continue;
    const migrationFile = path.join(migrationsPath, migrationName, 'migration.sql');
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(migrationFile)).digest('hex');
    const id = crypto.randomUUID();
    await run(
      'INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, 0)',
      [id, checksum, migrationName],
    );
    console.log(`Baselined ${migrationName}`);
  }
} finally {
  db.close();
}
