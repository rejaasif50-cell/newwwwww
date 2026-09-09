import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // AI Chat Endpoint using Gemini (as the reliable free fallback since we are on Google Cloud)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `You are a helpful assistant for a CSC (Common Service Centre) and Banking provider in India. Answer in English or Hinglish (Hindi written in English alphabet). Keep answers concise and helpful.\n\nUser Question: ${message}` }]
          }
        ]
      });
      
      res.json({ answer: response.text });
    } catch (error: any) {
      console.error('AI Error:', error);
      res.status(500).json({ answer: 'Sorry, I am having trouble connecting to the AI service right now. Please try again later.' });
    }
  });

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
