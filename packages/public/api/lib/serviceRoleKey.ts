/**
 * Pastikan `SUPABASE_SERVICE_ROLE_KEY` adalah JWT **service_role** (bukan anon).
 * Salah tempel anon → PostgREST sering memunculkan "permission denied for table …".
 */
export function assertSupabaseServiceRoleKey(serviceKey: string): void {
  const key = serviceKey.trim();
  if (!key) return;
  const parts = key.split(".");
  if (parts.length !== 3) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY tidak seperti JWT (harus 3 segmen dipisah titik).");
  }
  let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  const json = Buffer.from(b64, "base64").toString("utf8");
  const payload = JSON.parse(json) as { role?: string };
  if (payload.role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY memakai role "${payload.role ?? "unknown"}" — harus **service_role**. ` +
        `Di Supabase Dashboard → Settings → API, salin **service_role secret**, bukan anon public.`
    );
  }
}
