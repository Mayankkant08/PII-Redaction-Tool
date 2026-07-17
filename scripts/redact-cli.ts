// scripts/redact-cli.ts
// CLI entrypoint for the PII Redaction Tool.
//
// Usage:
//   npx tsx scripts/redact-cli.ts --input data/Red_Herring_Prospectus.docx --output output/redacted_prospectus.docx
//   npm run redact:cli

import fs from 'fs';
import path from 'path';
import { readDocx } from '../src/lib/docx/readDocx';
import { redactParagraphs } from '../src/lib/pii/redact';
import { PiiMapper } from '../src/lib/pii/mapper';
import { writeDocxFile } from '../src/lib/docx/writeDocx';
import { PII_TYPES } from '../src/lib/pii/types';

// ─── Parse CLI args ───────────────────────────────────────────────────────────

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const inputArg = getArg('--input') ?? 'data/Red_Herring_Prospectus.docx';
const outputArg = getArg('--output') ?? 'output/redacted_prospectus.docx';

const inputPath = path.resolve(process.cwd(), inputArg);
const outputPath = path.resolve(process.cwd(), outputArg);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔍 PII Redaction Tool – CLI Mode');
  console.log('═'.repeat(50));

  // 1. Check input exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌  Input file not found: ${inputPath}`);
    console.log('\n💡  Generate a sample DOCX first:');
    console.log('    npx tsx scripts/generate-sample-docx.ts');
    process.exit(1);
  }

  console.log(`📄  Input:  ${inputPath}`);
  console.log(`💾  Output: ${outputPath}`);

  // 2. Read DOCX
  console.log('\n⏳  Reading DOCX...');
  const buffer = fs.readFileSync(inputPath);
  const { paragraphs, rawText } = await readDocx(buffer);

  console.log(`✅  Extracted ${paragraphs.length} paragraphs, ${rawText.length} characters`);

  // 3. Redact
  console.log('\n⏳  Detecting and redacting PII...');
  const mapper = new PiiMapper();
  const { redactedParagraphs, mapping, stats } = redactParagraphs(paragraphs, mapper);

  // 4. Write output DOCX
  console.log('\n⏳  Writing redacted DOCX...');
  await writeDocxFile(redactedParagraphs, outputPath);

  // 5. Print stats
  console.log('\n📊  Redaction Summary');
  console.log('─'.repeat(50));
  const totalPii = Object.values(stats).reduce((a, b) => a + b, 0);
  console.log(`Total PII instances found: ${totalPii}`);
  console.log(`Unique real → fake mappings: ${mapping.length}`);
  console.log('\nPer-type breakdown:');

  for (const type of PII_TYPES) {
    if (stats[type] > 0) {
      console.log(`  ${type.padEnd(15)} : ${stats[type]}`);
    }
  }

  // 6. Print sample mappings (first 20)
  console.log('\n🗂️  Sample Mappings (first 20):');
  console.log('─'.repeat(50));
  const sample = mapping.slice(0, 20);
  for (const { type, real, fake } of sample) {
    const truncReal = real.length > 35 ? real.slice(0, 32) + '...' : real;
    const truncFake = fake.length > 35 ? fake.slice(0, 32) + '...' : fake;
    console.log(`  [${type.padEnd(12)}] "${truncReal}" → "${truncFake}"`);
  }

  console.log('\n✅  Done! Redacted file saved to:');
  console.log(`   ${outputPath}`);
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Fatal error:', err);
  process.exit(1);
});
