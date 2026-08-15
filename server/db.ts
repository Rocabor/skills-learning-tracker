import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

type SqlParam = number | string | Uint8Array | null;
type SqlParams = SqlParam[] | SqlParam | null;

/** libSQL expects an array for positional binds; wrap scalars so callers can pass either. */
function normalizeParams(params: SqlParams | undefined): SqlParam[] | undefined {
  if (params === null || params === undefined) return undefined;
  return Array.isArray(params) ? params : [params];
}

export interface SqlDatabase {
  get<T = Record<string, unknown>>(sql: string, params?: SqlParams): Promise<T | null>;
  all<T = Record<string, unknown>>(sql: string, params?: SqlParams): Promise<T[]>;
  run(sql: string, params?: SqlParams): Promise<{ changes: number }>;
}

let dbInstance: SqlDatabase | null = null;

export async function getDb(): Promise<SqlDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // Local development: file-based libSQL database (no Turso cloud needed).
  // Production (Vercel): TURSO_DATABASE_URL + TURSO_AUTH_TOKEN from env vars.
  const url = tursoUrl || `file:${path.join(process.cwd(), 'data', 'skilltrack.db')}`;
  if (url.startsWith('file:')) {
    const filePath = url.slice('file:'.length);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  const client = createClient({ url, authToken: tursoToken });

  const exec = (sql: string, args?: SqlParams) =>
    client.execute({
      sql,
      args: normalizeParams(args),
    });

  const tableColumns = async (table: string): Promise<string[]> => {
    const res = await exec(`PRAGMA table_info(${table})`);
    return res.rows.map((row) => String(row['name'] ?? ''));
  };

  // Create tables (email + password hash schema).
  // libSQL executes one statement per call, so each DDL runs separately.
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      color TEXT NOT NULL,
      target_hours INTEGER NOT NULL DEFAULT 50,
      icon TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_resets_user ON password_resets(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_skill ON sessions(skill_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date)`,
  ];
  for (const statement of schemaStatements) {
    await exec(statement);
  }

  // Migrate pre-email users table: drop and recreate with the new schema
  const userCols = await tableColumns('users');
  if (!userCols.includes('email')) {
    await exec('DROP TABLE IF EXISTS password_resets');
    await exec('DROP TABLE IF EXISTS users');
    await exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  // Migrate older databases: add updated_at to sessions if missing
  const sessionCols = await tableColumns('sessions');
  if (!sessionCols.includes('updated_at')) {
    await exec('ALTER TABLE sessions ADD COLUMN updated_at TEXT');
    await exec('UPDATE sessions SET updated_at = created_at WHERE updated_at IS NULL');
  }

  dbInstance = {
    async get<T = Record<string, unknown>>(sql: string, params: SqlParams = null) {
      const res = await exec(sql, params);
      const row = res.rows[0];
      return (row as T | undefined) ?? null;
    },

    async all<T = Record<string, unknown>>(sql: string, params: SqlParams = null) {
      const res = await exec(sql, params);
      return res.rows as T[];
    },

    async run(sql: string, params: SqlParams = null) {
      const res = await exec(sql, params);
      return { changes: res.rowsAffected };
    },
  };

  return dbInstance;
}
