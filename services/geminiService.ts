
import { GoogleGenAI, Type } from "@google/genai";
import { Message, LineOASettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const SYSTEM_INSTRUCTION = `
You are a world-class expert in LINE Official Account (OA) architecture and the Messaging API. 
Your goal is to help users build a high-converting LINE Official Account interactively.

Guidelines:
1. Provide strategic advice for account structure.
2. Generate LINE Flex Message JSON or Rich Menu JSON when requested.
3. Help with technical setup (Webhooks, Channel access tokens, etc.).
4. Keep answers concise but professional.
5. You can speak Japanese as the user requested in Japanese.

If you generate JSON for LINE, wrap it in markdown code blocks labeled with the specific type (e.g., \`\`\`json).
Always encourage best practices like using Rich Menus for high CTA and Flex Messages for beautiful UI.
`;

export const chatWithGemini = async (messages: Message[], settings: LineOASettings) => {
  const model = "gemini-3-pro-preview";
  
  const history = messages.map(m => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.content }]
  }));

  const contextPrompt = `
  Current Account Settings:
  Name: ${settings.accountName}
  Description: ${settings.description}
  Greeting: ${settings.greetingMessage}
  
  Please assist the user with the next steps of building their LINE OA.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: [
      { role: 'user', parts: [{ text: contextPrompt }] },
      ...history.slice(-5) // Send last 5 for context
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    }
  });

  return response.text;
};

export const generateLineConfig = async (prompt: string) => {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model: model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          accountName: { type: Type.STRING },
          description: { type: Type.STRING },
          greetingMessage: { type: Type.STRING },
          suggestedRichMenuStructure: { type: Type.STRING }
        },
        required: ["accountName", "description", "greetingMessage"]
      }
    }
  });
  
  return JSON.parse(response.text);
};
