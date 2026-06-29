import { config, isOpenAiConfigured } from '../config.js';
import type { AiMealAnalysis, AppLanguage } from '../types.js';
import { createMockAnalysis } from './mock-analysis.js';

const systemPrompt = `You are Nutora, a nutrition analysis assistant.
Analyze a meal photo and return only realistic estimated nutrition data.
Prefer concise meal and ingredient names in the requested locale.
Never claim medical certainty. Use integer grams/calories.`;

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['mealName', 'mealType', 'estimatedCalories', 'proteinG', 'fatG', 'carbsG', 'confidenceScore', 'aiNotes', 'items'],
  properties: {
    mealName: { type: 'string' },
    mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'] },
    estimatedCalories: { type: 'number' },
    proteinG: { type: 'number' },
    fatG: { type: 'number' },
    carbsG: { type: 'number' },
    confidenceScore: { type: 'number' },
    aiNotes: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'estimatedWeightG', 'estimatedCalories', 'proteinG', 'fatG', 'carbsG', 'confidenceScore'],
        properties: {
          name: { type: 'string' },
          estimatedWeightG: { type: 'number' },
          estimatedCalories: { type: 'number' },
          proteinG: { type: 'number' },
          fatG: { type: 'number' },
          carbsG: { type: 'number' },
          confidenceScore: { type: 'number' }
        }
      }
    }
  }
};

const normalizeAnalysis = (analysis: AiMealAnalysis): AiMealAnalysis => ({
  ...analysis,
  estimatedCalories: Math.round(analysis.estimatedCalories),
  proteinG: Math.round(analysis.proteinG),
  fatG: Math.round(analysis.fatG),
  carbsG: Math.round(analysis.carbsG),
  confidenceScore: Math.max(0, Math.min(1, Number(analysis.confidenceScore || 0))),
  items: analysis.items.map((item) => ({
    ...item,
    estimatedWeightG: item.estimatedWeightG ? Math.round(item.estimatedWeightG) : undefined,
    estimatedCalories: Math.round(item.estimatedCalories),
    proteinG: Math.round(item.proteinG),
    fatG: Math.round(item.fatG),
    carbsG: Math.round(item.carbsG),
    confidenceScore: item.confidenceScore ? Math.max(0, Math.min(1, Number(item.confidenceScore))) : undefined
  }))
});

export const analyzeMealPhoto = async ({ photoUrl, locale }: { photoUrl: string; locale: AppLanguage }): Promise<AiMealAnalysis> => {
  if (!isOpenAiConfigured) {
    return createMockAnalysis(locale);
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: `Analyze this meal photo. Locale: ${locale}.` },
            { type: 'input_image', image_url: photoUrl }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'meal_analysis',
          strict: true,
          schema
        }
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${text}`);
  }

  const payload = await response.json() as { output_text?: string };
  if (!payload.output_text) throw new Error('OpenAI response did not include output_text.');

  return normalizeAnalysis(JSON.parse(payload.output_text) as AiMealAnalysis);
};
