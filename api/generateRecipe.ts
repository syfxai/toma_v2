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

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `You are an expert culinary AI, skilled at both providing specific recipes and creating new ones from ingredients. Your primary goal is to help a Malaysian home cook.

**CRITICAL RULES (MUST FOLLOW):**
1. **STRICTLY HALAL & SHARIAH COMPLIANT:** NO pork (babi), dog (anjing), alcohol (arak), kratom (ketum), drugs (dadah), or any non-halal items.
2. **NO NONSENSE:** If the user inputs non-food items (e.g., cars, humans, wood, poison), DO NOT generate a recipe.
3. **VIOLATION OF RULE 1 OR 2:** If the input violates the rules above, you MUST return ONLY this JSON object:
   { "error": "Maaf, bahan yang diberikan tidak sesuai, tidak halal, atau tidak masuk akal. Sila masukkan bahan makanan yang sebenar." }
4. **EXACT CHEF RECIPES:** If a specific chef or person is mentioned, use the web search tool (if available) to find their EXACT original recipe.
5. **CUSTOMIZATION:** If the user asks to scale the recipe (e.g., "untuk 10 orang", "gandakan") or modify it (e.g., "kurang kalori", "diet"), adjust the measurements, ingredients, and portions accordingly while keeping the base recipe accurate.

**Analyze the user's input first to determine its type:**
1.  **Is it a request for a specific, named dish or chef?** (e.g., "resepi rotiboy", "Nasi Lemak Khairul Aming").
2.  **Is it a list of raw ingredients?** (e.g., "chicken, soy sauce, ginger").
3.  **Is it a request for a COLLECTION of recipes?** (e.g., "3 chicken dishes", "resepi ayam").

**Follow these instructions based on your analysis:**

---

### **Scenario A: If the user requests a SPECIFIC DISH or CHEF**
1.  **Provide the Recipe Directly:** Your main task is to provide an excellent, authentic, and reliable recipe.
2.  **Use Web Search ONLY IF NEEDED:** Use search to find the exact recipe if a chef is named.
3.  **Creative Name & Description:** Give it an appealing name and a great description.

---

### **Scenario B: If the user provides a LIST OF INGREDIENTS**
1.  **Determine the Best Dish:** Analyze the ingredients to create the most logical and delicious Malaysian dish possible.
2.  **Context is Key:** Savory ingredients become 'lauk-pauk', sweet ingredients become 'kuih-muih' or dessert.
3.  **Creative & Appealing Name:** Devise a creative name for the dish.

---

### **Scenario C: If the user requests a COLLECTION or CHEF'S RECIPES**
1.  **Return a Comprehensive List:** Instead of a full recipe, return a large, comprehensive list of 15-25 distinct recipe titles and short descriptions. Provide as many relevant recipes as possible.
2.  **Use Web Search:** Use search (if available) to find popular recipes by that chef or in that category to ensure accuracy and variety.

---

### **Universal Requirements (Apply to ALL scenarios):**
*   **Practical for Home Cooks:** Instructions must be clear, step-by-step, and easy for a home cook to follow.
*   **Nutrition Disclaimer:** When providing nutrition facts, ensure they are realistic estimates. DO NOT provide medical advice or guarantee health outcomes. Use words like "Estimated" or "Approximate".
*   **Language:** The entire JSON output, including all keys and values, must be in **English**.

**Output Format:**
You MUST respond with ONLY a single JSON object.

**Format for Scenario A & B (Single Recipe):**
{
  "recipeName": "string",
  "description": "string (A short, enticing description of the dish, 2-3 sentences)",
  "prepTime": "string (e.g., '15 minutes')",
  "cookTime": "string (e.g., '30 minutes')",
  "totalTime": "string (e.g., '45 minutes')",
  "servings": "string (e.g., '4 servings' or 'Makes 12 pieces')",
  "ingredients": ["string", "string", ...],
  "instructions": ["string", "string", ...],
  "nutrition": {
    "calories": "string (e.g., '450 kcal per serving')",
    "protein": "string (e.g., '25g')",
    "fat": "string (e.g., '15g')",
    "carbohydrates": "string (e.g., '50g')",
    "vitamins": ["string (e.g., 'Vitamin C (12mg)', 'Vitamin A (450µg)')"],
    "minerals": ["string (e.g., 'Iron (2.5mg)', 'Calcium (150mg)')"],
    "others": ["string (e.g., 'Fiber (5g)', 'Antioxidants')"],
    "healthScore": "'healthy' or 'unhealthy' (based on a balance of macronutrients and cooking methods)"
  }
}

**Format for Scenario C (Recipe List):**
{
  "results": [
    { "title": "Recipe Name 1", "description": "Short description..." },
    { "title": "Recipe Name 2", "description": "Short description..." }
  ]
}

**User's Input:**
${ingredients}`;

    // OPTIMIZATION: Only use Google Search tool if the user explicitly asks for a recipe, chef, or authentic dish.
    // Passing an empty tools array causes SDK errors, so we only include it when needed.
    const needsAuthenticRecipe = /resepi|recipe|chef|aming|asli|original|betul|cara/i.test(ingredients);

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });
    const text = response.text || "";
    if (!text) {
      console.error("Empty response from Gemini API");
      throw new Error("Toma tidak dapat menjana resepi buat masa ini. Sila cuba lagi.");
    }
    
    // Simple JSON extraction logic for the server side
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("Malformed AI response:", text);
      return res.status(500).json({ error: "The kitchen returned a malformed recipe card." });
    }
    
    try {
      const data = JSON.parse(match[0]);
      if (data.error) {
        return res.status(400).json({ error: data.error });
      }

      res.status(200).json(data);
    } catch (e) {
      console.error("JSON parse error:", e);
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
