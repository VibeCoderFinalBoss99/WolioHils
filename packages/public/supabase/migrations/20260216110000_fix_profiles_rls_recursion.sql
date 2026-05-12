-- Hindari rekursi RLS: policy yang SELECT dari `profiles` untuk cek admin
-- memicu evaluasi RLS lagi pada tabel yang sama → 500 di PostgREST.
-- Pakai fungsi SECURITY DEFINER (bypass RLS di dalam fungsi).

CREATE OR REPLACE FUNCTION public.jwt_profile_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.jwt_profile_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jwt_profile_is_admin() TO authenticated;

COMMENT ON FUNCTION public.jwt_profile_is_admin() IS 'True jika JWT = user dengan profiles.role admin; dipakai policy agar tidak rekursi';

DROP POLICY IF EXISTS "profiles_admin_full" ON public.profiles;
CREATE POLICY "profiles_admin_full"
ON public.profiles
FOR ALL
TO authenticated
USING (public.jwt_profile_is_admin())
WITH CHECK (public.jwt_profile_is_admin());

DROP POLICY IF EXISTS "bookings_admin_full" ON public.bookings;
CREATE POLICY "bookings_admin_full"
ON public.bookings
FOR ALL
TO authenticated
USING (public.jwt_profile_is_admin())
WITH CHECK (public.jwt_profile_is_admin());
