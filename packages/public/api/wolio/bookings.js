import { createClient } from "@supabase/supabase-js";

function clientRecordToDbRow(rec) {
  return {
    order_id: rec.order_id,
    transaction_id: rec.transaction_id ?? null,
    guest_name: rec.guestName,
    guest_email: rec.guestEmail,
    guest_phone: rec.guestPhone,
    gross_amount: rec.gross_amount ?? 0,
    check_in: rec.checkIn,
    check_out: rec.checkOut,
    property_name: rec.propertyName,
    property_id: rec.property_id ?? null,
    guests: rec.guests ?? 1,
    rooms: rec.rooms ?? 1,
    special_requests: rec.special_requests ?? "",
    payment_type: rec.payment_type ?? null,
    transaction_status: rec.transaction_status ?? null,
    payment_status: rec.payment_status,
    recorded_at: rec.recordedAt,
  };
}

function mergeExistingBooking(existing, incoming) {
  return {
    ...incoming,
    recorded_at: existing.recorded_at ?? incoming.recorded_at,
    gross_amount:
      incoming.gross_amount > 0 ? incoming.gross_amount : existing.gross_amount ?? 0,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) {
    return res.status(503).json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur" });
  }

  const body = req.body;
  const rec = body?.record;
  if (!rec?.order_id) return res.status(400).json({ error: "record.order_id wajib" });

  let row = clientRecordToDbRow(rec);
  const supabase = createClient(url, key);

  const { data: existing } = await supabase
    .from("bookings")
    .select("*")
    .eq("order_id", row.order_id)
    .maybeSingle();

  if (existing) {
    row = mergeExistingBooking(existing, row);
  }

  const { error } = await supabase.from("bookings").upsert(row, { onConflict: "order_id" });
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}
