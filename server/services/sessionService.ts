import crypto from 'crypto';
import type { Session, SessionRow } from '../types.js';
import { ServiceError } from './errors.js';
import {
  deleteSession,
  findSessionByIdAndUser,
  insertSession,
  listSessionsByUser,
  updateSessionFields,
} from '../repos/sessionRepo.js';
import { findSkillByIdAndUser } from '../repos/skillRepo.js';

export interface SessionInput {
  skillId: string;
  durationMinutes: number;
  date: string;
  notes?: string | null;
}

function toSession(r: SessionRow): Session {
  return {
    id: r.id,
    skillId: r.skill_id,
    durationMinutes: r.duration_minutes,
    date: r.date,
    notes: r.notes,
    createdAt: r.created_at,
    userId: r.user_id,
  };
}

async function assertSkillOwned(skillId: string, userId: string): Promise<void> {
  const skill = await findSkillByIdAndUser(skillId, userId);
  if (!skill) {
    throw new ServiceError(400, 'Selected skill does not exist or belong to this user');
  }
}

export async function getSessions(userId: string): Promise<{ sessions: Session[] }> {
  const rows = await listSessionsByUser(userId);
  return { sessions: rows.map(toSession) };
}

export async function createSession(
  userId: string,
  input: SessionInput,
): Promise<{ session: Session }> {
  await assertSkillOwned(input.skillId, userId);

  const sessionId = 'session_' + crypto.randomUUID();
  const now = new Date().toISOString();

  await insertSession({
    id: sessionId,
    userId,
    skillId: input.skillId,
    durationMinutes: input.durationMinutes,
    date: input.date,
    notes: input.notes || null,
    createdAt: now,
  });

  return {
    session: {
      id: sessionId,
      skillId: input.skillId,
      durationMinutes: input.durationMinutes,
      date: input.date,
      notes: input.notes || null,
      createdAt: now,
      userId,
    },
  };
}

export async function updateSession(
  userId: string,
  id: string,
  input: Partial<SessionInput>,
): Promise<{ session: Session }> {
  const session = await findSessionByIdAndUser(id, userId);
  if (!session) {
    throw new ServiceError(404, 'Session not found');
  }

  // Validate skill ownership when changing skill
  const newSkillId = input.skillId ?? session.skill_id;
  await assertSkillOwned(newSkillId, userId);

  const now = new Date().toISOString();
  const durationMinutes =
    input.durationMinutes !== undefined ? input.durationMinutes : session.duration_minutes;
  const notes = input.notes !== undefined ? input.notes : session.notes;

  await updateSessionFields({
    id,
    userId,
    skillId: newSkillId,
    durationMinutes,
    date: input.date ?? session.date,
    notes,
    updatedAt: now,
  });

  return {
    session: {
      id,
      skillId: newSkillId,
      durationMinutes,
      date: input.date ?? session.date,
      notes,
      createdAt: session.created_at,
      updatedAt: now,
      userId,
    },
  };
}

export async function deleteSessionForUser(
  userId: string,
  id: string,
): Promise<{ message: string; id: string }> {
  const result = await deleteSession(id, userId);
  if (result.changes === 0) {
    throw new ServiceError(404, 'Session not found');
  }
  return { message: 'Session deleted successfully', id };
}
