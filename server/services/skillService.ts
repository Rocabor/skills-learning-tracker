import crypto from 'crypto';
import type { Skill, SkillGoal, SkillRow } from '../types.js';
import { ServiceError } from './errors.js';
import {
  deleteSkill,
  deleteSkillSessions,
  findSkillByIdAndUser,
  insertSkill,
  listSkillsByUser,
  updateSkillFields,
} from '../repos/skillRepo.js';

export interface SkillInput {
  name: string;
  color?: string;
  goal?: SkillGoal | null;
}

function toSkill(r: SkillRow): Skill {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    goal: r.goal_type ? { type: r.goal_type as 'total' | 'weekly', targetHours: r.target_hours } : null,
    createdAt: r.created_at,
    userId: r.user_id,
  };
}

export async function getSkills(userId: string): Promise<{ skills: Skill[] }> {
  const rows = await listSkillsByUser(userId);
  return { skills: rows.map(toSkill) };
}

export async function createSkill(userId: string, input: SkillInput): Promise<{ skill: Skill }> {
  const skillId = 'skill_' + crypto.randomUUID();
  const now = new Date().toISOString();
  const goalType = input.goal?.type ?? null;
  const targetHours = input.goal?.targetHours ?? 0;

  await insertSkill({
    id: skillId,
    userId,
    name: input.name,
    category: 'General',
    color: input.color || '#6366f1',
    goalType,
    targetHours,
    icon: null,
    createdAt: now,
    updatedAt: now,
  });

  return {
    skill: {
      id: skillId,
      name: input.name,
      color: input.color || '#6366f1',
      goal: goalType ? { type: goalType as 'total' | 'weekly', targetHours } : null,
      createdAt: now,
      userId,
    },
  };
}

export async function updateSkill(
  userId: string,
  id: string,
  input: Partial<SkillInput>,
): Promise<{ skill: Skill }> {
  const skill = await findSkillByIdAndUser(id, userId);
  if (!skill) {
    throw new ServiceError(404, 'Skill not found');
  }

  const now = new Date().toISOString();
  const goalType = input.goal === undefined ? skill.goal_type : (input.goal?.type ?? null);
  const targetHours = input.goal === undefined ? skill.target_hours : (input.goal?.targetHours ?? 0);

  await updateSkillFields({
    id,
    userId,
    name: input.name ?? skill.name,
    color: input.color || skill.color,
    goalType,
    targetHours,
    updatedAt: now,
  });

  return {
    skill: {
      id,
      name: input.name ?? skill.name,
      color: input.color || skill.color,
      goal: goalType ? { type: goalType as 'total' | 'weekly', targetHours } : null,
      createdAt: skill.created_at,
      userId,
    },
  };
}

export async function deleteSkillForUser(
  userId: string,
  id: string,
): Promise<{ message: string; id: string }> {
  // Delete sessions first (no ON DELETE CASCADE in this schema)
  await deleteSkillSessions(id, userId);
  const result = await deleteSkill(id, userId);

  if (result.changes === 0) {
    throw new ServiceError(404, 'Skill not found');
  }

  return { message: 'Skill deleted successfully', id };
}
