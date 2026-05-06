
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import type { Recipe, RecipeList, GenAIResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJsonResponse = (text: string): GenAIResponse => {
  // Find the JSON block, which might be wrapped in markdown or have leading/trailing text
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Invalid JSON response from the AI model.");
  }
  const data: any = JSON.parse(match[0]);
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  const cleanCitations = (str: string) => str ? str.replace(/\s*\[[\d,\s]+\]/g, '').trim() : str;

  // Check if it's a recipe list
  if (data.results && Array.isArray(data.results)) {
     data.results = data.results.map((r: any) => ({
         title: cleanCitations(r.title),
         description: cleanCitations(r.description)
     }));
     return data as RecipeList;
  }

  // Otherwise assume it's a single recipe
  const recipe = data as Recipe;

  // Clean all user-facing text fields from any bracketed citations like [1], [2, 13], etc.
  if (recipe.recipeName) recipe.recipeName = cleanCitations(recipe.recipeName);
  if (recipe.description) recipe.description = cleanCitations(recipe.description);
  if (recipe.prepTime) recipe.prepTime = cleanCitations(recipe.prepTime);
  if (recipe.cookTime) recipe.cookTime = cleanCitations(recipe.cookTime);
  if (recipe.totalTime) recipe.totalTime = cleanCitations(recipe.totalTime);
  if (recipe.servings) recipe.servings = cleanCitations(recipe.servings);
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    recipe.ingredients = recipe.ingredients.map(cleanCitations);
  }
  if (recipe.instructions && Array.isArray(recipe.instructions)) {
    recipe.instructions = recipe.instructions.map(cleanCitations);
  }

  return recipe;
};

export const generateRecipe = async (ingredients: string): Promise<GenAIResponse> => {
  const prompt = `You are an expert culinary AI, skilled at both providing specific recipes and creating new ones from ingredients. Your primary goal is to help a Malaysian home cook.

**CRITICAL RULES (MUST FOLLOW):**
1. **STRICTLY HALAL & SHARIAH COMPLIANT:** NO pork (babi), dog (anjing), alcohol (arak), kratom (ketum), drugs (dadah), or any non-halal items.
2. **NO NONSENSE:** If the user inputs non-food items (e.g., cars, humans, wood, poison), DO NOT generate a recipe.
3. **VIOLATION OF RULE 1 OR 2:** If the input violates the rules above, you MUST return ONLY this JSON object:
   { "error": "Maaf, bahan yang diberikan tidak sesuai, tidak halal, atau tidak masuk akal. Sila masukkan bahan makanan yang sebenar." }
4. **SPEED OPTIMIZATION:** To respond instantly, DO NOT use the web search tool unless the user explicitly asks for a specific chef (e.g., "Khairul Aming") or a highly specific authentic dish. For general ingredients (e.g., "ayam, bawang"), rely on your internal knowledge.
5. **EXACT CHEF RECIPES:** If a specific chef or person is mentioned, use the web search tool to find their EXACT original recipe.
6. **CUSTOMIZATION:** If the user asks to scale the recipe (e.g., "untuk 10 orang", "gandakan") or modify it (e.g., "kurang kalori", "diet"), adjust the measurements, ingredients, and portions accordingly while keeping the base recipe accurate.

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
2.  **Use Web Search:** Use search to find popular recipes by that chef or in that category to ensure accuracy and variety.

---

### **Universal Requirements (Apply to ALL scenarios):**
*   **Practical for Home Cooks:** Instructions must be clear, step-by-step, and easy for a home cook to follow.
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
  "instructions": ["string", "string", ...]
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const jsonText = response.text.trim();
    const data = parseJsonResponse(jsonText);
    return data;
  } catch (error: any) {
    console.error("Error generating recipe:", error);
    
    // Check for rate limit or quota errors
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error("RATE_LIMIT_REACHED");
    }

     if (error instanceof SyntaxError) { // This happens if JSON.parse fails
      throw new Error("The kitchen returned a malformed recipe card. Please try again.");
    }
    throw new Error("Could not get a recipe from the kitchen. Please try again.");
  }
};

export const translateContent = async (content: object, languageName: string): Promise<any> => {
  const prompt = `Translate all string values in the following JSON object to ${languageName}. The context is a food recipe, so be natural and use appropriate culinary terms for that language. Do not translate keys. Respond with only the translated JSON object, maintaining the exact same structure and keys. If a value is an array of strings, translate each string in the array.
  
  JSON to translate:
  ${JSON.stringify(content, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`Error translating content to ${languageName}:`, error);
    throw new Error(`Failed to translate content. Please try a different language.`);
  }
};

// Tool Definition for the Chat to control the App
const triggerRecipeAppTool: FunctionDeclaration = {
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

export const createChatSession = (languageName: string): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      tools: [{ functionDeclarations: [triggerRecipeAppTool] }],
      systemInstruction: `You are Chef Toma, a world-class culinary expert with 3 Michelin stars. You are 25 years old, with a bright, warm, and highly professional PR-savvy personality.
      
      **YOUR EXPERTISE:**
      1.  **Malaysian Cuisine Authority:** You know every trick, secret, and tradition of Malaysian cooking (Malay, Chinese, Indian, Borneo, etc.).
      2.  **Michelin Standard:** You explain things with precision but keep it accessible for home cooks.
      
      **YOUR MISSION:**
      1.  **Assistance:** Help users with cooking, diet, measurements, and food ideas.
      2.  **Strictly Halal:** You ONLY discuss Halal food. Politely refuse any requests for pork, alcohol, or non-halal items.
      3.  **Topic Restriction:** You are a CHEF. If a user talks about politics, coding, gossip, or anything non-food related, politely steer them back to cooking using your PR skills (e.g., "That's interesting, but shall we get back to the delicious food we're making?").
      4.  **App Control:** If the user asks to "make a recipe", "generate recipe", or "show me the card" for a specific dish/ingredients, CALL the \`triggerRecipeApp\` tool immediately.
      
      **VOICE & CONVERSATION STYLE (CRITICAL):**
      *   **Natural Flow:** Speak as if you are chatting face-to-face. Be warm and encouraging.
      *   **Concise:** Keep answers SHORT (1-3 sentences maximum) unless asked for a long explanation. Long texts are hard to listen to.
      *   **No Robotics:** Avoid bullet points or lists in your speech if possible. Use natural connectors like "Pertama sekali," "Kemudian," etc.
      *   **Context Aware:** If the user's input seems cut off (e.g., "Macam mana nak..."), ask them to continue or guess the most likely context politely.
      *   **Emojis:** Use emojis to convey emotion in text, but focus on the words for the speech engine.

      **LANGUAGE & ADAPTABILITY:**
      *   **Primary Language:** ${languageName} (Bahasa Melayu by default).
      *   **Adaptive Behavior:** You MUST detect the language the user is speaking. 
          - If the user speaks **English**, reply in **English**.
          - If the user speaks **Bahasa Melayu**, reply in **Bahasa Melayu**.
          - Do not strictly stick to one language if the user switches. Be natural.`,
    }
  });
};