import { getDb } from '../db.js';
import type { SessionRow } from '../types.js';

export async function listSessionsByUser(userId: string): Promise<SessionRow[]> {
  const db = await getDb();
  return db.all<SessionRow>(
    'SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    userId,
  );
}

export async function findSessionByIdAndUser(
  id: string,
  userId: string,
): Promise<SessionRow | null> {
  const db = await getDb();
  return db.get<SessionRow>('SELECT * FROM sessions WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function findSessionOwnerById(id: string): Promise<Pick<SessionRow, 'user_id'> | null> {
  const db = await getDb();
  return db.get<Pick<SessionRow, 'user_id'>>('SELECT user_id FROM sessions WHERE id = ?', id);
}

export async function insertSession(session: {
  id: string;
  userId: string;
  skillId: string;
  durationMinutes: number;
  date: string;
  notes: string | null;
  createdAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.run(
    'INSERT INTO sessions (id, user_id, skill_id, duration_minutes, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [session.id, session.userId, session.skillId, session.durationMinutes, session.date, session.notes, session.createdAt],
  );
}

export async function updateSessionFields(session: {
  id: string;
  userId: string;
  skillId: string;
  durationMinutes: number;
  date: string;
  notes: string | null;
  updatedAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.run(
    `UPDATE sessions SET skill_id = ?, duration_minutes = ?, date = ?, notes = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    [
      session.skillId,
      session.durationMinutes,
      session.date,
      session.notes,
      session.updatedAt,
      session.id,
      session.userId,
    ],
  );
}

export async function deleteSession(
  id: string,
  userId: string,
): Promise<{ changes: number }> {
  const db = await getDb();
  return db.run('DELETE FROM sessions WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function upsertSession(session: {
  id: string;
  userId: string;
  skillId: string;
  durationMinutes: number;
  date: string;
  notes: string | null;
  createdAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT OR REPLACE INTO sessions (id, user_id, skill_id, duration_minutes, date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [session.id, session.userId, session.skillId, session.durationMinutes, session.date, session.notes, session.createdAt],
  );
}
