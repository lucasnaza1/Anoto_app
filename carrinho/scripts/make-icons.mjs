/**
 * Gera os PNGs do PWA a partir da marca Anoto (public/icon.svg).
 * - icon-{192,512}.png: uso geral
 * - icon-maskable-{192,512}.png: marca reduzida a 65% sobre fundo azul,
 *   garantindo o conteúdo dentro da safe zone circular (80%)
 * Uso: npm run icons
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public", "pwa");
const iconSvg = path.join(root, "public", "icon.svg");

await mkdir(outDir, { recursive: true });

async function plain(size) {
  await sharp(iconSvg).resize(size, size).png().toFile(path.join(outDir, `icon-${size}.png`));
  console.log(`ok  public/pwa/icon-${size}.png`);
}

async function maskable(size) {
  const inner = Math.round(size * 0.65);
  const offset = Math.round((size - inner) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#1B34C9" },
  })
    .composite([
      {
        input: await sharp(iconSvg).resize(inner, inner).png().toBuffer(),
        left: offset,
        top: offset,
      },
    ])
    .png()
    .toFile(path.join(outDir, `icon-maskable-${size}.png`));
  console.log(`ok  public/pwa/icon-maskable-${size}.png`);
}

for (const size of [192, 512]) {
  await plain(size);
  await maskable(size);
}
