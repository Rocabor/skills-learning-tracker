import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { getDb } from './db.js';
import { generateToken, requireAuth } from './auth.js';
import type { AuthRequest } from './auth.js';

dotenv.config();

export const app = express();

app.use(express.json());

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----------------------------------------------------
// ZOD VALIDATION SCHEMAS (Server side)
// ----------------------------------------------------
const ServerRegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  name: z.string().trim().optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password cannot exceed 72 characters'),
});

const ServerLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password cannot exceed 72 characters'),
});

const ServerForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

const ServerResetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  code: z.string().regex(/^\d{6}$/, 'Reset code must be 6 digits'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(72, 'New password cannot exceed 72 characters'),
});

const serverToday = () => new Date().toISOString().slice(0, 10);

const ServerSkillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  goal: z
    .object({
      type: z.enum(['total', 'weekly']),
      targetHours: z.number().positive(),
    })
    .optional(),
});

const ServerSkillUpdateSchema = ServerSkillSchema.partial();

const ServerSessionBaseSchema = z.object({
  skillId: z.string().min(1, 'Skill is required'),
  durationMinutes: z.number().int().positive().max(1440),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().nullable().optional(),
});

const notInFuture = (d: { date?: string | undefined }) =>
  !d.date || d.date <= serverToday();

const ServerSessionSchema = ServerSessionBaseSchema.refine(notInFuture, {
  message: 'Date cannot be in the future',
  path: ['date'],
});

const ServerSessionUpdateSchema = ServerSessionBaseSchema.partial().refine(notInFuture, {
  message: 'Date cannot be in the future',
  path: ['date'],
});

// ----------------------------------------------------
// ROW TYPES (SQL -> API objects)
// ----------------------------------------------------
interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

interface ResetRow {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  used: number;
}

interface SkillRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color: string;
  target_hours: number;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

interface SessionRow {
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
// AUTHENTICATION ROUTES (Email + Password with bcrypt & JWT)
// ----------------------------------------------------

// Register with Email & Password
app.post('/api/auth/register', async (req, res) => {
  try {
    const parseResult = ServerRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid registration data',
      });
    }

    const { email, name, password } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();
    const displayName = name && name.trim() ? name.trim() : cleanEmail.split('@')[0];

    const db = await getDb();
    const existing = await db.get<UserRow>('SELECT id FROM users WHERE email = ?', cleanEmail);
    if (existing) {
      return res.status(400).json({ error: `An account with ${cleanEmail} already exists. Please sign in.` });
    }

    // Hash the password securely with bcrypt
    const salt = await bcrypt.genSalt(11);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'user_' + crypto.randomUUID();
    const now = new Date().toISOString();

    await db.run(
      'INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, cleanEmail, displayName, passwordHash, now, now],
    );

    const token = generateToken({ id: userId, email: cleanEmail, name: displayName });

    res.status(201).json({
      user: {
        id: userId,
        email: cleanEmail,
        name: displayName,
        isGuest: false,
        joinedAt: now,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login with Email & Password
app.post('/api/auth/login', async (req, res) => {
  try {
    const parseResult = ServerLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid email or password',
      });
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();
    const db = await getDb();
    const user = await db.get<UserRow>('SELECT * FROM users WHERE email = ?', cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'No account found with that email. Please create an account.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: false,
        joinedAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Request a password reset code
// No email/SMTP service is configured in this environment, so the 6-digit code is
// returned to the client (development mode). A production deploy would deliver it
// via email instead.
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const parseResult = ServerForgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid email',
      });
    }

    const cleanEmail = parseResult.data.email.trim().toLowerCase();
    const db = await getDb();
    const user = await db.get<UserRow>('SELECT id FROM users WHERE email = ?', cleanEmail);
    if (!user) {
      // Do not reveal whether an account exists; same response either way
      return res.json({
        message: 'If an account exists for that email, a reset code has been generated.',
      });
    }

    // Invalidate previous codes for this user
    await db.run('DELETE FROM password_resets WHERE user_id = ?', user.id);

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    await db.run(
      'INSERT INTO password_resets (id, user_id, code, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
      ['reset_' + crypto.randomUUID(), user.id, code, expiresAt, now],
    );

    console.log(`[password-reset] code for ${cleanEmail}: ${code}`);

    res.json({
      message: `A 6-digit reset code has been generated for ${cleanEmail}.`,
      devCode: code,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to request password reset' });
  }
});

// Complete a password reset with email + code + new password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const parseResult = ServerResetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid reset data',
      });
    }

    const { code, newPassword } = parseResult.data;
    const cleanEmail = parseResult.data.email.trim().toLowerCase();
    const db = await getDb();
    const user = await db.get<UserRow>('SELECT * FROM users WHERE email = ?', cleanEmail);
    if (!user) {
      return res.status(400).json({ error: 'No account found with that email' });
    }

    const reset = await db.get<ResetRow>(
      'SELECT * FROM password_resets WHERE user_id = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1',
      [user.id, code],
    );
    if (!reset) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (new Date(reset.expires_at) < new Date()) {
      await db.run('UPDATE password_resets SET used = 1 WHERE id = ?', reset.id);
      return res.status(400).json({ error: 'This reset code has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(11);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    const now = new Date().toISOString();

    await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [
      passwordHash,
      now,
      user.id,
    ]);
    await db.run('UPDATE password_resets SET used = 1 WHERE id = ?', reset.id);

    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// List existing local profiles on this instance
app.get('/api/auth/profiles', async (_req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all<UserRow>('SELECT email, name FROM users ORDER BY updated_at DESC LIMIT 8');
    res.json({
      profiles: (rows || []).map((r) => ({ email: r.email, name: r.name })),
    });
  } catch {
    res.json({ profiles: [] });
  }
});

// Get Current Profile
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const user = await db.get<UserRow>(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      req.user!.id,
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: false,
        joinedAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error retrieving user profile' });
  }
});

// ----------------------------------------------------
// SKILLS ROUTES (Secured per authenticated user)
// ----------------------------------------------------

// Get all skills for current user
app.get('/api/skills', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const rows = await db.all<SkillRow>(
      'SELECT * FROM skills WHERE user_id = ? ORDER BY created_at ASC',
      req.user!.id,
    );

    const skills = rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      goal: r.target_hours ? { type: 'total', targetHours: r.target_hours } : null,
      createdAt: r.created_at,
      userId: r.user_id,
    }));

    res.json({ skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to retrieve skills' });
  }
});

// Create skill
app.post('/api/skills', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parseResult = ServerSkillSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message ?? 'Invalid skill payload' });
    }
    const { name, color, goal } = parseResult.data;

    const skillId = 'skill_' + crypto.randomUUID();
    const now = new Date().toISOString();
    const targetHours = goal?.targetHours || 50;

    const db = await getDb();
    await db.run(
      'INSERT INTO skills (id, user_id, name, category, color, target_hours, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [skillId, req.user!.id, name, 'General', color || '#6366f1', targetHours, null, now, now],
    );

    const newSkill = {
      id: skillId,
      name,
      color: color || '#6366f1',
      goal: goal || { type: 'total', targetHours },
      createdAt: now,
      userId: req.user!.id,
    };

    res.status(201).json({ skill: newSkill });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// Update skill
app.put('/api/skills/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const parseResult = ServerSkillUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message ?? 'Invalid skill payload' });
    }
    const { name, color, goal } = parseResult.data;

    const db = await getDb();
    const skill = await db.get<SkillRow>('SELECT * FROM skills WHERE id = ? AND user_id = ?', [
      id,
      req.user!.id,
    ]);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const now = new Date().toISOString();
    const targetHours = goal?.targetHours !== undefined ? goal.targetHours : skill.target_hours;

    await db.run(
      'UPDATE skills SET name = ?, color = ?, target_hours = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [name ?? skill.name, color || skill.color, targetHours, now, id, req.user!.id],
    );

    res.json({
      skill: {
        id,
        name: name ?? skill.name,
        color: color || skill.color,
        goal: { type: 'total', targetHours },
        createdAt: skill.created_at,
        userId: req.user!.id,
      },
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// Delete skill (sessions cascade via explicit delete below)
app.delete('/api/skills/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const db = await getDb();
    const userId = req.user!.id;

    // Delete sessions first (no ON DELETE CASCADE in this schema)
    await db.run('DELETE FROM sessions WHERE skill_id = ? AND user_id = ?', [id, userId]);
    const result = await db.run('DELETE FROM skills WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ message: 'Skill deleted successfully', id });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// ----------------------------------------------------
// SESSIONS ROUTES (Secured per authenticated user)
// ----------------------------------------------------

// Get all sessions for user
app.get('/api/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const rows = await db.all<SessionRow>(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC, created_at DESC',
      req.user!.id,
    );

    const sessions = rows.map((r) => ({
      id: r.id,
      skillId: r.skill_id,
      durationMinutes: r.duration_minutes,
      date: r.date,
      notes: r.notes,
      createdAt: r.created_at,
      userId: r.user_id,
    }));

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// Create practice session
app.post('/api/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parseResult = ServerSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message ?? 'Invalid session payload' });
    }
    const { skillId, durationMinutes, date, notes } = parseResult.data;

    const db = await getDb();
    // Validate skill ownership
    const skill = await db.get<SkillRow>('SELECT id FROM skills WHERE id = ? AND user_id = ?', [
      skillId,
      req.user!.id,
    ]);
    if (!skill) {
      return res.status(400).json({ error: 'Selected skill does not exist or belong to this user' });
    }

    const sessionId = 'session_' + crypto.randomUUID();
    const now = new Date().toISOString();

    await db.run(
      'INSERT INTO sessions (id, user_id, skill_id, duration_minutes, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sessionId, req.user!.id, skillId, durationMinutes, date, notes || null, now],
    );

    const newSession = {
      id: sessionId,
      skillId,
      durationMinutes,
      date,
      notes: notes || null,
      createdAt: now,
      userId: req.user!.id,
    };

    res.status(201).json({ session: newSession });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update practice session
app.put('/api/sessions/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const parseResult = ServerSessionUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message ?? 'Invalid session payload' });
    }
    const { skillId, durationMinutes, date, notes } = parseResult.data;

    const db = await getDb();
    const userId = req.user!.id;

    const session = await db.get<SessionRow>('SELECT * FROM sessions WHERE id = ? AND user_id = ?', [
      id,
      userId,
    ]);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Validate skill ownership when changing skill
    const newSkillId = skillId ?? session.skill_id;
    const skill = await db.get<SkillRow>('SELECT id FROM skills WHERE id = ? AND user_id = ?', [
      newSkillId,
      userId,
    ]);
    if (!skill) {
      return res.status(400).json({ error: 'Selected skill does not exist or belong to this user' });
    }

    const now = new Date().toISOString();
    await db.run(
      `UPDATE sessions SET skill_id = ?, duration_minutes = ?, date = ?, notes = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      [
        newSkillId,
        durationMinutes !== undefined ? durationMinutes : session.duration_minutes,
        date ?? session.date,
        notes !== undefined ? notes : session.notes,
        now,
        id,
        userId,
      ],
    );

    res.json({
      session: {
        id,
        skillId: newSkillId,
        durationMinutes:
          durationMinutes !== undefined ? durationMinutes : session.duration_minutes,
        date: date ?? session.date,
        notes: notes !== undefined ? notes : session.notes,
        createdAt: session.created_at,
        updatedAt: now,
        userId,
      },
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete practice session
app.delete('/api/sessions/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const db = await getDb();
    const result = await db.run('DELETE FROM sessions WHERE id = ? AND user_id = ?', [id, req.user!.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully', id });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Batch sync endpoint (allows migrating guest or local data into cloud account)
app.post('/api/sync/batch', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { skills, sessions } = req.body;
    const db = await getDb();
    const userId = req.user!.id;
    const now = new Date().toISOString();

    if (Array.isArray(skills)) {
      for (const s of skills) {
        const targetHours = s.goal?.targetHours || 50;
        await db.run(
          `INSERT OR REPLACE INTO skills (id, user_id, name, category, color, target_hours, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id || 'skill_' + crypto.randomUUID(), userId, s.name, 'General', s.color || '#6366f1', targetHours, s.createdAt || now, now],
        );
      }
    }

    if (Array.isArray(sessions)) {
      for (const sess of sessions) {
        await db.run(
          `INSERT OR REPLACE INTO sessions (id, user_id, skill_id, duration_minutes, date, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [sess.id || 'session_' + crypto.randomUUID(), userId, sess.skillId, sess.durationMinutes, sess.date, sess.notes || null, sess.createdAt || now],
        );
      }
    }

    res.json({ success: true, message: 'Data successfully synced with backend' });
  } catch (error) {
    console.error('Batch sync error:', error);
    res.status(500).json({ error: 'Failed to batch sync data' });
  }
});

// ----------------------------------------------------
// AI PRACTICE INSIGHTS & COACH
// ----------------------------------------------------
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

app.post('/api/ai/insights', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { skills, sessions, overallStats } = req.body;
    const ai = getGenAI();

    if (!ai) {
      const topSkill = skills && skills.length > 0 ? skills[0].name : 'your primary skill';
      return res.json({
        summary: `You've accumulated ${overallStats?.totalHours || 0} hours of focused practice across ${skills?.length || 0} skills with an active ${overallStats?.currentStreak || 0}-day streak. Consistency in ${topSkill} is building solid momentum.`,
        highlights: [
          `Strong momentum in ${topSkill} with active practice sessions`,
          'Balanced focus between deliberate deep sessions and consistent daily touches',
          `${overallStats?.activeSkillsCount || 0} active skills in your dashboard`,
        ],
        recommendation: 'Consider scheduling a short 20-minute consolidation session on weekdays to protect your streak.',
        reflectionPrompt: 'What is one concept or technique you unlocked this week that surprised you?',
        streakMotivation: `You're currently holding an active ${overallStats?.currentStreak || 0}-day streak. Keep the chain unbroken!`,
        generatedAt: new Date().toISOString(),
      });
    }

    const prompt = `You are an elite, encouraging practice coach for SkillTrack (a personal learning journal).
Analyze this learner's practice log and output a structured JSON assessment.

Data summary:
Total hours: ${overallStats?.totalHours || 0}h
Current streak: ${overallStats?.currentStreak || 0} days
Longest streak: ${overallStats?.longestStreak || 0} days
Skills: ${JSON.stringify(skills?.map((s: { name: string }) => ({ name: s.name })))}
Recent practice sessions sample: ${JSON.stringify(sessions?.slice(0, 15).map((s: { skillId: string; durationMinutes: number; date: string }) => ({ skillId: s.skillId, duration: s.durationMinutes, date: s.date })))}

Return ONLY valid JSON matching this schema:
{
  "summary": "1-2 sentence motivating summary of recent practice patterns",
  "highlights": ["3 bullet points celebrating specific achievements or consistency patterns"],
  "recommendation": "1 actionable, practical advice for optimizing practice or maintaining momentum",
  "reflectionPrompt": "1 thought-provoking question related to their learning",
  "streakMotivation": "1 punchy encouragement about their current streak"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    return res.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return res.json({
      summary: "You've demonstrated consistency across your skills. Logging sessions consistently is the most reliable predictor of long-term mastery.",
      highlights: [
        'Active streak maintained across multiple disciplines',
        'Diverse session durations accommodating different daily energy levels',
        'Rich session reflections recorded for future review',
      ],
      recommendation: 'Try setting a fixed time window for your highest priority skill to build automatic habit momentum.',
      reflectionPrompt: 'What was the most challenging obstacle you overcame during your last session?',
      streakMotivation: 'Every day you log practice cements your identity as a deliberate learner.',
      generatedAt: new Date().toISOString(),
    });
  }
});

// API 404 (JSON, not HTML) — registered after all API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
