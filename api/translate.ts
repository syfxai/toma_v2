import { GoogleGenAI } from "@google/genai";

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
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

async function translateJson(ai: GoogleGenAI, prompt: string) {
  let lastError: any;

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
      console.error(`Gemini translation model ${model} failed:`, error?.message || error);

      if (!isFallbackableError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
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

    const response = await translateJson(ai, prompt);

    const jsonText = response.text?.trim() || '';
    
    if (!jsonText) {
      console.error("Empty response from Gemini API for translation");
      throw new Error("Gagal menterjemah kandungan.");
    }
    res.status(200).json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error(`Error translating content:`, error);
    res.status(500).json({ error: "Failed to translate content. Please try again." });
  }
}
