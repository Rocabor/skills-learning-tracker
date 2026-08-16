import { Router } from 'express';
import { requireAuth } from '../auth.js';
import type { AuthRequest } from '../auth.js';
import { ServerSkillSchema, ServerSkillUpdateSchema } from '../schemas.js';
import {
  createSkill,
  deleteSkillForUser,
  getSkills,
  updateSkill,
} from '../services/skillService.js';
import { sendError } from '../services/errors.js';

const router = Router();

// Get all skills for current user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { skills } = await getSkills(req.user!.id);
    res.json({ skills });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve skills');
  }
});

// Create skill
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parseResult = ServerSkillSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message ?? 'Invalid skill payload' });
    }

    const { skill } = await createSkill(req.user!.id, parseResult.data);
    res.status(201).json({ skill });
  } catch (error) {
    sendError(res, error, 'Failed to create skill');
  }
});

// Update skill
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const parseResult = ServerSkillUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message ?? 'Invalid skill payload' });
    }

    const { skill } = await updateSkill(req.user!.id, id, parseResult.data);
    res.json({ skill });
  } catch (error) {
    sendError(res, error, 'Failed to update skill');
  }
});

// Delete skill (sessions cascade via explicit delete in the service)
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const result = await deleteSkillForUser(req.user!.id, id);
    res.json(result);
  } catch (error) {
    sendError(res, error, 'Failed to delete skill');
  }
});

export default router;
