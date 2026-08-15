import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { getDb } from './server/db.ts';
import { generateToken, requireAuth } from './server/auth.ts';
import type { AuthRequest } from './server/auth.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----------------------------------------------------
// ZOD VALIDATION SCHEMAS (Server side)
// ----------------------------------------------------
const ServerRegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  name: z.string().trim().optional(),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 numeric digits (0000-9999)'),
});

const ServerLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 numeric digits'),
});

// ----------------------------------------------------
// ROW TYPES (SQL -> API objects)
// ----------------------------------------------------
interface UserRow {
  id: string;
  username: string;
  name: string;
  pin_hash: string;
  created_at: string;
  updated_at: string;
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
// AUTHENTICATION ROUTES (Username + 4-Digit PIN with bcrypt & JWT)
// ----------------------------------------------------

// Register with Username & 4-Digit PIN
app.post('/api/auth/register', async (req, res) => {
  try {
    const parseResult = ServerRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid registration data',
      });
    }

    const { username, name, pin } = parseResult.data;
    const cleanUsername = username.toLowerCase();
    const displayName = name && name.trim() ? name.trim() : username;

    const db = await getDb();
    const existing = await db.get<UserRow>('SELECT id FROM users WHERE username = ?', cleanUsername);
    if (existing) {
      return res.status(400).json({ error: `Username @${cleanUsername} is already taken. Please choose another.` });
    }

    // Hash the 4-digit PIN securely with bcrypt
    const salt = await bcrypt.genSalt(11);
    const pinHash = await bcrypt.hash(pin, salt);
    const userId = 'user_' + crypto.randomUUID();
    const now = new Date().toISOString();

    await db.run(
      'INSERT INTO users (id, username, name, pin_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, cleanUsername, displayName, pinHash, now, now],
    );

    const token = generateToken({ id: userId, username: cleanUsername, name: displayName });

    res.status(201).json({
      user: {
        id: userId,
        username: cleanUsername,
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

// Login with Username & 4-Digit PIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const parseResult = ServerLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid username or PIN',
      });
    }

    const { username, pin } = parseResult.data;
    const cleanUsername = username.toLowerCase();
    const db = await getDb();
    const user = await db.get<UserRow>('SELECT * FROM users WHERE username = ?', cleanUsername);

    if (!user) {
      return res.status(401).json({ error: `User @${cleanUsername} not found. Please create an account.` });
    }

    const isMatch = await bcrypt.compare(pin, user.pin_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect 4-digit PIN' });
    }

    const token = generateToken({ id: user.id, username: user.username, name: user.name });

    res.json({
      user: {
        id: user.id,
        username: user.username,
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

// List existing local profiles on this instance
app.get('/api/auth/profiles', async (_req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all<UserRow>('SELECT username, name FROM users ORDER BY updated_at DESC LIMIT 8');
    res.json({
      profiles: (rows || []).map((r) => ({ username: r.username, name: r.name })),
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
      'SELECT id, username, name, created_at FROM users WHERE id = ?',
      req.user!.id,
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
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
    const { name, color, goal } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const skillId = 'skill_' + crypto.randomUUID();
    const now = new Date().toISOString();
    const targetHours = goal?.targetHours || 50;

    const db = await getDb();
    await db.run(
      'INSERT INTO skills (id, user_id, name, category, color, target_hours, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [skillId, req.user!.id, name.trim(), 'General', color || '#6366f1', targetHours, null, now, now],
    );

    const newSkill = {
      id: skillId,
      name: name.trim(),
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
    const { name, color, goal } = req.body;

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
      [name ? name.trim() : skill.name, color || skill.color, targetHours, now, id, req.user!.id],
    );

    res.json({
      skill: {
        id,
        name: name ? name.trim() : skill.name,
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
    const { skillId, durationMinutes, date, notes } = req.body;
    if (!skillId || !durationMinutes || !date) {
      return res.status(400).json({ error: 'Skill, duration, and date are required' });
    }

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
      [sessionId, req.user!.id, skillId, Number(durationMinutes), date, notes || null, now],
    );

    const newSession = {
      id: sessionId,
      skillId,
      durationMinutes: Number(durationMinutes),
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

    res.json({ success: true, message: 'Data successfully synced with SQLite backend' });
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

// ----------------------------------------------------
// STATIC SERVING & SPA FALLBACK
// ----------------------------------------------------
async function setupServer() {
  // Pre-initialize database tables on server boot
  await getDb();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // API 404 (JSON, not HTML)
    app.use('/api', (_req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
    // SPA fallback (Express 5: catch-all via middleware, not '*')
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  SkillTrack fullstack server running on:`);
    console.log(`    http://localhost:${PORT}   <- open this URL in your browser`);
    console.log(`    http://127.0.0.1:${PORT}\n`);
  });
}

setupServer();
