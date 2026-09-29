import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Bangla Text-to-Speech (TTS) MP3 Proxy Route so Bengali audio works on ALL devices/browsers
  app.get('/api/tts-bn', async (req, res) => {
    try {
      const rawText = String(req.query.q || '').trim();
      if (!rawText) {
        res.status(400).send('Missing text parameter q');
        return;
      }

      const textChunk = rawText.slice(0, 200);
      const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=bn&client=tw-ob&q=${encodeURIComponent(
        textChunk
      )}`;

      const upstream = await fetch(ttsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (!upstream.ok) {
        res.status(upstream.status).send('Upstream TTS failed');
        return;
      }

      const arrayBuffer = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (err) {
      console.error('TTS Proxy Error:', err);
      res.status(500).send('TTS generation error');
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`bd7news.com server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
