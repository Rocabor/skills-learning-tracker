// Client API service communicating with our fullstack Express/Node.js + SQLite backend

import type { Skill, Session, User, AIInsights } from '../types';

const TOKEN_KEY = 'skilltrack_v1_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ---------------- AUTH (Username + 4-Digit PIN) ----------------
export async function apiRegister(
  username: string,
  pin: string,
  name?: string,
): Promise<{ user: User; token: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pin, name: name || username }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  setAuthToken(data.token);
  return data;
}

export async function apiLogin(username: string, pin: string): Promise<{ user: User; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pin }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid credentials');
  }

  setAuthToken(data.token);
  return data;
}

export async function apiGetProfiles(): Promise<{ username: string; name: string }[]> {
  try {
    const res = await fetch('/api/auth/profiles');
    const data = await res.json();
    return data.profiles || [];
  } catch {
    return [];
  }
}

export async function apiGetMe(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      setAuthToken(null);
      return null;
    }

    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

// ---------------- SKILLS ----------------
export async function apiGetSkills(): Promise<Skill[]> {
  const res = await fetch('/api/skills', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch skills from database');
  }

  const data = await res.json();
  return data.skills || [];
}

export async function apiCreateSkill(skillData: Omit<Skill, 'id' | 'createdAt'>): Promise<Skill> {
  const res = await fetch('/api/skills', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(skillData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create skill in database');
  }

  const data = await res.json();
  return data.skill;
}

export async function apiUpdateSkill(id: string, updates: Partial<Skill>): Promise<Skill> {
  const res = await fetch(`/api/skills/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update skill in database');
  }

  const data = await res.json();
  return data.skill;
}

export async function apiDeleteSkill(id: string): Promise<void> {
  const res = await fetch(`/api/skills/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete skill from database');
  }
}

// ---------------- SESSIONS ----------------
export async function apiGetSessions(): Promise<Session[]> {
  const res = await fetch('/api/sessions', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch sessions from database');
  }

  const data = await res.json();
  return data.sessions || [];
}

export async function apiCreateSession(
  sessionData: Omit<Session, 'id' | 'createdAt'>,
): Promise<Session> {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(sessionData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create session in database');
  }

  const data = await res.json();
  return data.session;
}

export async function apiDeleteSession(id: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete session from database');
  }
}

// ---------------- BATCH SYNC ----------------
export async function apiSyncBatch(skills: Skill[], sessions: Session[]): Promise<void> {
  const res = await fetch('/api/sync/batch', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ skills, sessions }),
  });

  if (!res.ok) {
    throw new Error('Failed to sync local data with database');
  }
}

// ---------------- AI INSIGHTS ----------------
export async function apiGetInsights(): Promise<AIInsights | null> {
  const res = await fetch('/api/ai/insights', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.insights || null;
}
