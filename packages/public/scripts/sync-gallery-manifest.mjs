/**
 * Membaca berkas gambar di public/images dan menulis public/gallery-manifest.json
 * agar galeri About bisa menampilkan daftar unik tanpa hardcode duplikat.
 * Jalankan otomatis lewat prebuild / predev, atau: npm run sync-gallery
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const imagesDir = path.join(root, "public", "images");
const outFile = path.join(root, "public", "gallery-manifest.json");

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

/** Tidak dimasukkan ke galeri foto (ikon / brand). */
const GALLERY_SKIP_FILES = new Set(["logo.png", "favicon.ico", ".ds_store"]);

function humanizeFilename(name) {
  const base = name.replace(IMAGE_EXT, "");
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Foto Wolio Hills";
}

function main() {
  let files = [];
  try {
    files = fs.readdirSync(imagesDir).filter((f) => IMAGE_EXT.test(f));
  } catch {
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
  }

  const seen = new Set();
  const manifest = [];
  for (const file of files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))) {
    const key = file.toLowerCase();
    if (seen.has(key) || GALLERY_SKIP_FILES.has(key)) continue;
    seen.add(key);
    manifest.push({ file, alt: humanizeFilename(file) });
  }

  fs.writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`[sync-gallery] ${manifest.length} gambar → ${path.relative(root, outFile)}`);
}

main();
