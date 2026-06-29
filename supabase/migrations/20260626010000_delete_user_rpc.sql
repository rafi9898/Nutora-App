-- Funkcja RPC pozwalająca użytkownikowi na usunięcie własnego konta z tabeli auth.users
-- Ze względu na security definer uruchamia się z uprawnieniami twórcy funkcji (czyli superusera)
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usuwa użytkownika, który wywołuje tę funkcję
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
