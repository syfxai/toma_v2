import { GoogleGenAI } from "@google/genai";

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

async function generateRecipeJson(ai: GoogleGenAI, prompt: string) {
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients } = req.body;
    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing on the server' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    const prompt = `Expert Culinary AI for Malaysian home cooks.
    
    **CRITICAL RULES:**
    1. **STRICTLY HALAL:** The generated recipe must NOT contain pork, lard, alcohol, non-halal animals, or any non-halal/syubhah ingredients.
    2. **POLITE REFUSAL:** If the user's input explicitly asks for inherently non-halal items (e.g. pork, lard, bacon, ham, wine, beer, rum, whiskey, sake, mirin, etc.), return this EXACT JSON: { "error": "Minta maaf ya, Toma hanya berkongsi resepi yang halal dan suci sahaja untuk keselesaan kita semua. 😊 Boleh kita cuba bahan lain?" }
    3. **SAFE INTERPRETATION:** If the user inputs a dish or ingredient that is generally halal but could occasionally involve syubhah items (e.g. buttercream, tiramisu, vanilla ice cream, gelatin, etc.), DO NOT refuse. Instead, generate a halal version of the recipe using explicitly halal alternatives (e.g. halal vanilla extract, halal gelatin, halal-certified unsalted butter, etc.). Do not use phrasing that mentions "alcohol-free" or references alcohol in the output ingredients/instructions; instead, write "halal vanilla extract", "halal gelatin", or "halal ingredient".
    4. **REAL FOOD ONLY:** Reject non-food/nonsense with error JSON: { "error": "Maaf ya, sila masukkan bahan makanan yang sebenar untuk Toma bantu." }
    
    **TASKS:**
    - **Single Dish/Ingredients:** Create a logical, delicious Malaysian dish. Creative name/description.
    - **Collection:** 15-25 distinct titles + short descriptions.
    
    **SPECS:** Clear steps, estimated nutrition (with mg/µg for vitamins/minerals), English JSON.
    
    **OUTPUT FORMAT:**
    - Single: { "recipeName", "description", "prepTime", "cookTime", "totalTime", "servings", "ingredients": [], "instructions": [], "nutrition": { "calories", "protein", "fat", "carbohydrates", "vitamins": ["Vitamin C (12mg)"], "minerals": ["Iron (2.5mg)"], "others": [], "healthScore": "healthy|unhealthy" } }
    - List: { "results": [{ "title", "description" }] }
    
    User Input: ${ingredients}`;

    // OPTIMIZATION: Only use Google Search tool if the user explicitly asks for a recipe, chef, or authentic dish.
    // Passing an empty tools array causes SDK errors, so we only include it when needed.
    const needsAuthenticRecipe = /resepi|recipe|chef|aming|asli|original|betul|cara/i.test(ingredients);

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    const response = await generateRecipeJson(ai, prompt);
    
    const text = response.text;
    if (!text) {
      console.error("Empty response from Gemini API");
      throw new Error("Toma tidak dapat menjana resepi buat masa ini. Sila cuba lagi.");
    }
    
    try {
      const data = JSON.parse(text);
      if (data.error) {
        return res.status(400).json({ error: data.error });
      }
      res.status(200).json(data);
    } catch (e) {
      // Fallback: try to extract JSON if it was wrapped in markdown
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          res.status(200).json(JSON.parse(match[0]));
          return;
        } catch(e2) {}
      }
      console.error("JSON parse error:", e, "Raw text:", text);
      res.status(500).json({ error: "Failed to parse recipe data." });
    }
  } catch (error: any) {
    console.error("Error generating recipe in API:", error?.message || error);
    
    if (isRateLimitError(error) || isModelUnavailableError(error)) {
      return res.status(429).json({ error: "RATE_LIMIT_REACHED" });
    }

    res.status(500).json({ error: error?.message || "Could not get a recipe from the kitchen. Please try again." });
  }
}
