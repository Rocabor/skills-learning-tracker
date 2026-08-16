import { Router } from 'express';
import { requireAuth } from '../auth.js';
import type { AuthRequest } from '../auth.js';
import { fallbackInsights, generateInsights } from '../services/insightService.js';

const router = Router();

// AI Practice Insights & Coach
router.post('/insights', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { skills, sessions, overallStats } = req.body;
    const insights = await generateInsights({ skills, sessions, overallStats });
    res.json(insights);
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.json(fallbackInsights());
  }
});

export default router;
