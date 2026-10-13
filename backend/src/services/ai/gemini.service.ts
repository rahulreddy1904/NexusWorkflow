import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class GeminiServiceError extends Error {
  constructor(message: string, public code: string, public status: number = 500) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private model: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor() {
    this.model = env.GEMINI_MODEL || 'gemini-3.8-flash';
    this.timeoutMs = env.GEMINI_TIMEOUT_MS || 30000;
    this.maxRetries = env.GEMINI_MAX_RETRIES || 3;

    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
      try {
        this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY.trim() });
      } catch (err: any) {
        logger.error('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  public isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
  }

  public async generateStructured<T = any>(prompt: string, systemInstruction?: string): Promise<T> {
    if (!this.isConfigured() || !this.client) {
      throw new GeminiServiceError(
        'Gemini API key is not configured. Add GEMINI_API_KEY in backend/.env to enable live AI reasoning.',
        'GEMINI_KEY_MISSING',
        503
      );
    }

    const candidateModels = [this.model, 'gemini-2.5-flash', 'gemini-1.5-flash'];
    // Deduplicate models
    const uniqueModels = [...new Set(candidateModels)];

    let lastError: any = null;

    for (const modelToTry of uniqueModels) {
      try {
        logger.info(`Invoking Gemini model '${modelToTry}'`);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini API call timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
        );

        const callPromise = this.client.models.generateContent({
          model: modelToTry,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || 'You are an autonomous operations orchestration engine. Output valid JSON only.',
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const response: any = await Promise.race([callPromise, timeoutPromise]);
        const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text);

        if (!text) {
          throw new Error('Gemini returned an empty response.');
        }

        const cleaned = text.trim().replace(/^```json\s*/, '').replace(/```$/, '');
        return JSON.parse(cleaned) as T;
      } catch (err: any) {
        lastError = err;
        logger.warn(`Gemini call with '${modelToTry}' failed: ${err.message}`);

        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('401')) {
          throw new GeminiServiceError('Invalid Gemini API key provided.', 'GEMINI_KEY_INVALID', 401);
        }

        // If 503 high demand or 404, loop will try next candidate model (e.g. gemini-2.5-flash)
      }
    }

    throw new GeminiServiceError(
      `Gemini request failed across models: ${lastError?.message}`,
      'GEMINI_UNAVAILABLE',
      502
    );
  }
}

export const geminiService = new GeminiService();
