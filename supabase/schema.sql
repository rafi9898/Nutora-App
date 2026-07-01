-- Nutora proposed Supabase schema.
-- This is a backend-ready draft. The app still runs on local mocked data.

create extension if not exists "pgcrypto";

create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack', 'other');
create type public.user_goal as enum ('lose_weight', 'maintain', 'gain_weight');
create type public.subscription_tier as enum ('free', 'premium');
create type public.analysis_status as enum ('pending', 'completed', 'failed');
create type public.subscription_status as enum ('active', 'inactive', 'trialing', 'cancelled', 'expired');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  name text not null,
  gender text,
  age integer check (age between 1 and 130),
  height_cm integer check (height_cm between 50 and 260),
  weight_kg numeric(6, 2) check (weight_kg > 0),
  goal public.user_goal not null default 'maintain',
  activity_level text not null default 'medium' check (activity_level in ('low', 'medium', 'high')),
  daily_calorie_goal integer not null default 2200,
  protein_goal_g integer not null default 150,
  fat_goal_g integer not null default 70,
  carbs_goal_g integer not null default 250,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  photo_url text,
  meal_name text not null,
  meal_type public.meal_type not null default 'other',
  estimated_calories integer not null check (estimated_calories >= 0),
  protein_g integer not null default 0 check (protein_g >= 0),
  fat_g integer not null default 0 check (fat_g >= 0),
  carbs_g integer not null default 0 check (carbs_g >= 0),
  confidence_score numeric(4, 3) check (confidence_score between 0 and 1),
  ai_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  estimated_weight_g integer check (estimated_weight_g >= 0),
  estimated_calories integer not null check (estimated_calories >= 0),
  protein_g integer not null default 0 check (protein_g >= 0),
  fat_g integer not null default 0 check (fat_g >= 0),
  carbs_g integer not null default 0 check (carbs_g >= 0),
  confidence_score numeric(4, 3) check (confidence_score between 0 and 1),
  created_at timestamptz not null default now()
);

create table public.ai_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_id uuid references public.meals(id) on delete set null,
  photo_url text,
  status public.analysis_status not null default 'pending',
  provider text,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  provider text check (provider in ('revenuecat', 'manual')),
  provider_customer_id text,
  status public.subscription_status not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  analyses_used_month integer not null default 0 check (analyses_used_month >= 0),
  analysis_limit_monthly integer default 5 check (analysis_limit_monthly is null or analysis_limit_monthly >= 0),
  usage_month text not null default to_char(now(), 'YYYY-MM'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meals_user_created_at_idx on public.meals(user_id, created_at desc);
create index meal_items_meal_id_idx on public.meal_items(meal_id);
create index ai_analysis_logs_user_created_at_idx on public.ai_analysis_logs(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.ai_analysis_logs enable row level security;
alter table public.subscriptions enable row level security;

create policy "Users can read own user row" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own user row" on public.users
  for update using (auth.uid() = id);

create policy "Users can manage own profile" on public.user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own meals" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own meal items" on public.meal_items
  for all using (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id and meals.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id and meals.user_id = auth.uid()
    )
  );

create policy "Users can read own analysis logs" on public.ai_analysis_logs
  for select using (auth.uid() = user_id);

create policy "Backend can insert analysis logs" on public.ai_analysis_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- TODO: In production, subscription writes should be handled by RevenueCat
-- webhooks / service-role backend code, not by regular mobile clients.
create policy "Users can insert own free subscription" on public.subscriptions
  for insert with check (
    auth.uid() = user_id
    and tier = 'free'
    and status = 'inactive'
    and (provider is null or provider = 'manual')
    and (analysis_limit_monthly is null or analysis_limit_monthly <= 5)
  );

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  insert into public.user_profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));

  insert into public.subscriptions (user_id, tier, status)
  values (new.id, 'free', 'inactive');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Storage bucket proposal for meal photos.
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;

create policy "Users can upload own meal photos" on storage.objects
  for insert with check (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own meal photos" on storage.objects
  for update using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own meal photos" on storage.objects
  for delete using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Meal photos are publicly readable" on storage.objects
  for select using (bucket_id = 'meal-photos');

-- OPEN FOOD FACTS LOCAL CACHE
create table public.off_products (
  barcode text primary key,
  product_name text not null,
  product_name_pl text,
  image_url text,
  calories numeric(6, 2),
  proteins numeric(6, 2),
  fats numeric(6, 2),
  carbs numeric(6, 2),
  quantity numeric(6, 2),
  search_tokens tsvector generated always as (
    to_tsvector('simple', coalesce(product_name_pl, '') || ' ' || coalesce(product_name, ''))
  ) stored,
  created_at timestamptz not null default now()
);

create index off_products_search_idx on public.off_products using gin(search_tokens);

-- Enable public read access for the app
alter table public.off_products enable row level security;
create policy "Anyone can read off_products" on public.off_products
  for select using (true);
