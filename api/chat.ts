const GROQ_CHAT_MODELS = [
  process.env.GROQ_CHAT_MODEL,
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-20b',
].filter(Boolean) as string[];

const isFallbackableGroqError = (status: number, message: string) =>
  status === 404 ||
  status === 429 ||
  message.includes('not found') ||
  message.includes('rate limit') ||
  message.includes('quota');

const toGroqMessages = (history: any[] = [], message: string, languageName?: string) => {
  const messages = [
    {
      role: 'system',
      content: `You are Chef Toma, a world-class culinary expert.
Tone: Extremely warm, casual, and human. Act like a caring best friend who happens to be a top chef.
Format: Chat-style, very concise, 1-3 short sentences. Use Manglish or informal Malay particles like je, lah, kan, kot when appropriate.
Personality: Enthusiastic but grounded. Use appropriate emojis. No robotic preamble.
Language: ${languageName || 'Bahasa Melayu'}. Detect user language and adapt seamlessly.
If the user explicitly asks to create, generate, or show a recipe card, call the triggerRecipeApp tool with the ingredients or dish name.`,
    },
    ...history.map((item: any) => ({
      role: item.role === 'model' ? 'assistant' : 'user',
      content: item.parts?.map((part: any) => part.text).filter(Boolean).join('\n') || '',
    })).filter((item: any) => item.content),
    { role: 'user', content: message },
  ];

  return messages;
};

async function createGroqChatCompletion(body: any) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing on the server');
  }

  let lastError = 'Groq chat failed.';

  for (const model of GROQ_CHAT_MODELS) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        model,
      }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      return data;
    }

    lastError = data?.error?.message || data?.error || response.statusText || lastError;
    console.error(`Groq chat model ${model} failed:`, response.status, lastError);

    if (!isFallbackableGroqError(response.status, String(lastError).toLowerCase())) {
      throw new Error(String(lastError));
    }
  }

  throw new Error(String(lastError));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history, languageName } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const completion = await createGroqChatCompletion({
      messages: toGroqMessages(history, message, languageName),
      temperature: 0.7,
      max_completion_tokens: 300,
      tool_choice: 'auto',
      tools: [
        {
          type: 'function',
          function: {
            name: 'triggerRecipeApp',
            description: 'Triggers the main recipe generator app with a list of ingredients or a dish name. Use this when the user explicitly asks to create, generate, or show a recipe card.',
            parameters: {
              type: 'object',
              properties: {
                ingredients: {
                  type: 'string',
                  description: "The list of ingredients or the name of the dish to generate a recipe for, for example 'chicken, rice' or 'Nasi Lemak'.",
                },
              },
              required: ['ingredients'],
            },
          },
        },
      ],
    });

    const assistantMessage = completion?.choices?.[0]?.message || {};
    const functionCalls = (assistantMessage.tool_calls || [])
      .filter((toolCall: any) => toolCall.type === 'function')
      .map((toolCall: any) => {
        let args = {};
        try {
          args = JSON.parse(toolCall.function?.arguments || '{}');
        } catch {
          args = {};
        }

        return {
          name: toolCall.function?.name,
          args,
        };
      });

    const text = assistantMessage.content || "";

    if (!text && functionCalls.length === 0) {
      throw new Error("Maaf, Toma tidak dapat membalas sekarang.");
    }

    res.status(200).json({
      text,
      functionCalls,
    });
  } catch (error: any) {
    console.error("Groq chat API error:", error?.message || error);
    res.status(500).json({ error: error?.message || "Failed to process chat message." });
  }
}
