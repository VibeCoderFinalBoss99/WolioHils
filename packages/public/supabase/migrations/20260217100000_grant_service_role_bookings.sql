-- Pastikan role database `service_role` (PostgREST + JWT service_role) punya hak tabel
-- untuk upsert booking dari API server. Menghindari "permission denied for table bookings"
-- bila privilege default berbeda.

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bookings TO service_role;
