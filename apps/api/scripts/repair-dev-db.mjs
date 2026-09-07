import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const schemaPath = path.join(root, 'prisma', 'schema.prisma');
const dbPath = path.join(root, 'data', 'dev.sqlite');

try {
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
    console.log('Removed stale SQLite database:', dbPath);
  }

  execSync(`npx prisma db push --schema "${schemaPath}" --accept-data-loss --force-reset`, {
    stdio: 'inherit',
    cwd: root,
  });
  console.log('Prisma schema synchronized at', schemaPath);
} catch (error) {
  console.error('Database repair failed:', error);
  process.exit(1);
}
