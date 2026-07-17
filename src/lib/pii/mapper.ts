// src/lib/pii/mapper.ts
// PiiMapper: maintains a global real→fake mapping for consistency.
// Singleton pattern so the mapping is shared across the entire document.

import type { PiiType, MappingEntry } from './types';
import { generateFake } from './fakers';

export class PiiMapper {
  /** real value → { fake, type, count } */
  private store = new Map<string, { fake: string; type: PiiType; count: number }>();

  /**
   * Look up or create a fake for (type, realValue).
   * Same real value always returns the same fake (even across types if key collides,
   * which is fine because we store by real value string).
   */
  getOrCreate(type: PiiType, realValue: string): string {
    const existing = this.store.get(realValue);
    if (existing) {
      existing.count++;
      return existing.fake;
    }
    const fake = generateFake(type, realValue);
    this.store.set(realValue, { fake, type, count: 1 });
    return fake;
  }

  /** All mapping entries for report/UI display */
  entries(): MappingEntry[] {
    return Array.from(this.store.entries()).map(([real, { fake, type, count }]) => ({
      real,
      fake,
      type,
      count,
    }));
  }

  /** Count of distinct real values mapped */
  size(): number {
    return this.store.size;
  }

  /** Reset the mapper (useful between independent document runs) */
  reset(): void {
    this.store.clear();
  }
}

/** Module-level singleton for CLI / API route usage */
export const globalMapper = new PiiMapper();
