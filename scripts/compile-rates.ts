import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { compileSourceDocument, wrapCompiledPatch, type SourceRatesDocument } from "../lib/rates-compile";
import { assertValidRatesPayload } from "../lib/rates-validate";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: npm run rates:compile -- data/sources/drafts/foo.source.json");
  process.exit(1);
}

const absoluteInput = path.resolve(inputPath);
const raw = JSON.parse(readFileSync(absoluteInput, "utf8")) as SourceRatesDocument;
const compiled = compileSourceDocument(raw);

assertValidRatesPayload(compiled);

const outDir = path.join(process.cwd(), "data", "sources", "compiled");
mkdirSync(outDir, { recursive: true });
const baseName = path.basename(absoluteInput).replace(/\.source\.json$/i, "");
const outPath = path.join(outDir, `${baseName}.patch.json`);
const patch = wrapCompiledPatch(compiled, raw.merge !== false);

writeFileSync(outPath, JSON.stringify(patch, null, 2), "utf8");
console.log("Wrote", outPath);
