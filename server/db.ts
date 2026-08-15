import initSqlJs, { type Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

type SqlParam = number | string | Uint8Array | null;
type SqlParams = SqlParam[] | SqlParam | null;

/** sql.js expects an array for positional binds; wrap scalars so callers can pass either. */
function normalizeParams(params: SqlParams): SqlParam[] | undefined {
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

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'skilltrack.sqlite');
  const SQL = await initSqlJs();

  let rawDb: Database;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    try {
      rawDb = new SQL.Database(fileBuffer);
      // Check if users table needs migration to email + password schema
      const checkStmt = rawDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      if (checkStmt.step()) {
        checkStmt.free();
        // Check columns
        const colStmt = rawDb.prepare('PRAGMA table_info(users)');
        let hasEmail = false;
        while (colStmt.step()) {
          const col = colStmt.getAsObject();
          if (col.name === 'email') hasEmail = true;
        }
        colStmt.free();

        if (!hasEmail) {
          // Drop old tables to migrate to email + password schema cleanly
          rawDb.run('DROP TABLE IF EXISTS password_resets');
          rawDb.run('DROP TABLE IF EXISTS users');
        }
      } else {
        checkStmt.free();
      }
    } catch {
      rawDb = new SQL.Database();
    }
  } else {
    rawDb = new SQL.Database();
  }

  const persist = () => {
    try {
      const data = rawDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.error('Failed to persist sqlite to disk:', e);
    }
  };

  // Create tables with email + password hash
  rawDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      color TEXT NOT NULL,
      target_hours INTEGER NOT NULL DEFAULT 50,
      icon TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_resets_user ON password_resets(user_id);
    CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_skill ON sessions(skill_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
  `);
  persist();

  // Migrate older databases: add updated_at to sessions if missing
  const sessionsColStmt = rawDb.prepare('PRAGMA table_info(sessions)');
  let hasUpdatedAt = false;
  while (sessionsColStmt.step()) {
    const col = sessionsColStmt.getAsObject();
    if (col.name === 'updated_at') hasUpdatedAt = true;
  }
  sessionsColStmt.free();
  if (!hasUpdatedAt) {
    rawDb.run('ALTER TABLE sessions ADD COLUMN updated_at TEXT');
    rawDb.run("UPDATE sessions SET updated_at = created_at WHERE updated_at IS NULL");
    persist();
  }

  // Helper mapping
  dbInstance = {
    async get<T = Record<string, unknown>>(sql: string, params: SqlParams = null) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(normalizeParams(params) ?? null);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row as T | null;
      }
      stmt.free();
      return null;
    },

    async all<T = Record<string, unknown>>(sql: string, params: SqlParams = null) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(normalizeParams(params) ?? null);
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return results;
    },

    async run(sql: string, params: SqlParams = null) {
      rawDb.run(sql, normalizeParams(params));
      const changes = rawDb.getRowsModified();
      persist();
      return { changes };
    },
  };

  return dbInstance;
}
