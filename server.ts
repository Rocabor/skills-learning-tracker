import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app.ts';
import { getDb } from './server/db.ts';

// ----------------------------------------------------
// STATIC SERVING & SPA FALLBACK (local dev / local prod)
// Vercel deployment uses `api/index.ts` instead of this file.
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
    // SPA fallback (Express 5: catch-all via middleware, not '*')
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  SkillTrack fullstack server running on:`);
    console.log(`    http://localhost:${PORT}   <- open this URL in your browser`);
    console.log(`    http://127.0.0.1:${PORT}\n`);
  });
}

setupServer();
