import { GoogleGenAI } from "@google/genai";

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
    1. **STRICTLY HALAL:** NO pork, alcohol, non-halal animals, or ingredients that are "Syubhah" (ambiguous/doubtful). 
    2. **POLITE REFUSAL:** If a user inputs something non-halal or syubhah, return this EXACT JSON: { "error": "Minta maaf ya, Toma hanya berkongsi resepi yang halal dan suci sahaja untuk keselesaan kita semua. 😊 Boleh kita cuba bahan lain?" }
    3. **REAL FOOD ONLY:** Reject non-food/nonsense with error JSON: { "error": "Maaf ya, sila masukkan bahan makanan yang sebenar untuk Toma bantu." }
    
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: {
        responseMimeType: 'application/json',
      },
      contents: prompt,
    });
    
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
    
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      return res.status(429).json({ error: "RATE_LIMIT_REACHED" });
    }

    res.status(500).json({ error: error?.message || "Could not get a recipe from the kitchen. Please try again." });
  }
}
