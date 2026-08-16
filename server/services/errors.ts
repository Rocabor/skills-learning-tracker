import type { Response } from 'express';

/**
 * Business-rule error carrying the HTTP status and message the route should
 * return. Route handlers translate these into responses; any other error is
 * treated as an unexpected 500.
 */
export class ServiceError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

export function sendError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof ServiceError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: fallbackMessage });
}
