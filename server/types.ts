// ----------------------------------------------------
// ROW TYPES (SQL -> API objects)
// ----------------------------------------------------

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface ResetRow {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  used: number;
}

export interface SkillRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color: string;
  goal_type: string | null;
  target_hours: number;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  skill_id: string;
  duration_minutes: number;
  date: string;
  notes: string | null;
  tags: string | null;
  created_at: string;
}

// ----------------------------------------------------
// API SHAPES (returned to the client)
// ----------------------------------------------------

export interface SkillGoal {
  type: 'total' | 'weekly';
  targetHours: number;
}

export interface Skill {
  id: string;
  name: string;
  color: string;
  goal: SkillGoal | null;
  createdAt: string;
  userId: string;
}

export interface Session {
  id: string;
  skillId: string;
  durationMinutes: number;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
  userId: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  isGuest: false;
  joinedAt: string;
}
