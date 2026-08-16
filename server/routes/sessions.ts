import { Router } from 'express';
import { requireAuth } from '../auth.js';
import type { AuthRequest } from '../auth.js';
import { ServerSessionSchema, ServerSessionUpdateSchema } from '../schemas.js';
import {
  createSession,
  deleteSessionForUser,
  getSessions,
  updateSession,
} from '../services/sessionService.js';
import { sendError } from '../services/errors.js';

const router = Router();

// Get all sessions for user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { sessions } = await getSessions(req.user!.id);
    res.json({ sessions });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve sessions');
  }
});

// Create practice session
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parseResult = ServerSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message ?? 'Invalid session payload' });
    }

    const { session } = await createSession(req.user!.id, parseResult.data);
    res.status(201).json({ session });
  } catch (error) {
    sendError(res, error, 'Failed to create session');
  }
});

// Update practice session
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const parseResult = ServerSessionUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message ?? 'Invalid session payload' });
    }

    const { session } = await updateSession(req.user!.id, id, parseResult.data);
    res.json({ session });
  } catch (error) {
    sendError(res, error, 'Failed to update session');
  }
});

// Delete practice session
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const result = await deleteSessionForUser(req.user!.id, id);
    res.json(result);
  } catch (error) {
    sendError(res, error, 'Failed to delete session');
  }
});

export default router;
