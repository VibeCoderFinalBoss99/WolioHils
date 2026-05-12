-- Wolio Hills: bookings / pembayaran (mirror dari migration MCP)
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  transaction_id text,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text NOT NULL,
  gross_amount integer NOT NULL DEFAULT 0,
  check_in date NOT NULL,
  check_out date NOT NULL,
  property_name text NOT NULL,
  property_id integer,
  guests integer NOT NULL DEFAULT 1,
  rooms integer NOT NULL DEFAULT 1,
  special_requests text NOT NULL DEFAULT '',
  payment_type text,
  transaction_status text,
  payment_status text NOT NULL CHECK (payment_status IN ('berhasil', 'pending', 'gagal', 'dibatalkan')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bookings_payment_status_idx ON public.bookings (payment_status);
CREATE INDEX bookings_recorded_at_idx ON public.bookings (recorded_at DESC);
CREATE INDEX bookings_check_dates_idx ON public.bookings (check_in, check_out);

CREATE OR REPLACE FUNCTION public.wolio_bookings_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.wolio_bookings_set_updated_at();

CREATE OR REPLACE VIEW public.booked_stay_dates AS
SELECT DISTINCT (generate_series(
  b.check_in::timestamp,
  (b.check_out::timestamp - interval '1 day'),
  interval '1 day'
))::date AS stay_date
FROM public.bookings b
WHERE b.payment_status = 'berhasil';

COMMENT ON TABLE public.bookings IS 'Transaksi/booking Wolio Hills';
COMMENT ON VIEW public.booked_stay_dates IS 'Tanggal menginap terjadwal untuk kalender';

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- NOTE: RLS policies sudah diperbaiki di migration berikutnya (20260213120000_profiles_admin_rls.sql)
-- Lihat SUPABASE_FIX.sql untuk detail lengkap.
