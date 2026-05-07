import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, languageName } = req.body;
    if (!content || !languageName) {
      return res.status(400).json({ error: 'Content and languageName are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing on the server' });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const prompt = `Translate all string values in the following JSON object to ${languageName}. The context is a food recipe, so be natural and use appropriate culinary terms for that language. Do not translate keys. Respond with only the translated JSON object, maintaining the exact same structure and keys. If a value is an array of strings, translate each string in the array.
  
  JSON to translate:
  ${JSON.stringify(content, null, 2)}`;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = (response.text || "").trim();
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
