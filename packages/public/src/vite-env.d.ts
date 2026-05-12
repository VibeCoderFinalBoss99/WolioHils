/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIDTRANS_CLIENT_KEY: string;
  /** "true" uses production Snap script + Midtrans API host on server */
  readonly VITE_MIDTRANS_PRODUCTION?: string;
  readonly VITE_ADMIN_WHATSAPP_E164?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
