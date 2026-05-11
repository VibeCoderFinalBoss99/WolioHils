/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIDTRANS_CLIENT_KEY: string;
  /** "true" uses production Snap script + Midtrans API host on server */
  readonly VITE_MIDTRANS_PRODUCTION?: string;
  readonly VITE_ADMIN_WHATSAPP_E164?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
