import pg from 'pg';
import { newDb, IMemoryDb } from 'pg-mem';
import dotenv from 'dotenv';

dotenv.config();

export interface DbStatus {
  mode: 'supabase_postgres' | 'local_postgres_emulator';
  connected: boolean;
  type: string;
  host?: string;
  database?: string;
  latencyMs?: number;
  lastChecked: string;
  error?: string;
}

interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

let pgPool: pg.Pool | null = null;
let memDb: IMemoryDb | null = null;
let memAdapter: any = null;
let activeMode: 'supabase_postgres' | 'local_postgres_emulator' = 'local_postgres_emulator';
let connectionError: string | undefined = undefined;

export async function initDb(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL?.trim();

  if (dbUrl && dbUrl.length > 0) {
    if (dbUrl.startsWith('http://') || dbUrl.startsWith('https://')) {
      console.warn('[DB] Notice: DATABASE_URL is set to an HTTP(S) URL (' + dbUrl + '). Supabase PostgreSQL requires a postgresql:// connection URI (e.g. postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres). Falling back to local PostgreSQL engine.');
      connectionError = 'DATABASE_URL is set to an HTTP URL. Use a postgresql:// URI from Supabase Settings > Database.';
    } else {
      try {
        console.log('[DB] Connecting to Supabase PostgreSQL at:', dbUrl.replace(/:[^:@]+@/, ':***@'));
        const pool = new pg.Pool({
          connectionString: dbUrl,
          ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        // Test connection
        const client = await pool.connect();
        await client.query('SELECT 1 as connected');
        client.release();

        pgPool = pool;
        activeMode = 'supabase_postgres';
        connectionError = undefined;
        console.log('[DB] Successfully connected to live Supabase PostgreSQL database.');
        return;
      } catch (err: any) {
        console.warn('[DB] Failed to connect to live DATABASE_URL:', err.message);
        connectionError = err.message;
        console.log('[DB] Falling back to high-fidelity in-memory PostgreSQL engine for local development.');
      }
    }
  } else {
    console.log('[DB] No DATABASE_URL configured in backend/.env.');
    console.log('[DB] Starting high-fidelity in-memory PostgreSQL engine (pg-mem) with standard PostgreSQL syntax.');
  }

  // Initialize in-memory postgres emulator
  memDb = newDb();
  
  // Register common Postgres functions that pg-mem might need
  memDb.public.registerFunction({
    name: 'gen_random_uuid',
    implementation: () => crypto.randomUUID(),
  });

  memDb.public.registerFunction({
    name: 'now',
    implementation: () => new Date(),
  });

  memDb.public.registerFunction({
    name: 'current_timestamp',
    implementation: () => new Date(),
  });

  memAdapter = memDb.adapters.createPg();
  pgPool = new memAdapter.Pool();
  activeMode = 'local_postgres_emulator';
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  if (!pgPool) {
    await initDb();
  }

  const start = Date.now();
  try {
    const res = await pgPool!.query(sql, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount ?? res.rows.length,
    };
  } catch (err: any) {
    console.error(`[DB Query Error] Query failed: ${sql.substring(0, 100)}...`, err.message);
    throw err;
  }
}

export async function getClient() {
  if (!pgPool) {
    await initDb();
  }
  return await pgPool!.connect();
}

export async function checkDbHealth(): Promise<DbStatus> {
  const start = Date.now();
  try {
    if (!pgPool) {
      await initDb();
    }
    await query('SELECT 1 as health');
    const latency = Date.now() - start;

    return {
      mode: activeMode,
      connected: true,
      type: activeMode === 'supabase_postgres' ? 'Supabase PostgreSQL (Cloud)' : 'PostgreSQL Engine (pg-mem Local)',
      host: activeMode === 'supabase_postgres' ? (process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'supabase.co') : 'localhost:memory',
      database: activeMode === 'supabase_postgres' ? 'postgres' : 'nexus_dev',
      latencyMs: latency,
      lastChecked: new Date().toISOString(),
      error: connectionError,
    };
  } catch (err: any) {
    return {
      mode: activeMode,
      connected: false,
      type: 'PostgreSQL Error',
      latencyMs: -1,
      lastChecked: new Date().toISOString(),
      error: err.message,
    };
  }
}

export function getActiveDbMode() {
  return activeMode;
}
