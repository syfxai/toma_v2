import type { Recipe, RecipeList, GenAIResponse, NutritionFacts } from '../types';

const cleanCitations = (str: any) => (typeof str === 'string') ? str.replace(/\s*\[[\d,\s]+\]/g, '').trim() : str;

const stringifyRecipeValue = (value: any): string => {
  if (typeof value === 'string') return cleanCitations(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (!value) return '';

  if (typeof value === 'object') {
    const item = value.item || value.name || value.ingredient || value.step || value.instruction || value.nutrient;
    const quantity = value.quantity || value.amount || value.value;
    const unit = value.unit;

    if (item && quantity && unit) return cleanCitations(`${quantity} ${unit} ${item}`);
    if (item && quantity) return cleanCitations(`${quantity} ${item}`);
    if (item) return cleanCitations(String(item));
    if (value.text) return cleanCitations(String(value.text));
  }

  return cleanCitations(JSON.stringify(value));
};

const normalizeStringArray = (items: any): string[] => {
  if (!Array.isArray(items)) return [];
  return items.map(stringifyRecipeValue).filter(Boolean);
};

export const normalizeGenAIResponse = (data: any): GenAIResponse => {
  if (data.results && Array.isArray(data.results)) {
    data.results = data.results.map((r: any) => ({
      title: stringifyRecipeValue(r.title),
      description: stringifyRecipeValue(r.description)
    }));
    return data as RecipeList;
  }

  const recipe = data as Recipe;
  if (recipe.recipeName) recipe.recipeName = stringifyRecipeValue(recipe.recipeName);
  if (recipe.description) recipe.description = stringifyRecipeValue(recipe.description);
  if (recipe.prepTime) recipe.prepTime = stringifyRecipeValue(recipe.prepTime);
  if (recipe.cookTime) recipe.cookTime = stringifyRecipeValue(recipe.cookTime);
  if (recipe.totalTime) recipe.totalTime = stringifyRecipeValue(recipe.totalTime);
  if (recipe.servings) recipe.servings = stringifyRecipeValue(recipe.servings);
  recipe.ingredients = normalizeStringArray(recipe.ingredients);
  recipe.instructions = normalizeStringArray(recipe.instructions);

  if (recipe.nutrition) {
    const nutrition = recipe.nutrition as NutritionFacts;
    nutrition.calories = stringifyRecipeValue(nutrition.calories);
    nutrition.protein = stringifyRecipeValue(nutrition.protein);
    nutrition.fat = stringifyRecipeValue(nutrition.fat);
    nutrition.carbohydrates = stringifyRecipeValue(nutrition.carbohydrates);
    nutrition.vitamins = normalizeStringArray(nutrition.vitamins);
    nutrition.minerals = normalizeStringArray(nutrition.minerals);
    nutrition.others = normalizeStringArray(nutrition.others);
  }

  return recipe;
};

export const generateRecipe = async (ingredients: string): Promise<GenAIResponse> => {
  try {
    const response = await fetch('/api/generateRecipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 429 || errorData.error === 'RATE_LIMIT_REACHED') {
        throw new Error("RATE_LIMIT_REACHED");
      }
      throw new Error(errorData.error || "Could not get a recipe from the kitchen.");
    }

    const data = await response.json();
    return normalizeGenAIResponse(data);
  } catch (error: any) {
    console.error("Error generating recipe:", error);
    throw error;
  }
};

export const translateContent = async (content: object, languageName: string): Promise<any> => {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, languageName })
    });

    if (!response.ok) {
      throw new Error("Failed to translate content.");
    }

    return normalizeGenAIResponse(await response.json());
  } catch (error) {
    console.error(`Error translating content to ${languageName}:`, error);
    throw new Error(`Failed to translate content. Please try a different language.`);
  }
};

export const createChatSession = (languageName: string): any => {
  let history: any[] = [];
  
  return {
    sendMessageStream: async ({ message }: { message: string }) => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history, languageName })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "Chat failed");
        }

        const data = await response.json();

        // Update history for next turn
        history.push({ role: 'user', parts: [{ text: message }] });
        if (data.text) {
          history.push({ role: 'model', parts: [{ text: data.text }] });
        }

        // Return async iterator to mimic the SDK's streaming response
        // Note: Real streaming would require ReadableStream handling, 
        // but this mock works for the UI's current expectations.
        return (async function* () {
          yield {
            text: data.text,
            functionCalls: data.functionCalls
          };
        })();
      } catch (error) {
        console.error("Error in sendMessageStream:", error);
        throw error;
      }
    }
  };
};

export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64 })
    });

    if (!response.ok) {
      throw new Error("Transcription failed");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio.");
  }
};
