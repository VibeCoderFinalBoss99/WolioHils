/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIDTRANS_CLIENT_KEY: string;
  /** "true" uses production Snap script + Midtrans API host on server */
  readonly VITE_MIDTRANS_PRODUCTION?: string;
  readonly VITE_ADMIN_WHATSAPP_E164?: string;
  /** Supabase project URL */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (publishable) key */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Login admin dashboard */
  readonly VITE_ADMIN_USERNAME?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  /** Opsional: endpoint legacy JSON/API transaksi menggantikan Supabase */
  readonly VITE_WOLIO_STORE_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
