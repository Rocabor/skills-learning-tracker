import crypto from 'crypto';
import type { SkillGoal } from '../types.js';
import { ServiceError } from './errors.js';
import {
  findSkillOwnerById,
  listOwnedSkillIds,
  upsertSkill,
} from '../repos/skillRepo.js';
import { findSessionOwnerById, upsertSession } from '../repos/sessionRepo.js';

interface SyncSkill {
  id?: string;
  name: string;
  color?: string;
  goal?: SkillGoal | null;
  createdAt?: string;
}

interface SyncSession {
  id?: string;
  skillId: string;
  durationMinutes: number;
  date: string;
  notes?: string | null;
  createdAt?: string;
}

export interface BatchSyncInput {
  skills?: SyncSkill[];
  sessions?: SyncSession[];
}

export async function batchSync(
  userId: string,
  input: BatchSyncInput,
): Promise<{ success: true; message: string }> {
  const { skills, sessions } = input;
  const now = new Date().toISOString();
  const ownedSkillIds = new Set<string>();

  if (skills && skills.length > 0) {
    // Refuse to overwrite records owned by another user via REPLACE
    for (const s of skills) {
      if (!s.id) continue;
      const existing = await findSkillOwnerById(s.id);
      if (existing && existing.user_id !== userId) {
        throw new ServiceError(
          403,
          `Skill "${s.name}" belongs to another user and cannot be overwritten`,
        );
      }
    }

    for (const s of skills) {
      const goalType = s.goal?.type ?? null;
      const targetHours = s.goal?.targetHours ?? 0;
      const skillId = s.id || 'skill_' + crypto.randomUUID();
      ownedSkillIds.add(skillId);
      await upsertSkill({
        id: skillId,
        userId,
        name: s.name,
        category: 'General',
        color: s.color || '#6366f1',
        goalType,
        targetHours,
        createdAt: s.createdAt || now,
        updatedAt: now,
      });
    }
  }

  if (sessions && sessions.length > 0) {
    // Resolve skill ownership: ids from this batch plus all skills this user
    // already owns, so sessions may reference any of them.
    const owned = await listOwnedSkillIds(userId);
    for (const id of owned) ownedSkillIds.add(id);

    // Verify each session references a skill owned by this user
    for (const sess of sessions) {
      if (!ownedSkillIds.has(sess.skillId)) {
        throw new ServiceError(
          400,
          'Session references a skill that does not exist or belongs to another user',
        );
      }
      if (sess.id) {
        const existing = await findSessionOwnerById(sess.id);
        if (existing && existing.user_id !== userId) {
          throw new ServiceError(
            403,
            'Session record belongs to another user and cannot be overwritten',
          );
        }
      }
    }

    for (const sess of sessions) {
      await upsertSession({
        id: sess.id || 'session_' + crypto.randomUUID(),
        userId,
        skillId: sess.skillId,
        durationMinutes: sess.durationMinutes,
        date: sess.date,
        notes: sess.notes || null,
        createdAt: sess.createdAt || now,
      });
    }
  }

  return { success: true, message: 'Data successfully synced with backend' };
}
