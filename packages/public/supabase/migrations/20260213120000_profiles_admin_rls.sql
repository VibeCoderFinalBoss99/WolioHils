-- ============================================================================
-- WOLIO HILLS — PROFILES TABLE, ADMIN RLS & BOOKINGS FIX
-- ============================================================================
-- Perbaikan RLS untuk security yang ketat:
-- - Admin: full akses bookings
-- - Anon/User: NO direct akses bookings (gunakan RPC instead)
-- - Create handle_new_user trigger untuk auto-populate profiles
-- ============================================================================

-- ============================================================================
-- 1. CREATE PROFILES TABLE + TRIGGER handle_new_user
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profile & role (user | admin)';
COMMENT ON COLUMN public.profiles.role IS 'Setiap user otomatis dibuat sebagai "user"; hanya admin yang bisa ubah role';

-- Enable RLS pada profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS POLICIES UNTUK PROFILES TABLE
-- ============================================================================
-- Admin full access (IF NOT EXISTS tidak didukung di semua versi Postgres — pakai DROP + CREATE)
DROP POLICY IF EXISTS "profiles_admin_full" ON public.profiles;
CREATE POLICY "profiles_admin_full"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- User hanya bisa baca profil sendiri (tidak bisa update)
DROP POLICY IF EXISTS "profiles_user_read_self" ON public.profiles;
CREATE POLICY "profiles_user_read_self"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- ============================================================================
-- 3. TRIGGER handle_new_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Buat trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. FIX BOOKINGS TABLE — UPDATE POLICIES (KETAT)
-- ============================================================================
-- Admin: full akses (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "bookings_admin_full" ON public.bookings;
CREATE POLICY "bookings_admin_full"
ON public.bookings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- NOTE: Anon/user: implicit deny (tidak ada akses direct ke bookings table)
-- Gunakan RPC get_public_booked_dates() untuk kalender publik.

-- ============================================================================
-- 5. CREATE RPC get_public_booked_dates (untuk kalender publik)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_public_booked_dates()
RETURNS TABLE (stay_date date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT (generate_series(
    b.check_in::timestamp,
    (b.check_out::timestamp - interval '1 day'),
    interval '1 day'
  ))::date AS stay_date
  FROM public.bookings b
  WHERE b.payment_status = 'berhasil'
  ORDER BY stay_date;
$$;

COMMENT ON FUNCTION public.get_public_booked_dates() IS 'RPC untuk kalender publik — return tanggal yang sudah di-booking';

-- Grant execute ke anon (jadi kalender bisa akses)
GRANT EXECUTE ON FUNCTION public.get_public_booked_dates() TO anon, authenticated;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;

-- ============================================================================
-- 7. CLEANUP — DROP VIEW yang tidak dipakai
-- ============================================================================
DROP VIEW IF EXISTS public.booked_stay_dates;

-- ============================================================================
-- 8. SETUP ADMIN PERTAMA
-- ============================================================================
-- Setelah migration ini dijalankan:
-- 1. Buat user di Supabase Authentication (email/password)
-- 2. Copy UUID user dari auth.users
-- 3. Run query di bawah (ganti <UUID>):
--    UPDATE public.profiles SET role = 'admin' WHERE id = '<UUID>';
