# revenuecat-webhook

Supabase Edge Function that receives RevenueCat webhook events and updates `subscriptions`.

## Secrets

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set REVENUECAT_WEBHOOK_SECRET=...
supabase secrets set FREE_ANALYSIS_LIMIT=5
```

## Deploy

```bash
supabase functions deploy revenuecat-webhook
```

Set this function URL as a RevenueCat webhook and send the shared secret in the `Authorization: Bearer ...` header.

Important: RevenueCat `app_user_id` should be the Supabase `auth.users.id`.
