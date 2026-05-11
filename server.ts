import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
].filter(Boolean) as string[];

const isRateLimitError = (error: any) =>
  error?.status === 429 ||
  error?.message?.includes('429') ||
  error?.message?.toLowerCase?.().includes('quota') ||
  error?.message?.toLowerCase?.().includes('rate limit');

const isModelUnavailableError = (error: any) =>
  error?.status === 404 ||
  error?.message?.includes('404') ||
  error?.message?.toLowerCase?.().includes('not found') ||
  error?.message?.toLowerCase?.().includes('not supported for generatecontent');

async function generateJsonWithFallback(ai: GoogleGenAI, prompt: string) {
  let lastError: any;

  for (const model of GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({
        model,
        config: {
          responseMimeType: 'application/json',
        },
        contents: prompt,
      });
    } catch (error: any) {
      lastError = error;
      console.error(`Gemini model ${model} failed:`, error?.message || error);

      if (!isRateLimitError(error) && !isModelUnavailableError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // API Routes
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, languageName } = req.body;
      const triggerRecipeAppTool = {
        name: "triggerRecipeApp",
        description: "Triggers the main recipe generator app with a list of ingredients or a dish name. Use this when the user explicitly asks to create, generate, or show a recipe card.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.STRING,
              description: "The list of ingredients or the name of the dish to generate a recipe for (e.g., 'chicken, rice' or 'Nasi Lemak').",
            },
          },
          required: ["ingredients"],
        },
      };

      const contents = [
        ...(history || []),
        { role: 'user', parts: [{ text: message }] },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash', // Upgraded as requested
        config: {
          systemInstruction: `You are Chef Toma, a world-class culinary expert. 
          **Tone:** Extremely warm, casual, and human. Act like a best friend.
          **Format:** Chat-style, Very Concise (1-3 short sentences). Use Manglish/informal Malay.
          **Rules:** Strictly Halal. Refuse haram/syubhah items politely.
          Language: ${languageName || 'Bahasa Melayu'}.`,
          tools: [{ functionDeclarations: [triggerRecipeAppTool] }],
        },
        contents,
      });
      
      res.json({
        text: response.text || "",
        functionCalls: response.functionCalls || []
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message." });
    }
  });

  app.post('/api/generateRecipe', async (req, res) => {
    try {
      const { ingredients } = req.body;
      const prompt = `Expert Culinary AI for Malaysian home cooks. 
      **STRICTLY HALAL:** NO pork, alcohol, or Syubhah items. 
      **POLITE REFUSAL:** { "error": "Minta maaf ya, Toma hanya berkongsi resepi yang halal dan suci sahaja..." }
      User Input: ${ingredients}`;

      const response = await generateJsonWithFallback(ai, prompt);
      const text = response.text || "";
      
      try {
        res.json(JSON.parse(text));
      } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          res.json(JSON.parse(match[0]));
        } else {
          throw new Error("Failed to parse recipe data");
        }
      }
    } catch (error) {
      console.error("Generate error:", error);
      res.status(500).json({ error: "Failed to generate recipe." });
    }
  });

  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioBase64 } = req.body;
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is not set' });

      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'ms');

      const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
      });

      const data = await groqResponse.json();
      res.json({ text: data.text });
    } catch (error) {
      console.error("Transcribe error:", error);
      res.status(500).json({ error: "Voice transcription failed." });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const html = await vite.transformIndexHtml(url, 'index.html');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
