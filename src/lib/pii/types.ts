// src/lib/pii/types.ts
// Core type definitions for the PII detection and redaction pipeline

export const PII_TYPES = [
  'email',
  'phone',
  'ip',
  'ssn',
  'credit_card',
  'dob',
  'full_name',
  'company_name',
  'address',
  'pan',
  'din',
  'cin',
] as const;

export type PiiType = (typeof PII_TYPES)[number];

/** A detected PII span in a piece of text */
export interface PiiMatch {
  type: PiiType;
  value: string;
  start: number;
  end: number;
  confidence: number; // 0–1
}

/** A single mapping entry: real → fake */
export interface MappingEntry {
  type: PiiType;
  real: string;
  fake: string;
  count: number;
}

/** Output from the redactText pipeline */
export interface RedactionResult {
  redactedText: string;
  mapping: MappingEntry[];
  stats: Record<PiiType, number>;
}
