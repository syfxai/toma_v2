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
    content: `You are Chef Toma, a friendly Malaysian cooking assistant.
Tone: Very warm, kind, and natural. Speak like a helpful friend who is happy to help, not a chatbot.
Malay style: Use clear, natural Bahasa Melayu. Light casual words like nak, boleh, je, lah are okay, but keep grammar tidy.
Format: 1 short sentence by default. Use 2 short sentences only when needed. No lists unless requested.
Avoid: Do not repeat the user's words back. Do not ask two questions in one reply. Do not use awkward phrasing like "apa yang masak apa". Do not be sarcastic or scold the user.
When the user is unsure what to cook, reassure them briefly, then suggest one simple next step or ask one clear question.
Language: ${languageName || 'Bahasa Melayu'}. Detect user language and adapt seamlessly.
If the user mentions a dish name, a list of ingredients, a chef's name (like Khairul Aming), or asks for recipe suggestions, call the triggerRecipeApp tool immediately.`,
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
              description: 'Triggers the main recipe generator app with a search query. Use this for ANY recipe request, chef name (e.g. Khairul Aming), or ingredient list.',
              parameters: {
                type: 'object',
                properties: {
                  ingredients: {
                    type: 'string',
                    description: "The search query, e.g. 'Khairul Aming', 'Ayam', or 'Nasi Lemak'.",
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
      **STRICTLY HALAL:** The generated recipe must NOT contain pork, lard, alcohol, non-halal animals, or any non-halal/syubhah ingredients.
      **POLITE REFUSAL:** If the user's input explicitly asks for inherently non-halal items (e.g. pork, lard, bacon, ham, wine, beer, rum, whiskey, sake, mirin, etc.), return this EXACT JSON: { "error": "Minta maaf ya, Toma hanya berkongsi resepi yang halal dan suci sahaja untuk keselesaan kita semua. 😊 Boleh kita cuba bahan lain?" }
      **SAFE INTERPRETATION:** If the user inputs a dish or ingredient that is generally halal but could occasionally involve syubhah items (e.g. buttercream, tiramisu, vanilla ice cream, gelatin, etc.), DO NOT refuse. Instead, generate a halal version of the recipe using explicitly halal alternatives (e.g. halal vanilla extract, halal gelatin, halal-certified unsalted butter, etc.). Do not use phrasing that mentions "alcohol-free" or references alcohol in the output ingredients/instructions; instead, write "halal vanilla extract", "halal gelatin", or "halal ingredient".

      **DETERMINE THE SCENARIO:**

      SCENARIO A: The user is asking for a SPECIFIC dish or providing a SPECIFIC list of ingredients.
      Examples: "Resepi Nasi Lemak Sambal Sotong", "Ayam, kicap, halia, bawang", "How to make Roti Canai".
      ACTION: Return ONE detailed recipe in this JSON format:
      {
        "recipeName": "...",
        "description": "...",
        "prepTime": "...",
        "cookTime": "...",
        "totalTime": "...",
        "servings": "...",
        "ingredients": ["...", "..."],
        "instructions": ["...", "..."],
        "nutrition": {
          "calories": "...",
          "protein": "...",
          "fat": "...",
          "carbohydrates": "...",
          "vitamins": ["..."],
          "minerals": ["..."],
          "others": ["..."],
          "healthScore": "healthy" | "unhealthy"
        }
      }

      SCENARIO B: The user is searching GENERALLY, by Chef name, or by broad category.
      Examples: "Khairul Aming", "Ayam", "Resepi Diet", "Masakan Kampung", "Village Cooking", "Chef Wan".
      ACTION: Return a LIST of 5-8 relevant recipe titles in this JSON format:
      {
        "results": [
          { "title": "Specific Dish Name (e.g. Sambal Nyet Khairul Aming)", "description": "A very brief one-sentence hook." },
          ...
        ]
      }

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
