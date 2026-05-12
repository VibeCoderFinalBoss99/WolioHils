-- Perbaikan: promosi admin dari SQL Editor gagal karena auth.uid() NULL,
-- trigger profiles_lock_role mengembalikan role ke nilai lama.
-- Jalankan sekali di Supabase (SQL Editor / db push).

CREATE OR REPLACE FUNCTION public.profiles_prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_actor_admin boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;
  -- Dashboard SQL / service_role: tidak ada JWT → biarkan UPDATE (promosi admin manual).
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) INTO is_actor_admin;
  IF NOT is_actor_admin THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;
