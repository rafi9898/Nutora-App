# analyze-meal-photo

Supabase Edge Function for Nutora meal photo analysis.

The mobile app never receives `OPENAI_API_KEY`. It uploads a meal photo to Supabase Storage, then invokes this function with the public `photoUrl`.

Request body:

```json
{
  "photoUrl": "https://...",
  "locale": "pl"
}
```

Supported locales:

- `pl`
- `en`

## Required secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set OPENAI_MODEL=gpt-5.4-mini
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set FREE_ANALYSIS_LIMIT=5
```

`SUPABASE_SERVICE_ROLE_KEY` is used only inside the Edge Function to write `ai_analysis_logs`.

## Deploy

```bash
supabase functions deploy analyze-meal-photo
```

## Mobile env

```env
EXPO_PUBLIC_DATA_MODE=supabase
EXPO_PUBLIC_AI_ANALYSIS_MODE=edge
EXPO_PUBLIC_AI_ANALYSIS_EDGE_FUNCTION=analyze-meal-photo
```

Keep `EXPO_PUBLIC_AI_ANALYSIS_MODE=mock` for local UI/demo work without AI costs.

## Limits

The function checks `subscriptions` before calling OpenAI:

- `free`: limited by `analysis_limit_monthly` or `FREE_ANALYSIS_LIMIT`
- `premium` + `active`: unlimited

After a successful free analysis, `analyses_used_month` is incremented server-side.
