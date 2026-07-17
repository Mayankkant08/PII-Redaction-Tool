// src/lib/docx/readDocx.ts
// Read a DOCX buffer and extract text + paragraph list using mammoth.

import mammoth from 'mammoth';

export interface DocxContent {
  /** Full raw text (single string) */
  rawText: string;
  /** Individual paragraphs (non-empty lines) */
  paragraphs: string[];
  /** Original HTML from mammoth (for reference) */
  html: string;
}

/**
 * Extract text content from a DOCX buffer.
 * Uses mammoth.extractRawText for plain text and mammoth.convertToHtml for HTML.
 */
export async function readDocx(buffer: Buffer): Promise<DocxContent> {
  const [textResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);

  const rawText = textResult.value;
  const html = htmlResult.value;

  // Split into paragraphs: preserve blank lines as paragraph separators
  const paragraphs = rawText
    .split(/\r?\n/)
    .map(line => line.trim());

  return { rawText, paragraphs, html };
}
