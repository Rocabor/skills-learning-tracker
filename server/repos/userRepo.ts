import { getDb } from '../db.js';
import type { UserRow } from '../types.js';

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const db = await getDb();
  return db.get<UserRow>('SELECT * FROM users WHERE email = ?', email);
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const db = await getDb();
  return db.get<UserRow>('SELECT * FROM users WHERE id = ?', id);
}

export type UserProfileRow = Pick<UserRow, 'id' | 'email' | 'name' | 'created_at'>;

export async function findUserProfileById(id: string): Promise<UserProfileRow | null> {
  const db = await getDb();
  return db.get<UserProfileRow>(
    'SELECT id, email, name, created_at FROM users WHERE id = ?',
    id,
  );
}

export async function insertUser(user: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.run(
    'INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [user.id, user.email, user.name, user.passwordHash, user.createdAt, user.updatedAt],
  );
}

export async function updateUserPassword(
  id: string,
  passwordHash: string,
  updatedAt: string,
): Promise<void> {
  const db = await getDb();
  await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [
    passwordHash,
    updatedAt,
    id,
  ]);
}

export async function listRecentProfiles(limit = 8): Promise<{ email: string; name: string }[]> {
  const db = await getDb();
  return db.all<{ email: string; name: string }>(
    'SELECT email, name FROM users ORDER BY updated_at DESC LIMIT ?',
    limit,
  );
}
