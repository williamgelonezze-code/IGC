import { GoogleGenAI, GenerateContentParameters } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

interface GenerateWithFallbackOptions {
  contents: string;
  config?: any;
  preferredModel?: string;
}

export async function generateContentWithFallback({
  contents,
  config,
  preferredModel = 'gemini-3.8-flash',
}: GenerateWithFallbackOptions): Promise<string | null> {
  const client = getGeminiClient();
  if (!client) return null;

  const modelsToTry = [
    preferredModel,
    ...CANDIDATE_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config,
        });

        if (response?.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand') || msg.includes('429');

        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        break;
      }
    }
  }

  console.warn('Gemini generateContent fallback warning: All model attempts failed, utilizing offline intelligence engine. Reason:', lastError?.message || lastError);
  return null;
}
