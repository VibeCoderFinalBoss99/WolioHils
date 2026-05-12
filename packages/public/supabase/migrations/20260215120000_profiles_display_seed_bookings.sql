-- Wolio Hills — profil admin (metadata) + reset data demo `bookings` untuk dashboard
-- Jalankan via `supabase db push` / SQL Editor. HATI-HATI: menghapus semua baris di `bookings`.

-- ---------------------------------------------------------------------------
-- 1. Kolom tambahan di profiles (tampilan admin / identitas di aplikasi)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN public.profiles.display_name IS 'Nama tampilan (dashboard admin, dsb.)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Opsional — URL foto profil';
COMMENT ON COLUMN public.profiles.phone IS 'Opsional — kontak internal admin';

CREATE OR REPLACE FUNCTION public.profiles_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_set_updated_at();

-- Pengguna biasa tidak boleh mengubah role sendiri menjadi admin
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

DROP TRIGGER IF EXISTS profiles_lock_role ON public.profiles;
CREATE TRIGGER profiles_lock_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_prevent_role_escalation();

-- ---------------------------------------------------------------------------
-- 2. Trigger pendaftaran: isi display_name dari metadata / email
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dn text;
BEGIN
  dn := NULLIF(trim(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, ''), '@', 1),
    ''
  )), '');
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (NEW.id, 'user', dn)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS: pengguna terautentikasi boleh update baris profil sendiri (metadata)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_user_update_self" ON public.profiles;
CREATE POLICY "profiles_user_update_self"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

GRANT UPDATE ON public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Backfill display_name dari auth.users (sekali, aman untuk baris lama)
-- ---------------------------------------------------------------------------
UPDATE public.profiles p
SET display_name = COALESCE(
  NULLIF(trim(p.display_name), ''),
  NULLIF(trim(COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(COALESCE(u.email, ''), '@', 1),
    ''
  )), '')
)
FROM auth.users u
WHERE u.id = p.id
  AND (p.display_name IS NULL OR trim(p.display_name) = '');

-- ---------------------------------------------------------------------------
-- 5. Hapus semua transaksi/booking lama → ganti data demo (sesuai kolom app)
-- ---------------------------------------------------------------------------
TRUNCATE public.bookings RESTART IDENTITY CASCADE;

INSERT INTO public.bookings (
  order_id, transaction_id, guest_name, guest_email, guest_phone,
  gross_amount, check_in, check_out, property_name, property_id,
  guests, rooms, special_requests, payment_type, transaction_status,
  payment_status, recorded_at
) VALUES
  ('WOLIO-SEED-001', 'midtrans-settle-001', 'Andi Pratama', 'andi.pratama@example.com', '+6281234567001',
   2850000, '2026-05-18', '2026-05-21', 'Villa Kayu — Wolio Hills Malino', 1,
   2, 1, 'Minta bantal ekstra', 'bank_transfer', 'settlement',
   'berhasil', now() - interval '28 days'),
  ('WOLIO-SEED-002', 'midtrans-settle-002', 'Siti Rahayu', 'siti.rahayu@example.com', '+6281234567002',
   3200000, '2026-06-02', '2026-06-05', 'Glamping Dome — Wolio Hills Malino', 2,
   4, 1, '', 'qris', 'settlement',
   'berhasil', now() - interval '21 days'),
  ('WOLIO-SEED-003', 'midtrans-settle-003', 'Budi Santoso', 'budi.santoso@example.com', '+6281234567003',
   1500000, '2026-05-25', '2026-05-26', 'Cabin Forest View', 3,
   2, 1, 'Check-in sore', 'credit_card', 'capture',
   'berhasil', now() - interval '14 days'),
  ('WOLIO-SEED-004', 'midtrans-settle-004', 'Maya Lestari', 'maya.lestari@example.com', '+6281234567004',
   4100000, '2026-07-10', '2026-07-14', 'Villa Kayu — Wolio Hills Malino', 1,
   6, 2, 'Acara keluarga kecil', 'gopay', 'settlement',
   'berhasil', now() - interval '10 days'),
  ('WOLIO-SEED-005', 'midtrans-settle-005', 'Rizki Firmansyah', 'rizki.f@example.com', '+6281234567005',
   1750000, '2026-05-30', '2026-06-01', 'Cabin Forest View', 3,
   2, 1, '', 'shopeepay', 'settlement',
   'berhasil', now() - interval '7 days'),
  ('WOLIO-SEED-006', NULL, 'Dewi Anggraini', 'dewi.anggraini@example.com', '+6281234567006',
   0, '2026-06-15', '2026-06-17', 'Glamping Dome — Wolio Hills Malino', 2,
   3, 1, '', NULL, 'pending',
   'pending', now() - interval '5 days'),
  ('WOLIO-SEED-007', NULL, 'Hendra Wijaya', 'hendra.w@example.com', '+6281234567007',
   0, '2026-06-20', '2026-06-22', 'Villa Kayu — Wolio Hills Malino', 1,
   2, 1, 'Menunggu konfirmasi VA', 'bank_transfer', 'pending',
   'pending', now() - interval '2 days'),
  ('WOLIO-SEED-008', 'midtrans-deny-008', 'Lina Marlina', 'lina.m@example.com', '+6281234567008',
   0, '2026-06-08', '2026-06-10', 'Cabin Forest View', 3,
   2, 1, '', 'credit_card', 'deny',
   'gagal', now() - interval '18 days'),
  ('WOLIO-SEED-009', NULL, 'Fajar Nugroho', 'fajar.n@example.com', '+6281234567009',
   0, '2026-06-12', '2026-06-14', 'Glamping Dome — Wolio Hills Malino', 2,
   4, 1, '', NULL, 'expire',
   'gagal', now() - interval '12 days'),
  ('WOLIO-SEED-010', NULL, 'Karina Putri', 'karina.putri@example.com', '+6281234567010',
   0, '2026-07-01', '2026-07-03', 'Villa Kayu — Wolio Hills Malino', 1,
   2, 1, '', NULL, 'cancel',
   'dibatalkan', now() - interval '9 days'),
  ('WOLIO-SEED-011', NULL, 'Eko Wijaya', 'eko.w@example.com', '+6281234567011',
   0, '2026-06-25', '2026-06-27', 'Cabin Forest View', 3,
   2, 1, 'Tamu menutup popup Midtrans', NULL, 'cancel',
   'dibatalkan', now() - interval '3 days'),
  ('WOLIO-SEED-012', 'midtrans-settle-012', 'Nadia Safitri', 'nadia.s@example.com', '+6281234567012',
   2650000, '2026-05-12', '2026-05-15', 'Villa Kayu — Wolio Hills Malino', 1,
   2, 1, '', 'bank_transfer', 'settlement',
   'berhasil', now() - interval '1 day');

-- ---------------------------------------------------------------------------
-- 6. Realtime (idempotent): agar dashboard admin dapat postgres_changes
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'bookings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings';
  END IF;
END $$;
