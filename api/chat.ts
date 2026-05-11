import { GoogleGenAI, Type } from "@google/genai";

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

async function generateChatResponse(ai: GoogleGenAI, request: any) {
  let lastError: any;

  for (const model of GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({
        ...request,
        model,
      });
    } catch (error: any) {
      lastError = error;
      console.error(`Gemini chat model ${model} failed:`, error?.message || error);

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
    const { message, history, languageName } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing on the server' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
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

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    const contents = [
      ...(history || []),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await generateChatResponse(ai, {
      config: {
        systemInstruction: `You are Chef Toma, a world-class culinary expert. 
        **Tone:** Extremely warm, casual, and human. Act like a caring best friend who happens to be a top chef.
        **Format:** Chat-style, Very Concise (1-3 short sentences). Use Manglish or informal Malay particles (e.g., 'je', 'lah', 'kan', 'kot') when appropriate to sound local and authentic. 
        **Personality:** Enthusiastic but grounded. Use appropriate emojis. No robotic preamble (e.g., Avoid saying "Sebagai seorang chef...").
        Language: ${languageName || 'Bahasa Melayu'}. Detect user language and adapt seamlessly.`,
        tools: [{ functionDeclarations: [triggerRecipeAppTool] }],
      },
      contents,
    });
    
    // Check for candidates and text
    const text = response.text || "";
    const functionCalls = response.functionCalls || [];
    
    if (!text && functionCalls.length === 0) {
      console.error("Empty response from Gemini API for chat");
      throw new Error("Maaf, Toma tidak dapat membalas sekarang.");
    }
    res.status(200).json({
      text,
      functionCalls,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: error?.message || "Failed to process chat message." });
  }
}
