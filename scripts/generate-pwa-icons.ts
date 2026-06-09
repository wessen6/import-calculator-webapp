import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ICONS_DIR = path.join(ROOT, "public", "icons");

const OUTPUTS = [
  { source: "icon.svg", name: "icon-192.png", size: 192 },
  { source: "icon.svg", name: "icon-512.png", size: 512 },
  { source: "icon.svg", name: "apple-touch-icon.png", size: 180 },
  { source: "icon-maskable.svg", name: "icon-maskable-192.png", size: 192 },
  { source: "icon-maskable.svg", name: "icon-maskable-512.png", size: 512 }
] as const;

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });

  for (const output of OUTPUTS) {
    const svg = await readFile(path.join(ICONS_DIR, output.source));
    const png = await sharp(svg).resize(output.size, output.size).png().toBuffer();
    const target = path.join(ICONS_DIR, output.name);
    await writeFile(target, png);
    console.log(`Wrote ${path.relative(ROOT, target)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
