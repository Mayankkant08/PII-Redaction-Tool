// src/lib/pii/redact.ts
// Core redaction pipeline.
// Takes raw text, detects PII, replaces with fakes, returns RedactionResult.

import type { RedactionResult, MappingEntry } from './types';
import { PII_TYPES } from './types';
import { detectAllPii } from './detectors';
import { PiiMapper } from './mapper';

/**
 * Redact all PII in text.
 * - Detects all PII spans
 * - Replaces longest/highest-priority match first (sorted desc by start)
 * - Maintains consistent mapping via PiiMapper
 * - Returns redacted text + full mapping + per-type stats
 */
export function redactText(text: string, mapper?: PiiMapper): RedactionResult {
  const m = mapper ?? new PiiMapper();

  const matches = detectAllPii(text);

  // Sort descending by start so we can splice from the end without shifting indices
  const sorted = [...matches].sort((a, b) => b.start - a.start || a.end - b.end);

  let redacted = text;

  for (const match of sorted) {
    const fake = m.getOrCreate(match.type, match.value);
    redacted =
      redacted.slice(0, match.start) +
      fake +
      redacted.slice(match.end);
  }

  // Build mapping entries
  const allEntries = m.entries();

  // Build per-type stats
  const stats = Object.fromEntries(PII_TYPES.map(t => [t, 0])) as Record<(typeof PII_TYPES)[number], number>;
  for (const match of matches) {
    stats[match.type] = (stats[match.type] ?? 0) + 1;
  }

  // Consolidate count per real value in mapping
  const countMap = new Map<string, number>();
  for (const match of matches) {
    countMap.set(match.value, (countMap.get(match.value) ?? 0) + 1);
  }

  const mapping: MappingEntry[] = allEntries.map(e => ({
    ...e,
    count: countMap.get(e.real) ?? e.count,
  }));

  return { redactedText: redacted, mapping, stats };
}

/**
 * Redact multiple paragraphs, sharing a single PiiMapper across all.
 * Returns an array of redacted paragraphs in the same order.
 */
export function redactParagraphs(paragraphs: string[], mapper?: PiiMapper): {
  redactedParagraphs: string[];
  mapping: MappingEntry[];
  stats: Record<(typeof PII_TYPES)[number], number>;
} {
  const m = mapper ?? new PiiMapper();
  const redactedParagraphs: string[] = [];
  const stats = Object.fromEntries(PII_TYPES.map(t => [t, 0])) as Record<(typeof PII_TYPES)[number], number>;

  for (const para of paragraphs) {
    const result = redactText(para, m);
    redactedParagraphs.push(result.redactedText);
    for (const [type, count] of Object.entries(result.stats)) {
      stats[type as keyof typeof stats] += count;
    }
  }

  return { redactedParagraphs, mapping: m.entries(), stats };
}
