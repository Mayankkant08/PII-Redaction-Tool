// scripts/evaluate.ts
// Evaluation script: loads evaluation/gold_sample.json, runs detectors on each span,
// computes precision/recall/F1/accuracy overall and per type, writes evaluation/report.md

import fs from 'fs';
import path from 'path';
import { detectAllPii } from '../src/lib/pii/detectors';
import type { PiiType } from '../src/lib/pii/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GoldSpan {
  id: number;
  text: string;
  type: string;
  isPii: boolean;
  note?: string;
}

interface GoldSample {
  description: string;
  totalSpans: number;
  spans: GoldSpan[];
}

interface PerTypeMetrics {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
}

// ─── Matching Logic ──────────────────────────────────────────────────────────

/**
 * Normalize a string for fuzzy matching:
 * trim, collapse whitespace, lowercase.
 */
function normalize(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Check if the detector finds a match for a given text span.
 * We run detectAllPii on the text itself + some padding context,
 * then check if the gold text appears in a detected span.
 * 
 * Matching rule (documented):
 * 1. Exact string match: detected value === gold text
 * 2. Normalized match: normalize(detected) === normalize(gold)
 * 3. Containment match: gold text is contained within detected value or vice versa
 */
function isDetected(gold: GoldSpan): { found: boolean; detectedType?: string } {
  const matches = detectAllPii(gold.text);
  
  for (const m of matches) {
    // Exact match
    if (m.value === gold.text) return { found: true, detectedType: m.type };
    // Normalized match
    if (normalize(m.value) === normalize(gold.text)) return { found: true, detectedType: m.type };
    // Containment (detected span contains gold span)
    if (m.value.includes(gold.text) || gold.text.includes(m.value)) {
      return { found: true, detectedType: m.type };
    }
  }
  return { found: false };
}

// ─── Metrics Computation ─────────────────────────────────────────────────────

function safeDiv(num: number, den: number): number {
  return den === 0 ? 0 : Math.round((num / den) * 10000) / 10000;
}

function computeMetrics(tp: number, fp: number, fn: number, tn: number): PerTypeMetrics {
  const precision = safeDiv(tp, tp + fp);
  const recall    = safeDiv(tp, tp + fn);
  const f1        = safeDiv(2 * precision * recall, precision + recall);
  const accuracy  = safeDiv(tp + tn, tp + fp + fn + tn);
  return { tp, fp, fn, tn, precision, recall, f1, accuracy };
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const goldPath = path.resolve(process.cwd(), 'evaluation/gold_sample.json');
  if (!fs.existsSync(goldPath)) {
    console.error('❌  evaluation/gold_sample.json not found');
    process.exit(1);
  }

  const gold: GoldSample = JSON.parse(fs.readFileSync(goldPath, 'utf-8'));
  console.log(`\n📊 PII Evaluation – ${gold.totalSpans} gold spans`);
  console.log('═'.repeat(60));

  // Overall counters
  let overallTp = 0, overallFp = 0, overallFn = 0, overallTn = 0;

  // Per-type counters (keyed by PII type string)
  const perType: Record<string, { tp: number; fp: number; fn: number; tn: number }> = {};

  // Detailed results for report
  const falsePositives: { text: string; expectedType: string }[] = [];
  const falseNegatives: { text: string; expectedType: string }[] = [];

  for (const span of gold.spans) {
    const type = span.type as PiiType;
    if (!perType[type]) perType[type] = { tp: 0, fp: 0, fn: 0, tn: 0 };

    const { found } = isDetected(span);

    if (span.isPii) {
      // Positive example: we expect detection
      if (found) {
        overallTp++;
        perType[type].tp++;
      } else {
        overallFn++;
        perType[type].fn++;
        falseNegatives.push({ text: span.text, expectedType: type });
      }
    } else {
      // Negative example: we expect NO detection
      if (found) {
        overallFp++;
        perType[type].fp++;
        falsePositives.push({ text: span.text, expectedType: type });
      } else {
        overallTn++;
        perType[type].tn++;
      }
    }
  }

  const overall = computeMetrics(overallTp, overallFp, overallFn, overallTn);

  // Print overall
  console.log('\nOverall Metrics:');
  console.log(`  TP=${overallTp}  FP=${overallFp}  FN=${overallFn}  TN=${overallTn}`);
  console.log(`  Precision : ${pct(overall.precision)}`);
  console.log(`  Recall    : ${pct(overall.recall)}`);
  console.log(`  F1        : ${pct(overall.f1)}`);
  console.log(`  Accuracy  : ${pct(overall.accuracy)}`);

  // Print per-type
  console.log('\nPer-Type Breakdown:');
  const typeKeys = Object.keys(perType).sort();
  for (const t of typeKeys) {
    const c = perType[t];
    const m = computeMetrics(c.tp, c.fp, c.fn, c.tn);
    const total = c.tp + c.fn;
    if (total === 0 && c.fp === 0) continue;
    console.log(`  ${t.padEnd(16)} P=${pct(m.precision)}  R=${pct(m.recall)}  F1=${pct(m.f1)}  (TP=${c.tp} FP=${c.fp} FN=${c.fn} TN=${c.tn})`);
  }

  // ─── Write report.md ──────────────────────────────────────────────────────

  const piiPositiveCount = gold.spans.filter(s => s.isPii).length;
  const piiNegativeCount = gold.spans.filter(s => !s.isPii).length;

  const typeRows = typeKeys
    .filter(t => perType[t].tp + perType[t].fn + perType[t].fp > 0)
    .map(t => {
      const c = perType[t];
      const m = computeMetrics(c.tp, c.fp, c.fn, c.tn);
      return `| ${t.padEnd(16)} | ${c.tp} | ${c.fp} | ${c.fn} | ${c.tn} | ${pct(m.precision)} | ${pct(m.recall)} | ${pct(m.f1)} |`;
    })
    .join('\n');

  const fpList = falsePositives.map(f => `- \`${f.text}\` (classified as: ${f.expectedType})`).join('\n') || '_None_';
  const fnList = falseNegatives.map(f => `- \`${f.text}\` (expected: ${f.expectedType})`).join('\n') || '_None_';

  const reportMd = `# PII Redaction – Evaluation Report

_Generated: ${new Date().toISOString()}_

## 1. Method Summary

Regex-first detection with lightweight rule heuristics, implemented in TypeScript.
Each PII type has a dedicated detector function returning \`{ type, value, start, end, confidence }\` spans.

Detectors implemented:
- **email** – RFC-style regex (high precision)
- **phone** – Multiple Indian format regexes with digit-count validation
- **ip** – Strict IPv4 octet regex
- **ssn** – US SSN pattern \`###-##-####\`
- **credit_card** – 13–19 digit regex + Luhn checksum
- **dob** – Context-sensitive + standalone year-range filter
- **full_name** – Heuristic: Title-Case 2–4 words + non-name blocklist + context labels
- **company_name** – Multi-word + known suffix (Limited, Ltd, LLP, etc.)
- **address** – Keyword-triggered span + PIN pattern
- **pan** – \`[A-Z]{5}[0-9]{4}[A-Z]\` (Indian PAN)
- **cin** – Standard CIN pattern
- **din** – 8 digits in labeled DIN context

**Consistency**: A shared \`PiiMapper\` (djb2 hash → pool index) ensures every unique real value
always maps to the same fake across the entire document.

**Matching rule for evaluation**:
1. Exact string match: \`detected.value === gold.text\`
2. Normalized: \`normalize(detected) === normalize(gold)\` (trim + collapse whitespace + lowercase)
3. Containment: gold text is a substring of detected value or vice versa

---

## 2. Dataset Size

| Category | Count |
|---|---|
| Total gold spans | ${gold.totalSpans} |
| Positive (is PII) | ${piiPositiveCount} |
| Negative (not PII) | ${piiNegativeCount} |

---

## 3. Overall Metrics

| Metric | Value |
|---|---|
| True Positives (TP) | ${overallTp} |
| False Positives (FP) | ${overallFp} |
| False Negatives (FN) | ${overallFn} |
| True Negatives (TN) | ${overallTn} |
| **Precision** | **${pct(overall.precision)}** |
| **Recall** | **${pct(overall.recall)}** |
| **F1 Score** | **${pct(overall.f1)}** |
| **Accuracy** | **${pct(overall.accuracy)}** |

> **Accuracy definition**: (TP + TN) / (TP + FP + FN + TN) — fraction of all span decisions that were correct.

---

## 4. Per-Type Metrics

| Type             | TP | FP | FN | TN | Precision | Recall | F1 |
|---|---|---|---|---|---|---|---|
${typeRows}

---

## 5. Observed False Positives

${fpList}

---

## 6. Observed False Negatives

${fnList}

---

## 7. Limitations and Next Improvements

### Current Limitations
1. **Full-name detection** has the highest FP rate: Title-Case heuristics can misfire on place names, section headings, and product names despite the blocklist.
2. **Address detection** is conservative (requires keywords); addresses without standard keywords may be missed.
3. **DOB vs. event dates**: Standalone DD/MM/YYYY dates within DOB year range (1900–2010) can catch corporate founding dates (July 30, 1979). Mitigation: require DOB keyword context for high confidence.
4. **No NER**: Without a language model, novel names not following Title-Case patterns (e.g., all-lowercase or hyphenated) will be missed.
5. **Tables**: mammoth flattens tables to text rows; complex table structure is not reconstructed.
6. **Images/scanned content**: PAN card image on page 128 is embedded; text inside images is NOT extracted or redacted by this tool.

### Next Improvements
1. Add a lightweight NER model (e.g., compromise.js) as a fallback for name detection.
2. Context-window analysis (±2 sentences) for address and name confidence boosting.
3. Luhn-check already implemented for credit cards; extend format-preserving encryption (FPE) for PAN/DIN.
4. OCR integration (Tesseract.js) to redact PII inside embedded images.
5. Interactive review UI: show all detected spans for human approval before final redaction.
`;

  const reportPath = path.resolve(process.cwd(), 'evaluation/report.md');
  fs.writeFileSync(reportPath, reportMd, 'utf-8');

  console.log(`\n✅  Report written to: ${reportPath}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
