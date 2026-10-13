import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, initDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<string[]> {
  await initDb();

  // Create migrations table if not exists
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedResult = await query<{ version: string }>(
    'SELECT version FROM schema_migrations'
  );
  const applied = new Set(appliedResult.rows.map(r => r.version));

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.warn(`[Migrator] Migrations directory not found at ${migrationsDir}`);
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const executed: string[] = [];

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    console.log(`[Migrator] Applying migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, 'utf-8');

    // Split SQL by statements or execute clean block
    try {
      // In PostgreSQL, multiple statements can be passed together or executed
      await query(sqlContent);
      await query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
      executed.push(file);
      console.log(`[Migrator] Successfully applied: ${file}`);
    } catch (err: any) {
      console.error(`[Migrator] Migration ${file} failed:`, err.message);
      throw new Error(`Migration ${file} failed: ${err.message}`);
    }
  }

  if (executed.length === 0) {
    console.log('[Migrator] All database migrations are up to date.');
  }

  return executed;
}

// Allow direct CLI execution: node/tsx src/db/migrator.ts
if (process.argv[1] && process.argv[1].includes('migrator')) {
  runMigrations()
    .then(applied => {
      console.log(`[Migrator CLI] Completed. Applied ${applied.length} migrations.`);
      process.exit(0);
    })
    .catch(err => {
      console.error('[Migrator CLI] Failed:', err);
      process.exit(1);
    });
}
