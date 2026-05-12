/**
 * Nomor internasional E.164: wajib diawali + lalu kode negara (bukan 0) dan nomor.
 * Contoh: +6281234567890
 */
const E164_LIKE = /^\+[1-9]\d{7,14}$/;

export function isValidInternationalPhone(raw: string): boolean {
  const s = raw.trim().replace(/\s/g, "");
  return E164_LIKE.test(s);
}

export const PHONE_E164_HINT =
  "Gunakan format internasional, contoh: +62 untuk Indonesia, lalu nomor tanpa angka 0 di depan (mis. +6281234567890).";
