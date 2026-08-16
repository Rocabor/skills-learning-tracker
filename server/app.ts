import express from 'express';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import skillsRouter from './routes/skills.js';
import sessionsRouter from './routes/sessions.js';
import syncRouter from './routes/sync.js';
import insightsRouter from './routes/insights.js';

dotenv.config();

export const app = express();

app.use(express.json());

// Route modules
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/ai', insightsRouter);

// API 404 (JSON, not HTML) — registered after all API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
