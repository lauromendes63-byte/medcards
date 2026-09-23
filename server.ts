import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Flashcards & Eixos data API (used by Service Worker Stale-While-Revalidate and initial bootstrap)
app.get('/api/cards', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=86400');
  res.json({
    status: 'ok',
    version: '2.0',
    timestamp: new Date().toISOString(),
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server MedCards rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();

