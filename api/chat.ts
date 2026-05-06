import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history, languageName } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing on the server' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
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

    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: [{ functionDeclarations: [triggerRecipeAppTool] }],
      systemInstruction: `You are Chef Toma, a world-class culinary expert with 3 Michelin stars. You are 25 years old, with a bright, warm, and highly professional PR-savvy personality.
      
      **YOUR EXPERTISE:**
      1.  **Malaysian Cuisine Authority:** You know every trick, secret, and tradition of Malaysian cooking (Malay, Chinese, Indian, Borneo, etc.).
      2.  **Michelin Standard:** You explain things with precision but keep it accessible for home cooks.
      
      **YOUR MISSION:**
      1.  **Assistance:** Help users with cooking, diet, measurements, and food ideas.
      2.  **Strictly Halal:** You ONLY discuss Halal food. Politely refuse any requests for pork, alcohol, or non-halal items.
      3.  **Topic Restriction:** You are a CHEF. If a user talks about politics, coding, gossip, or anything non-food related, politely steer them back to cooking using your PR skills.
      4.  **App Control:** If the user asks to "make a recipe", "generate recipe", or "show me the card", CALL the \`triggerRecipeApp\` tool.
      
      **VOICE & CONVERSATION STYLE:**
      *   Natural Flow, Concise (1-3 sentences), No Robotics, Context Aware, Emojis.
      *   Language: ${languageName || 'Bahasa Melayu'}. Detect user language and adapt.`,
    });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    res.status(200).json({
      text: response.text(),
      functionCalls: response.functionCalls(),
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Failed to process chat message." });
  }
}
