import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
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

const GROQ_CHAT_MODELS = [
  process.env.GROQ_CHAT_MODEL,
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-20b',
].filter(Boolean) as string[];

const isFallbackableGroqError = (status: number, message: string) =>
  status === 404 ||
  status === 429 ||
  message.includes('not found') ||
  message.includes('rate limit') ||
  message.includes('quota');

const toGroqMessages = (history: any[] = [], message: string, languageName?: string) => [
  {
    role: 'system',
    content: `You are Chef Toma, a world-class culinary expert.
Tone: Extremely warm, casual, and human. Act like a caring best friend who happens to be a top chef.
Format: Chat-style, very concise, 1-3 short sentences. Use Manglish or informal Malay particles like je, lah, kan, kot when appropriate.
Personality: Enthusiastic but grounded. Use appropriate emojis. No robotic preamble.
Language: ${languageName || 'Bahasa Melayu'}. Detect user language and adapt seamlessly.
If the user explicitly asks to create, generate, or show a recipe card, call the triggerRecipeApp tool with the ingredients or dish name.`,
  },
  ...history.map((item: any) => ({
    role: item.role === 'model' ? 'assistant' : 'user',
    content: item.parts?.map((part: any) => part.text).filter(Boolean).join('\n') || '',
  })).filter((item: any) => item.content),
  { role: 'user', content: message },
];

async function createGroqChatCompletion(body: any) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing on the server');
  }

  let lastError = 'Groq chat failed.';

  for (const model of GROQ_CHAT_MODELS) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        model,
      }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      return data;
    }

    lastError = data?.error?.message || data?.error || response.statusText || lastError;
    console.error(`Groq chat model ${model} failed:`, response.status, lastError);

    if (!isFallbackableGroqError(response.status, String(lastError).toLowerCase())) {
      throw new Error(String(lastError));
    }
  }

  throw new Error(String(lastError));
}

async function generateWithFallback(ai: GoogleGenAI, request: any, label = 'Gemini model') {
  let lastError: any;

  for (const model of GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({
        ...request,
        model,
      });
    } catch (error: any) {
      lastError = error;
      console.error(`${label} ${model} failed:`, error?.message || error);

      if (!isRateLimitError(error) && !isModelUnavailableError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function generateJsonWithFallback(ai: GoogleGenAI, prompt: string) {
  return generateWithFallback(ai, {
        config: {
          responseMimeType: 'application/json',
        },
        contents: prompt,
      }, 'Gemini JSON model');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // API Routes
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, languageName } = req.body;
      const completion = await createGroqChatCompletion({
        messages: toGroqMessages(history, message, languageName),
        temperature: 0.7,
        max_completion_tokens: 300,
        tool_choice: 'auto',
        tools: [
          {
            type: 'function',
            function: {
              name: 'triggerRecipeApp',
              description: 'Triggers the main recipe generator app with a list of ingredients or a dish name. Use this when the user explicitly asks to create, generate, or show a recipe card.',
              parameters: {
                type: 'object',
                properties: {
                  ingredients: {
                    type: 'string',
                    description: "The list of ingredients or the name of the dish to generate a recipe for, for example 'chicken, rice' or 'Nasi Lemak'.",
                  },
                },
                required: ['ingredients'],
              },
            },
          },
        ],
      });

      const assistantMessage = completion?.choices?.[0]?.message || {};
      const functionCalls = (assistantMessage.tool_calls || [])
        .filter((toolCall: any) => toolCall.type === 'function')
        .map((toolCall: any) => {
          let args = {};
          try {
            args = JSON.parse(toolCall.function?.arguments || '{}');
          } catch {
            args = {};
          }

          return {
            name: toolCall.function?.name,
            args,
          };
        });
      
      res.json({
        text: assistantMessage.content || "",
        functionCalls,
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
