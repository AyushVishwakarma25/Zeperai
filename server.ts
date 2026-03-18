import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// --- CONCURRENCY QUEUE ---
// This protects your margins and prevents Google API Rate Limits (429 errors)
class TaskQueue {
  private concurrency: number;
  private running: number;
  private queue: Array<{ task: () => Promise<any>, resolve: (val: any) => void, reject: (err: any) => void }>;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    this.running++;
    const { task, resolve, reject } = this.queue.shift()!;
    try {
      const result = await task();
      resolve(result);
    } catch (e) {
      reject(e);
    } finally {
      this.running--;
      this.processNext();
    }
  }
}

// Max 2 concurrent Gemini requests globally. 
// If 10 users request 4 images each, they will safely wait in line.
const geminiQueue = new TaskQueue(2); 

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  // Increase payload limit to handle large base64 image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API ROUTES ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Secure Full-Stack Server is running!' });
  });

  // Secure Proxy Endpoint for Gemini
  app.post('/api/gemini/proxy', async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API Key is missing on the server." });
      }

      const result = await geminiQueue.add(async () => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model,
          contents,
          config
        });
        
        // Extract exactly what the frontend needs to avoid circular JSON errors
        let text = response.text;
        let parts = response.candidates?.[0]?.content?.parts || [];
        let finishReason = response.candidates?.[0]?.finishReason;
        
        return { text, parts, finishReason };
      });
      
      res.json(result);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Gemini Proxy Error:`, error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // --- VITE & STATIC SERVING ---
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
