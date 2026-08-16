import { Router } from 'express';
import { requireAuth } from '../auth.js';
import type { AuthRequest } from '../auth.js';
import { ServerBatchSyncSchema } from '../schemas.js';
import { batchSync } from '../services/syncService.js';
import { sendError } from '../services/errors.js';

const router = Router();

// Batch sync endpoint (allows migrating guest or local data into cloud account)
router.post('/batch', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parseResult = ServerBatchSyncSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message ?? 'Invalid sync payload',
      });
    }

    const result = await batchSync(req.user!.id, parseResult.data);
    res.json(result);
  } catch (error) {
    sendError(res, error, 'Failed to batch sync data');
  }
});

export default router;
