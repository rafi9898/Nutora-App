# Nutora Backend

Backend VPS-ready dla aplikacji Nutora — AI Calorie Tracker from Photos.

Na tym etapie backend działa lokalnie i jest gotowy do późniejszego deploymentu na VPS przez Docker.

## Dane produktu

- App name: `Nutora`
- Android package: `io.nutora.app`
- iOS bundle identifier: `io.nutora.app`
- URL scheme: `nutora`
- Deep link: `nutora://`
- Website: `https://nutora.pro`
- API: `https://api.nutora.pro`
- Admin panel: `https://api.nutora.pro/admin`
- Support / Contact: `contact@nutora.pro`
- Privacy Policy: `https://nutora.pro/privacy`
- Terms of Service: `https://nutora.pro/terms`

## Funkcje

- `GET /health` — healthcheck.
- `POST /ai/analyze-meal` — bezpieczne proxy do analizy AI.
- `POST /webhooks/revenuecat` — webhook RevenueCat do aktualizacji Premium.
- Supabase service role wyłącznie po stronie backendu.
- Limit darmowych analiz miesięcznie: `5`.
- Mock AI fallback, gdy `OPENAI_API_KEY` nie jest ustawiony.
- Dockerfile i docker-compose pod VPS.

## RevenueCat

- Entitlement: `premium`
- Monthly product ID: `nutora_premium_monthly`
- Yearly product ID: `nutora_premium_yearly`

Webhook URL:

```text
https://api.nutora.pro/webhooks/revenuecat
```

W RevenueCat ustaw sekret taki sam jak `REVENUECAT_WEBHOOK_SECRET`.

## Supabase

- Storage bucket: `meal-photos`

Backend używa `SUPABASE_SERVICE_ROLE_KEY`, który musi zostać wyłącznie po stronie serwera.

## Uruchomienie lokalne

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Healthcheck:

```bash
curl http://localhost:4000/health
```

Test analizy lokalnej bez OpenAI/Supabase:

```bash
curl -X POST http://localhost:4000/ai/analyze-meal \
  -H "Content-Type: application/json" \
  -d '{"photoUrl":"https://example.com/meal.jpg","locale":"pl","userId":"dev-user"}'
```

W trybie produkcyjnym ustaw `ALLOW_DEV_AUTH_BYPASS=false` i wysyłaj token użytkownika:

```http
Authorization: Bearer <supabase-access-token>
```

## Zmienne środowiskowe

Zobacz [`.env.example`](./.env.example).

Najważniejsze:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `REVENUECAT_WEBHOOK_SECRET`
- `FREE_ANALYSIS_LIMIT=5`

`SUPABASE_SERVICE_ROLE_KEY` i `OPENAI_API_KEY` nigdy nie mogą trafić do aplikacji mobilnej.

## Podłączenie aplikacji Expo

Produkcyjnie:

```env
EXPO_PUBLIC_AI_ANALYSIS_MODE=backend
EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT=https://api.nutora.pro/ai/analyze-meal
```

Lokalnie na symulatorze:

```env
EXPO_PUBLIC_AI_ANALYSIS_MODE=backend
EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT=http://localhost:4000/ai/analyze-meal
```

Lokalnie na fizycznym telefonie zamiast `localhost` użyj adresu LAN komputera, np.:

```env
EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT=http://192.168.7.113:4000/ai/analyze-meal
```

## Deployment na VPS później

Kiedy kupisz VPS:

1. Wrzucasz repo na serwer.
2. Wchodzisz do `backend/`.
3. Tworzysz `.env` na podstawie `.env.example`.
4. Uruchamiasz:

```bash
docker compose up -d --build
```

5. Podpinasz domenę `api.nutora.pro` przez Caddy/Nginx i SSL.
6. W Expo zostawiasz:

```env
EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT=https://api.nutora.pro/ai/analyze-meal
```
