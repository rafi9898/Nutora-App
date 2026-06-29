import type { AiMealAnalysis, AppLanguage } from '../types.js';

const names: Record<AppLanguage, string> = {
  pl: 'Kurczak z ryżem i warzywami',
  en: 'Chicken with rice and vegetables',
  es: 'Pollo con arroz y verduras',
  de: 'Hähnchen mit Reis und Gemüse',
  fr: 'Poulet avec riz et légumes',
  it: 'Pollo con riso e verdure',
  pt: 'Frango com arroz e legumes',
  uk: 'Курка з рисом і овочами'
};

const notes: Record<AppLanguage, string> = {
  pl: 'To lokalna analiza testowa z backendu. Podłącz OPENAI_API_KEY, aby używać prawdziwej analizy AI.',
  en: 'This is a local backend test analysis. Add OPENAI_API_KEY to use real AI analysis.',
  es: 'Este es un análisis local de prueba del backend. Añade OPENAI_API_KEY para usar IA real.',
  de: 'Dies ist eine lokale Backend-Testanalyse. Setze OPENAI_API_KEY, um echte KI-Analyse zu nutzen.',
  fr: 'Ceci est une analyse locale de test du backend. Ajoutez OPENAI_API_KEY pour utiliser la vraie IA.',
  it: 'Questa è un’analisi locale di test del backend. Aggiungi OPENAI_API_KEY per usare la vera IA.',
  pt: 'Esta é uma análise local de teste do backend. Adicione OPENAI_API_KEY para usar IA real.',
  uk: 'Це локальний тестовий аналіз backend. Додайте OPENAI_API_KEY, щоб використовувати справжній AI.'
};

export const createMockAnalysis = (locale: AppLanguage = 'pl'): AiMealAnalysis => ({
  mealName: names[locale] ?? names.en,
  mealType: 'lunch',
  estimatedCalories: 684,
  proteinG: 45,
  fatG: 18,
  carbsG: 74,
  confidenceScore: 0.72,
  aiNotes: notes[locale] ?? notes.en,
  items: [
    { name: 'Grilled chicken', estimatedWeightG: 160, estimatedCalories: 248, proteinG: 38, fatG: 6, carbsG: 0, confidenceScore: 0.82 },
    { name: 'White rice', estimatedWeightG: 180, estimatedCalories: 272, proteinG: 5, fatG: 1, carbsG: 60, confidenceScore: 0.7 },
    { name: 'Broccoli', estimatedWeightG: 120, estimatedCalories: 42, proteinG: 3, fatG: 0, carbsG: 8, confidenceScore: 0.68 },
    { name: 'Cream sauce', estimatedWeightG: 40, estimatedCalories: 52, proteinG: 1, fatG: 8, carbsG: 2, confidenceScore: 0.55 }
  ]
});
