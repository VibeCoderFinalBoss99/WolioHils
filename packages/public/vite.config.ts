import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {
  clientRecordToDbRow,
  mergeExistingBooking,
  type BookingDbRow,
  type ClientBookingRecord,
} from "./api/lib/mapBookingRow";
import { assertSupabaseServiceRoleKey } from "./api/lib/serviceRoleKey";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function splitName(full: string): { first_name: string; last_name: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "Tamu", last_name: "-" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "-" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

async function readRequestBody(req: AsyncIterable<Uint8Array | Buffer>): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function midtransSnapPlugin(serverKey: string, envFallbackProduction: boolean): Plugin {
  const handler = async (req: unknown, res: unknown, next: () => void) => {
    const r = req as { method?: string; url?: string };
    if (r.url !== "/api/midtrans/snap" || r.method !== "POST") {
      return next();
    }

    const resp = res as {
      statusCode: number;
      setHeader: (k: string, v: string) => void;
      end: (b: string) => void;
    };

    if (!serverKey) {
      resp.statusCode = 503;
      resp.setHeader("Content-Type", "application/json");
      resp.end(JSON.stringify({ error: "MIDTRANS_SERVER_KEY belum diatur di .env" }));
      return;
    }

    try {
      const raw = await readRequestBody(req as AsyncIterable<Uint8Array | Buffer>);
      const body = JSON.parse(raw || "{}") as {
        orderId?: string;
        grossAmount?: number;
        midtransProduction?: boolean;
        booking?: {
          guestName?: string;
          guestEmail?: string;
          guestPhone?: string;
        };
        itemName?: string;
      };

      const isProduction =
        typeof body.midtransProduction === "boolean" ? body.midtransProduction : envFallbackProduction;
      const base = isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";

      const gross = Math.round(Number(body.grossAmount));
      if (!body.orderId || !Number.isFinite(gross) || gross < 1) {
        resp.statusCode = 400;
        resp.setHeader("Content-Type", "application/json");
        resp.end(JSON.stringify({ error: "Payload tidak valid" }));
        return;
      }

      const { first_name, last_name } = splitName(String(body.booking?.guestName));

      const snapBody = {
        transaction_details: {
          order_id: body.orderId,
          gross_amount: gross,
        },
        item_details: [
          {
            id: "BOOKING",
            name: body.itemName || "Wolio Hills — Menginap",
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
      const snapRes = await fetch(`${base}/snap/v1/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(snapBody),
      });

      const snapJson = (await snapRes.json()) as { token?: string; error_messages?: string[]; status_message?: string };

      if (!snapRes.ok || !snapJson.token) {
        const msg = snapJson.error_messages?.join(", ") || snapJson.status_message || "Midtrans error";
        resp.statusCode = 502;
        resp.setHeader("Content-Type", "application/json");
        resp.end(JSON.stringify({ error: msg }));
        return;
      }

      resp.statusCode = 200;
      resp.setHeader("Content-Type", "application/json");
      resp.end(JSON.stringify({ token: snapJson.token }));
    } catch (e) {
      resp.statusCode = 500;
      resp.setHeader("Content-Type", "application/json");
      resp.end(JSON.stringify({ error: e instanceof Error ? e.message : "Server error" }));
    }
  };

  return {
    name: "midtrans-snap-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handler(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handler(req, res, next);
      });
    },
  };
}

function wolioBookingsDevPlugin(url: string, serviceKey: string): Plugin {
  const handler = async (req: unknown, res: unknown, next: () => void) => {
    const r = req as { method?: string; url?: string };
    const pathname = (r.url || "").split("?")[0];
    if (pathname !== "/api/wolio/bookings" || r.method !== "POST") {
      return next();
    }
    const resp = res as {
      statusCode: number;
      setHeader: (k: string, v: string) => void;
      end: (b: string) => void;
    };
    if (!url || !serviceKey) {
      resp.statusCode = 503;
      resp.setHeader("Content-Type", "application/json");
      resp.end(JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY / URL belum diatur di .env root" }));
      return;
    }
    try {
      assertSupabaseServiceRoleKey(serviceKey);
    } catch (e) {
      resp.statusCode = 503;
      resp.setHeader("Content-Type", "application/json");
      resp.end(JSON.stringify({ error: e instanceof Error ? e.message : "SUPABASE_SERVICE_ROLE_KEY tidak valid" }));
      return;
    }
    try {
      const raw = await readRequestBody(req as AsyncIterable<Uint8Array | Buffer>);
      const body = JSON.parse(raw || "{}") as { record?: ClientBookingRecord };
      if (!body.record?.order_id) {
        resp.statusCode = 400;
        resp.setHeader("Content-Type", "application/json");
        resp.end(JSON.stringify({ error: "record.order_id wajib" }));
        return;
      }
      let row = clientRecordToDbRow(body.record);
      const supabase = createClient(url, serviceKey);
      const { data: existing } = await supabase.from("bookings").select("*").eq("order_id", row.order_id).maybeSingle();
      if (existing) {
        row = mergeExistingBooking(existing as BookingDbRow, row);
      }
      const { error } = await supabase.from("bookings").upsert(row, { onConflict: "order_id" });
      if (error) {
        resp.statusCode = 500;
        resp.setHeader("Content-Type", "application/json");
        resp.end(JSON.stringify({ error: error.message }));
        return;
      }
      resp.statusCode = 200;
      resp.setHeader("Content-Type", "application/json");
      resp.end(JSON.stringify({ ok: true }));
    } catch (e) {
      resp.statusCode = 500;
      resp.setHeader("Content-Type", "application/json");
      resp.end(JSON.stringify({ error: e instanceof Error ? e.message : "Server error" }));
    }
  };

  return {
    name: "wolio-bookings-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handler(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handler(req, res, next);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  const serverKey = env.MIDTRANS_SERVER_KEY ?? "";
  const production = env.VITE_MIDTRANS_PRODUCTION === "true";
  const supabaseUrl = env.VITE_SUPABASE_URL ?? "";
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const plugins = [react(), tailwindcss(), wolioBookingsDevPlugin(supabaseUrl, serviceRole)];
  if (serverKey) {
    plugins.push(midtransSnapPlugin(serverKey, production));
  }

  return {
    envDir: repoRoot,
    plugins,
    server: {
      port: 3001,
      host: "0.0.0.0",
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react-dom")) return "react-dom";
            if (id.includes("node_modules/react/")) return "react";
            if (id.includes("node_modules/motion")) return "motion";
            if (id.includes("node_modules/lucide-react")) return "lucide";
          },
        },
      },
    },
  };
});
