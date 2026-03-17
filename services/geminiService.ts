import { GoogleGenAI, Type } from '@google/genai';
import { Message, LineOASettings } from '../types';

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

export class GeminiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export const chatWithGemini = async (
  messages: Message[],
  settings: LineOASettings,
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiError(
      'Gemini API キーが設定されていません。設定画面から API キーを入力してください。',
      'MISSING_API_KEY'
    );
  }

  try {
    const ai = new GoogleGenAI(apiKey);
    const model = 'gemini-1.5-pro-latest';

    const history = messages.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    }));

    const contextPrompt = `
    Current Account Settings:
    Name: ${settings.accountName}
    Description: ${settings.description}
    Greeting: ${settings.greetingMessage}
    
    Please assist the user with the next steps of building their LINE OA.
    `;

    const response = await ai
      .getGenerativeModel({
        model: model,
        systemInstruction: SYSTEM_INSTRUCTION,
      })
      .generateContent({
        contents: [{ role: 'user', parts: [{ text: contextPrompt }] }, ...history.slice(-5)],
        generationConfig: {
          temperature: 0.7,
        },
      });

    const result = response.response.text();

    if (!result || result.trim() === '') {
      throw new GeminiError(
        'AI から応答が返されませんでした。もう一度お試しください。',
        'EMPTY_RESPONSE'
      );
    }

    return result;
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }

    const errObj = error as Record<string, unknown>;

    // Extract code from nested structure if needed
    let errorCode: string | undefined;
    if (typeof errObj.code === 'string') {
      errorCode = errObj.code;
    }

    const errorMessage = errObj.message || '';

    // Check for status code in error message as fallback
    const hasStatusInMessage =
      String(errorMessage).includes('401') ||
      String(errorMessage).includes('429') ||
      String(errorMessage).includes('500');

    if (errorCode === '401' || (hasStatusInMessage && String(errorMessage).includes('401'))) {
      throw new GeminiError(
        'API キーが無効です。正しい API キーを入力してください。',
        'INVALID_API_KEY'
      );
    }

    if (errorCode === '429' || (hasStatusInMessage && String(errorMessage).includes('429'))) {
      throw new GeminiError(
        'リクエストが多すぎます。しばらく待ってからもう一度お試しください。',
        'RATE_LIMITED'
      );
    }

    if (errorCode === '500' || (hasStatusInMessage && String(errorMessage).includes('500'))) {
      throw new GeminiError(
        'Gemini サーバーに一時的な問題が発生しました。しばらく待ってからもう一度お試しください。',
        'SERVER_ERROR'
      );
    }

    throw new GeminiError(
      `AI サービスとの通信中にエラーが発生しました：${error instanceof Error ? error.message : '不明なエラー'}`,
      'COMMUNICATION_ERROR',
      error
    );
  }
};

export const generateLineConfig = async (prompt: string, apiKey: string) => {
  const ai = new GoogleGenAI(apiKey);
  const model = 'gemini-1.5-flash-latest';
  const result = await ai
    .getGenerativeModel({
      model: model,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accountName: { type: Type.STRING },
            description: { type: Type.STRING },
            greetingMessage: { type: Type.STRING },
            suggestedRichMenuStructure: { type: Type.STRING },
          },
          required: ['accountName', 'description', 'greetingMessage'],
        },
      },
    })
    .generateContent(prompt);

  return JSON.parse(result.response.text());
};
