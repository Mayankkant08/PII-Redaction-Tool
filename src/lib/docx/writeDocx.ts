// src/lib/docx/writeDocx.ts
// Write redacted paragraphs to a DOCX file using the docx library.
// NOTE: Original styling (fonts, tables, images) is NOT preserved.
// Trade-off: We preserve readable paragraph structure for text content.

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from 'docx';
import fs from 'fs';
import path from 'path';

/**
 * Classify a paragraph line into a rough heading level based on heuristics.
 * Returns null for regular body paragraphs.
 */
function classifyLine(line: string): (typeof HeadingLevel)[keyof typeof HeadingLevel] | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // All-caps short lines → heading 1
  if (trimmed === trimmed.toUpperCase() && trimmed.length < 80 && /[A-Z]{3,}/.test(trimmed)) {
    return HeadingLevel.HEADING_1;
  }
  // Numbered section like "1." or "1.1" → heading 2
  if (/^\d+(\.\d+)*\s+[A-Z]/.test(trimmed)) {
    return HeadingLevel.HEADING_2;
  }
  return null;
}

/**
 * Build a DOCX Document from an array of (possibly empty) paragraph strings.
 */
function buildDocument(paragraphs: string[]): Document {
  const children: Paragraph[] = paragraphs.map(line => {
    if (!line.trim()) {
      // Empty paragraph for spacing
      return new Paragraph({ children: [new TextRun('')] });
    }

    const headingLevel = classifyLine(line);

    if (headingLevel) {
      return new Paragraph({
        text: line.trim(),
        heading: headingLevel,
      });
    }

    return new Paragraph({
      children: [new TextRun({ text: line, size: 22 })], // 11pt
      alignment: AlignmentType.LEFT,
    });
  });

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

/**
 * Convert redacted paragraphs to a DOCX Buffer.
 */
export async function writeDocxBuffer(paragraphs: string[]): Promise<Buffer> {
  const doc = buildDocument(paragraphs);
  return Buffer.from(await Packer.toBuffer(doc));
}

/**
 * Write redacted paragraphs to a DOCX file on disk.
 * Creates parent directories if needed.
 */
export async function writeDocxFile(paragraphs: string[], outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const buffer = await writeDocxBuffer(paragraphs);
  fs.writeFileSync(outputPath, buffer);
}
