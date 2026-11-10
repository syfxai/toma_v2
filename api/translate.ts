import { GoogleGenAI } from "@google/genai";
import { recordApiCall } from "./lib/apiTracker";

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
].filter(Boolean) as string[];

const isFallbackableError = (error: any) =>
  error?.status === 429 ||
  error?.status === 404 ||
  error?.message?.includes('429') ||
  error?.message?.includes('404') ||
  error?.message?.toLowerCase?.().includes('quota') ||
  error?.message?.toLowerCase?.().includes('rate limit') ||
  error?.message?.toLowerCase?.().includes('not found') ||
  error?.message?.toLowerCase?.().includes('not supported for generatecontent');

async function translateWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const models = [
    process.env.GROQ_CHAT_MODEL,
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
  ].filter(Boolean) as string[];

  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) {
      console.error(`Groq translation fallback ${model} failed:`, e);
    }
  }

  throw new Error('Groq translation fallback failed');
}

async function translateJson(ai: GoogleGenAI, prompt: string) {
  let lastError: any;

  // 1. Try Gemini
  for (const model of GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({
        model,
        config: {
          responseMimeType: 'application/json'
        },
        contents: prompt,
      });
    } catch (error: any) {
      lastError = error;
      console.warn(`Gemini translation model ${model} failed:`, error?.message || error);
    }
  }

  // 2. Failover to Groq
  console.log('Gemini terjemahan gagal, beralih ke sandaran Groq...');
  try {
    const text = await translateWithGroq(prompt);
    return { text };
  } catch (err) {
    throw lastError || err;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, languageName } = req.body;
    if (!content || !languageName) {
      return res.status(400).json({ error: 'Content and languageName are required' });
    }

    const translationKey = process.env.GEMINI_API_KEY_TRANSLATE || process.env.GEMINI_API_KEY;
    
    if (!translationKey) {
      return res.status(500).json({ error: 'Gemini API key (GEMINI_API_KEY_TRANSLATE or GEMINI_API_KEY) is missing on the server' });
    }

    const ai = new GoogleGenAI({ apiKey: translationKey });
    const prompt = `Translate all string values in the following JSON object to ${languageName}. The context is a food recipe, so be natural and use appropriate culinary terms for that language. Do not translate keys. Respond with only the translated JSON object, maintaining the exact same structure and keys. If a value is an array of strings, translate each string in the array.
  
  JSON to translate:
  ${JSON.stringify(content, null, 2)}`;

    const t0 = Date.now();
    const response = await translateJson(ai, prompt);

    const jsonText = response.text?.trim() || '';
    
    if (!jsonText) {
      console.error("Empty response from Gemini API for translation");
      throw new Error("Gagal menterjemah kandungan.");
    }
    recordApiCall('translate', GEMINI_MODELS[0], 200, Date.now() - t0);
    res.status(200).json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error(`Error translating content:`, error);
    recordApiCall('translate', GEMINI_MODELS[0] || 'gemini', 500, 0, error?.message);
    res.status(500).json({ error: "Failed to translate content. Please try again." });
  }
}
