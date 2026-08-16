import { getDb } from '../db.js';
import type { SkillRow } from '../types.js';

export async function listSkillsByUser(userId: string): Promise<SkillRow[]> {
  const db = await getDb();
  return db.all<SkillRow>(
    'SELECT * FROM skills WHERE user_id = ? ORDER BY created_at ASC',
    userId,
  );
}

export async function findSkillByIdAndUser(
  id: string,
  userId: string,
): Promise<SkillRow | null> {
  const db = await getDb();
  return db.get<SkillRow>('SELECT * FROM skills WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function findSkillOwnerById(id: string): Promise<Pick<SkillRow, 'user_id'> | null> {
  const db = await getDb();
  return db.get<Pick<SkillRow, 'user_id'>>('SELECT user_id FROM skills WHERE id = ?', id);
}

export async function insertSkill(skill: {
  id: string;
  userId: string;
  name: string;
  category: string;
  color: string;
  goalType: string | null;
  targetHours: number;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.run(
    'INSERT INTO skills (id, user_id, name, category, color, goal_type, target_hours, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      skill.id,
      skill.userId,
      skill.name,
      skill.category,
      skill.color,
      skill.goalType,
      skill.targetHours,
      skill.icon,
      skill.createdAt,
      skill.updatedAt,
    ],
  );
}

export async function updateSkillFields(skill: {
  id: string;
  userId: string;
  name: string;
  color: string;
  goalType: string | null;
  targetHours: number;
  updatedAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.run(
    'UPDATE skills SET name = ?, color = ?, goal_type = ?, target_hours = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    [skill.name, skill.color, skill.goalType, skill.targetHours, skill.updatedAt, skill.id, skill.userId],
  );
}

export async function deleteSkill(id: string, userId: string): Promise<{ changes: number }> {
  const db = await getDb();
  return db.run('DELETE FROM skills WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function deleteSkillSessions(skillId: string, userId: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM sessions WHERE skill_id = ? AND user_id = ?', [skillId, userId]);
}

export async function listOwnedSkillIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.all<Pick<SkillRow, 'id'>>('SELECT id FROM skills WHERE user_id = ?', userId);
  return rows.map((r) => r.id);
}

export async function upsertSkill(skill: {
  id: string;
  userId: string;
  name: string;
  category: string;
  color: string;
  goalType: string | null;
  targetHours: number;
  createdAt: string;
  updatedAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT OR REPLACE INTO skills (id, user_id, name, category, color, goal_type, target_hours, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      skill.id,
      skill.userId,
      skill.name,
      skill.category,
      skill.color,
      skill.goalType,
      skill.targetHours,
      skill.createdAt,
      skill.updatedAt,
    ],
  );
}
