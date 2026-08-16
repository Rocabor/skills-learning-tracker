import { getDb } from '../db.js';
import type { ResetRow } from '../types.js';

export async function invalidateResetsForUser(userId: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM password_resets WHERE user_id = ?', userId);
}

export async function insertResetCode(reset: {
  id: string;
  userId: string;
  code: string;
  expiresAt: string;
  createdAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.run(
    'INSERT INTO password_resets (id, user_id, code, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    [reset.id, reset.userId, reset.code, reset.expiresAt, reset.createdAt],
  );
}

export async function findActiveResetByCode(
  userId: string,
  code: string,
): Promise<ResetRow | null> {
  const db = await getDb();
  return db.get<ResetRow>(
    'SELECT * FROM password_resets WHERE user_id = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1',
    [userId, code],
  );
}

export async function markResetUsed(id: string): Promise<void> {
  const db = await getDb();
  await db.run('UPDATE password_resets SET used = 1 WHERE id = ?', id);
}
