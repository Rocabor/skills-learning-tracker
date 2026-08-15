import { app } from '../server/app.js';

// Vercel serverless function: the Express app is reachable at /api via the
// "/api/(.*) -> /api" rewrite in vercel.json.
export default app;
