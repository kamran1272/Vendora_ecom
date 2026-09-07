const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = 'E:/Projects 2026/Vendora_ecommerce/apps/api';
const dbPath = path.join(root, 'data', 'dev.sqlite');
try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); } catch (error) {}
const result = spawnSync('npx', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'], {
  cwd: root,
  shell: true,
  encoding: 'utf8'
});
const out = {
  code: result.status,
  signal: result.signal,
  stdout: result.stdout || '',
  stderr: result.stderr || '',
  dbExists: fs.existsSync(dbPath)
};
fs.writeFileSync(path.join(root, 'migration_check.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
