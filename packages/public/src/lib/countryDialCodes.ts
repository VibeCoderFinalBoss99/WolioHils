/**
 * Daftar kode telepon negara dari dataset Annexare Countries (MIT).
 * https://github.com/annexare/Countries
 */
import annexCountries from "../data/countries-annexare.json";

type AnnexEntry = {
  name: string;
  phone?: number[];
};

export interface DialOptionRow {
  key: string;
  dialCode: string;
  label: string;
}

function buildDialOptions(): DialOptionRow[] {
  const data = annexCountries as Record<string, AnnexEntry>;
  const rows: DialOptionRow[] = [];
  for (const iso of Object.keys(data)) {
    const entry = data[iso];
    const phones = entry.phone;
    if (!phones?.length) continue;
    phones.forEach((num, idx) => {
      rows.push({
        key: `${iso}-${idx}`,
        dialCode: `+${num}`,
        label: `${entry.name} (+${num})`,
      });
    });
  }
  rows.sort((a, b) => a.label.localeCompare(b.label, "en"));
  return rows;
}

export const DIAL_OPTIONS: DialOptionRow[] = buildDialOptions();

/** Awalan terpanjang dulu agar mis. +1242 tidak cocok dengan +1. */
export const DIAL_PREFIXES_LONGEST_FIRST: string[] = Array.from(new Set(DIAL_OPTIONS.map((r) => r.dialCode))).sort(
  (a, b) => b.length - a.length || a.localeCompare(b)
);

export const DEFAULT_DIAL_OPTION_KEY: string =
  DIAL_OPTIONS.find((r) => r.key.startsWith("ID-") && r.dialCode === "+62")?.key ??
  DIAL_OPTIONS.find((r) => r.dialCode === "+62")?.key ??
  DIAL_OPTIONS[0]?.key ??
  "ID-0";

export function splitInternationalPhone(full: string): { dialCode: string; national: string } {
  const s = full.trim().replace(/\s/g, "");
  if (!s.startsWith("+")) return { dialCode: "+62", national: "" };
  const rest = s.slice(1);
  for (const prefix of DIAL_PREFIXES_LONGEST_FIRST) {
    const digits = prefix.slice(1);
    if (digits && rest.startsWith(digits)) {
      return { dialCode: prefix, national: rest.slice(digits.length) };
    }
  }
  const body = rest.replace(/^62/, "").replace(/^0+/, "");
  return { dialCode: "+62", national: body };
}

/** Kunci opsi `<select>` untuk nomor lengkap +62… (kalau sama kode, ambil pertama menurut urutan key). */
export function dialOptionKeyForFullPhone(full: string): string {
  const { dialCode } = splitInternationalPhone(full);
  const matches = DIAL_OPTIONS.filter((r) => r.dialCode === dialCode);
  matches.sort((a, b) => a.key.localeCompare(b.key));
  return matches[0]?.key ?? DEFAULT_DIAL_OPTION_KEY;
}

export function dialCodeForOptionKey(key: string): string {
  return DIAL_OPTIONS.find((r) => r.key === key)?.dialCode ?? "+62";
}
