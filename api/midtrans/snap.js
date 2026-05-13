function splitName(full) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "Tamu", last_name: "-" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "-" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  if (!serverKey) {
    return res.status(503).json({ error: "MIDTRANS_SERVER_KEY belum diatur di environment Vercel" });
  }

  const raw = req.body;
  const body =
    typeof raw === "string"
      ? JSON.parse(raw || "{}")
      : raw && typeof raw === "object"
        ? raw
        : {};

  const fromClient = body.midtransProduction;
  const isProduction =
    typeof fromClient === "boolean"
      ? fromClient
      : process.env.MIDTRANS_PRODUCTION === "true" || process.env.VITE_MIDTRANS_PRODUCTION === "true";

  const base = isProduction
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";

  const gross = Math.round(Number(body?.grossAmount));
  if (!body?.orderId || !Number.isFinite(gross) || gross < 1) {
    return res.status(400).json({ error: "Payload tidak valid" });
  }

  const { first_name, last_name } = splitName(String(body.booking?.guestName ?? ""));

  const snapBody = {
    transaction_details: {
      order_id: body.orderId,
      gross_amount: gross,
    },
    item_details: [
      {
        id: "BOOKING",
        name: body.itemName || "Wolio Hills - Menginap",
        price: gross,
        quantity: 1,
      },
    ],
    customer_details: {
      first_name,
      last_name,
      email: body.booking?.guestEmail || "guest@example.com",
      phone: (body.booking?.guestPhone || "").replace(/\D/g, "").slice(0, 20) || "0812345678",
    },
    credit_card: { secure: true },
  };

  const auth = Buffer.from(`${serverKey}:`).toString("base64");

  let snapRes;
  try {
    snapRes = await fetch(`${base}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(snapBody),
    });
  } catch (e) {
    return res.status(502).json({ error: e instanceof Error ? e.message : "Network error ke Midtrans" });
  }

  const snapJson = await snapRes.json();
  if (!snapRes.ok || !snapJson.token) {
    const msg = snapJson.error_messages?.join(", ") || snapJson.status_message || "Midtrans error";
    return res.status(502).json({ error: msg });
  }

  return res.status(200).json({ token: snapJson.token });
}
