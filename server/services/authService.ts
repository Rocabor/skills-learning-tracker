import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { generateToken } from '../auth.js';
import { deliverResetCode } from '../email.js';
import type { PublicUser } from '../types.js';
import { ServiceError } from './errors.js';
import {
  findUserByEmail,
  findUserProfileById,
  insertUser,
  listRecentProfiles,
  updateUserPassword,
} from '../repos/userRepo.js';
import {
  findActiveResetByCode,
  insertResetCode,
  invalidateResetsForUser,
  markResetUsed,
} from '../repos/resetRepo.js';

function toPublicUser(user: { id: string; email: string; name: string; created_at: string }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isGuest: false,
    joinedAt: user.created_at,
  };
}

export async function registerUser(input: {
  email: string;
  name?: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  const cleanEmail = input.email.trim().toLowerCase();
  const displayName = input.name && input.name.trim() ? input.name.trim() : cleanEmail.split('@')[0];

  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new ServiceError(400, `An account with ${cleanEmail} already exists. Please sign in.`);
  }

  const salt = await bcrypt.genSalt(11);
  const passwordHash = await bcrypt.hash(input.password, salt);
  const userId = 'user_' + crypto.randomUUID();
  const now = new Date().toISOString();

  await insertUser({ id: userId, email: cleanEmail, name: displayName, passwordHash, createdAt: now, updatedAt: now });

  const token = generateToken({ id: userId, email: cleanEmail, name: displayName });

  return {
    user: { id: userId, email: cleanEmail, name: displayName, isGuest: false, joinedAt: now },
    token,
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  const cleanEmail = input.email.trim().toLowerCase();
  const user = await findUserByEmail(cleanEmail);

  if (!user) {
    throw new ServiceError(401, 'No account found with that email. Please create an account.');
  }

  const isMatch = await bcrypt.compare(input.password, user.password_hash);
  if (!isMatch) {
    throw new ServiceError(401, 'Incorrect password. Please try again.');
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name });

  return { user: toPublicUser(user), token };
}

export async function requestPasswordReset(
  email: string,
): Promise<{ message: string; devCode?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    // Do not reveal whether an account exists; same response either way
    return { message: 'If an account exists for that email, a reset code has been generated.' };
  }

  await invalidateResetsForUser(user.id);

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  await insertResetCode({ id: 'reset_' + crypto.randomUUID(), userId: user.id, code, expiresAt, createdAt: now });

  const delivery = await deliverResetCode(cleanEmail, code);

  // devCode is only exposed outside of production, so the endpoint cannot be
  // used to take over accounts in production without email access.
  const isDev = process.env.NODE_ENV !== 'production';
  const payload: { message: string; devCode?: string } = {
    message: delivery.delivered
      ? 'If an account exists for that email, a reset code has been sent.'
      : 'If an account exists for that email, a reset code has been generated.',
  };

  if (isDev && delivery.channel === 'console') {
    payload.message = `A 6-digit reset code has been generated for ${cleanEmail}.`;
    payload.devCode = code;
  }

  return payload;
}

export async function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const cleanEmail = input.email.trim().toLowerCase();
  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    throw new ServiceError(400, 'No account found with that email');
  }

  const reset = await findActiveResetByCode(user.id, input.code);
  if (!reset) {
    throw new ServiceError(400, 'Invalid or expired reset code');
  }

  if (new Date(reset.expires_at) < new Date()) {
    await markResetUsed(reset.id);
    throw new ServiceError(400, 'This reset code has expired. Please request a new one.');
  }

  const salt = await bcrypt.genSalt(11);
  const passwordHash = await bcrypt.hash(input.newPassword, salt);
  const now = new Date().toISOString();

  await updateUserPassword(user.id, passwordHash, now);
  await markResetUsed(reset.id);

  return { message: 'Password reset successfully. You can now sign in.' };
}

export async function listProfiles(): Promise<{ profiles: { email: string; name: string }[] }> {
  const profiles = await listRecentProfiles(8);
  return { profiles };
}

export async function getProfile(userId: string): Promise<{ user: PublicUser }> {
  const user = await findUserProfileById(userId);
  if (!user) {
    throw new ServiceError(404, 'User not found');
  }
  return { user: toPublicUser(user) };
}
