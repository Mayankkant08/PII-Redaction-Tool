// src/app/api/redact/route.ts
// POST /api/redact
// Accepts multipart/form-data with field "file" (.docx)
// Returns: redacted DOCX download OR JSON stats if ?mode=json

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { readDocx } from '@/lib/docx/readDocx';
import { redactParagraphs } from '@/lib/pii/redact';
import { PiiMapper } from '@/lib/pii/mapper';
import { writeDocxBuffer, writeDocxFile } from '@/lib/docx/writeDocx';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

export async function POST(req: NextRequest) {
  try {
    // ── Parse multipart form ──────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded. Use field name "file".' }, { status: 400 });
    }

    // Validate .docx
    const fileName = (file as File).name ?? 'upload';
    if (!fileName.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: 'Only .docx files are supported.' }, { status: 415 });
    }

    // ── Convert File → Buffer ─────────────────────────────────────────────
    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Run redaction pipeline ────────────────────────────────────────────
    const { paragraphs } = await readDocx(buffer);
    const mapper = new PiiMapper();
    const { redactedParagraphs, mapping, stats } = redactParagraphs(paragraphs, mapper);

    // ── Save server-side copy ─────────────────────────────────────────────
    try {
      if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      await writeDocxFile(redactedParagraphs, path.join(OUTPUT_DIR, 'redacted_prospectus.docx'));
    } catch {
      // Non-fatal: server copy write failure doesn't block the response
    }

    // ── Mode: JSON ────────────────────────────────────────────────────────
    const mode = req.nextUrl.searchParams.get('mode');
    if (mode === 'json') {
      return NextResponse.json({
        stats,
        mappingCount: mapping.length,
        mapping: mapping.slice(0, 50), // first 50 for response size
      });
    }

    // ── Mode: DOCX download ───────────────────────────────────────────────
    const docxBuffer = await writeDocxBuffer(redactedParagraphs);
    const outName = fileName.replace(/\.docx$/i, '_redacted.docx');

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${outName}"`,
        'Access-Control-Expose-Headers': 'Content-Disposition, X-Pii-Stats, X-Mapping-Count',
        'X-Pii-Stats': JSON.stringify(stats),
        'X-Mapping-Count': String(mapping.length),
      },
    });
  } catch (err) {
    console.error('[/api/redact] Error:', err);
    return NextResponse.json({ error: 'Internal server error during redaction.' }, { status: 500 });
  }
}
