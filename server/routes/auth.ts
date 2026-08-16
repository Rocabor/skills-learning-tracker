import { Router } from 'express';
import { requireAuth } from '../auth.js';
import type { AuthRequest } from '../auth.js';
import {
  ServerForgotPasswordSchema,
  ServerLoginSchema,
  ServerRegisterSchema,
  ServerResetPasswordSchema,
} from '../schemas.js';
import {
  getProfile,
  listProfiles,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from '../services/authService.js';
import { sendError } from '../services/errors.js';

const router = Router();

// Register with Email & Password
router.post('/register', async (req, res) => {
  try {
    const parseResult = ServerRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid registration data',
      });
    }

    const result = await registerUser(parseResult.data);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error, 'Internal server error during registration');
  }
});

// Login with Email & Password
router.post('/login', async (req, res) => {
  try {
    const parseResult = ServerLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid email or password',
      });
    }

    const result = await loginUser(parseResult.data);
    res.json(result);
  } catch (error) {
    sendError(res, error, 'Internal server error during login');
  }
});

// Request a password reset code
// The 6-digit code is delivered by email through a trusted provider in
// production. Outside of production it is also returned to the client as
// devCode (console channel) so local development can complete the flow.
router.post('/forgot-password', async (req, res) => {
  try {
    const parseResult = ServerForgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid email',
      });
    }

    const result = await requestPasswordReset(parseResult.data.email);
    res.json(result);
  } catch (error) {
    sendError(res, error, 'Failed to request password reset');
  }
});

// Complete a password reset with email + code + new password
router.post('/reset-password', async (req, res) => {
  try {
    const parseResult = ServerResetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid reset data',
      });
    }

    const result = await resetPassword(parseResult.data);
    res.json(result);
  } catch (error) {
    sendError(res, error, 'Failed to reset password');
  }
});

// List existing local profiles on this instance
router.get('/profiles', async (_req, res) => {
  try {
    const { profiles } = await listProfiles();
    res.json({ profiles });
  } catch {
    res.json({ profiles: [] });
  }
});

// Get Current Profile
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { user } = await getProfile(req.user!.id);
    res.json({ user });
  } catch (error) {
    sendError(res, error, 'Error retrieving user profile');
  }
});

export default router;
