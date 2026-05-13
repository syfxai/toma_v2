import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';

async function testChat() {
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });
    
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

    try {
        const chat = ai.chats.create({
            model: 'gemini-flash-latest',
            history: [],
            config: {
                tools: [{ functionDeclarations: [triggerRecipeAppTool] }],
                systemInstruction: "You are Chef Toma."
            }
        });

        console.log("Sending message...");
        const response = await chat.sendMessage({ message: "hello toma" });
        console.log("Response text:", response.text);
        console.log("Function calls:", response.functionCalls);
    } catch (error) {
        console.error("Test Error:", error);
    }
}

testChat();
