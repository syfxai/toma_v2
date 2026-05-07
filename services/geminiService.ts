import type { Recipe, RecipeList, GenAIResponse } from '../types';

const cleanCitations = (str: string) => str ? str.replace(/\s*\[[\d,\s]+\]/g, '').trim() : str;

const processResponseData = (data: any): GenAIResponse => {
  if (data.results && Array.isArray(data.results)) {
    data.results = data.results.map((r: any) => ({
      title: cleanCitations(r.title),
      description: cleanCitations(r.description)
    }));
    return data as RecipeList;
  }

  const recipe = data as Recipe;
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
    return processResponseData(data);
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

    return await response.json();
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
          throw new Error("Chat failed");
        }

        const data = await response.json();

        // Update history for next turn
        history.push({ role: 'user', parts: [{ text: message }] });
        history.push({ role: 'model', parts: [{ text: data.text }] });

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