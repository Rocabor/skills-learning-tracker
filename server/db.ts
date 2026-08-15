import initSqlJs, { type Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

type SqlParam = number | string | Uint8Array | null;
type SqlParams = SqlParam[] | Record<string, SqlParam> | null;

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
      // Check if users table needs migration
      const checkStmt = rawDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      if (checkStmt.step()) {
        checkStmt.free();
        // Check columns
        const colStmt = rawDb.prepare('PRAGMA table_info(users)');
        let hasUsername = false;
        while (colStmt.step()) {
          const col = colStmt.getAsObject();
          if (col.name === 'username') hasUsername = true;
        }
        colStmt.free();

        if (!hasUsername) {
          // Drop old tables to migrate to username + PIN schema cleanly
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

  // Create tables with username and PIN hash
  rawDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
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
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_skill ON sessions(skill_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
  `);
  persist();

  // Helper mapping
  dbInstance = {
    async get<T = Record<string, unknown>>(sql: string, params: SqlParams = null) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(params);
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
      stmt.bind(params);
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return results;
    },

    async run(sql: string, params: SqlParams = null) {
      rawDb.run(sql, params ?? undefined);
      const changes = rawDb.getRowsModified();
      persist();
      return { changes };
    },
  };

  return dbInstance;
}
