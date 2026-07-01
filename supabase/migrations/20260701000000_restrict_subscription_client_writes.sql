DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can bootstrap own free subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own free subscription" ON public.subscriptions;

CREATE POLICY "Users can insert own free subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND tier = 'free'
    AND status = 'inactive'
    AND (provider IS NULL OR provider = 'manual')
    AND (analysis_limit_monthly IS NULL OR analysis_limit_monthly <= 5)
  );
