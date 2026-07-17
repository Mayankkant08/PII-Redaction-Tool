# PII Redaction Tool

A tool I built for redacting personally identifiable information from `.docx` files. You feed it a Word document, and it spits out a clean version where every name, email, phone number, and similar sensitive detail has been swapped out with a realistic but fake alternative.

The same fake value is used consistently — so if "Rashi Patil" appears 10 times across the document, it'll always become the same fake name, not a different one each time.

---

## How it works

The core idea is pretty simple: run a bunch of regex patterns over the text, find anything that looks like PII, and replace it before writing the output file.

I didn't use any NLP models or external APIs for a few reasons:
- No model downloads, no Python environment, no GPU needed
- Works offline, runs fast, produces the same output every time
- Easier to audit — you can read exactly what each detector does

The tradeoff is that unusual names (like all-lowercase or hyphenated ones) might slip through. That's expected and documented in the evaluation report.

**For keeping replacements consistent**, every real value gets hashed (djb2) and mapped to a fake from a fixed pool. Same input → same fake, always.

---

## What gets redacted

| What | How it's found |
|---|---|
| Emails | Standard email regex |
| Phone numbers | Indian formats — +91, STD codes, 10-digit mobiles |
| IP addresses | IPv4 pattern |
| SSNs | US format `###-##-####` |
| Credit cards | 13–19 digits, validated with Luhn checksum |
| Dates of birth | DOB keyword context + year range (1900–2010) |
| Full names | Title-Case 2–4 words, with a blocklist to avoid false positives |
| Company names | Multi-word + legal suffix like Limited, LLP, Inc |
| Addresses | Keyword triggers — Road, Street, Taluka, Plot, etc. |
| PAN numbers | Pattern `[A-Z]{5}[0-9]{4}[A-Z]` |
| DIN numbers | 8 digits in a labeled DIN context |
| CIN numbers | Standard Indian company CIN format |

### A note on Indian IDs

PAN, DIN, and CIN are treated as PII and always redacted. Regular numbers like page counts, share quantities, or financial figures are left alone — the tool won't touch those unless they happen to match the PAN/DIN/CIN patterns exactly.

---

## Getting started

```bash
npm install
```

If you don't have the input DOCX yet, generate the sample one:
```bash
npm run generate:docx
```

Then run the redaction:
```bash
npm run redact:cli
```

This reads `data/Red_Herring_Prospectus.docx`, redacts it, and saves the output to `output/redacted_prospectus.docx`. It also prints a summary of what it found.

Need to use your own file?
```bash
npx tsx scripts/redact-cli.ts --input your-file.docx --output redacted-output.docx
```

---

## Checking the results

```bash
npm run evaluate
```

This runs the detectors against a set of 72 hand-labeled spans from the prospectus and calculates precision, recall, F1, and accuracy — both overall and broken down by PII type. The full report gets written to `evaluation/report.md`.

---

## Web UI

```bash
npm run dev
```

Open `http://localhost:3000`. You can drag and drop a DOCX, hit Redact, and see the stats and a sample of the mappings right in the browser. There's also a download button for the redacted file.

---

## Things to know before using this

- **Formatting isn't preserved.** The output DOCX keeps the paragraph text but loses fonts, tables, images, and layout. It's readable, just not styled like the original. This is a known tradeoff with how mammoth extracts text.
- **Images aren't scanned.** If there's a PAN card photo embedded in the document (like on page 128 of the sample prospectus), the tool can't read text inside images. OCR isn't implemented.
- **Tables get flattened.** mammoth converts table cells into plain text rows, so table structure is lost in the output.
- **Unusual names might be missed.** The name detector works on Title-Case patterns. All-lowercase or hyphenated names won't be caught.

---

## Adding a new PII type

It's designed to be modular so this is pretty straightforward:

1. Write a detector function in `src/lib/pii/detectors.ts`:
   ```ts
   export function detectPassports(text: string): PiiMatch[] {
     // your regex logic here
   }
   ```

2. Add it to the `detectAllPii` function in the same file:
   ```ts
   ...detectPassports(text),
   ```

3. Write a fake generator in `src/lib/pii/fakers.ts`:
   ```ts
   export function fakePassport(real: string): string {
     // return a realistic-looking fake
   }
   ```

4. Hook it into the `generateFake` dispatch switch:
   ```ts
   case 'passport': return fakePassport(real);
   ```

5. Add `'passport'` to the `PII_TYPES` array in `src/lib/pii/types.ts`.

6. Add some gold examples to `evaluation/gold_sample.json` and run `npm run evaluate` to see how well it performs.

---

## Project layout

```
pii-redactor/
├── src/
│   ├── app/
│   │   ├── page.tsx               # main page
│   │   ├── layout.tsx
│   │   ├── globals.css            # all the styling
│   │   └── api/redact/route.ts    # POST /api/redact
│   ├── components/
│   │   └── UploadRedactForm.tsx   # the upload + results UI
│   └── lib/
│       ├── pii/
│       │   ├── types.ts           # PiiMatch, PiiType definitions
│       │   ├── detectors.ts       # every detector + detectAllPii
│       │   ├── fakers.ts          # deterministic fake generators
│       │   ├── mapper.ts          # keeps real→fake consistent
│       │   └── redact.ts          # the actual replacement logic
│       └── docx/
│           ├── readDocx.ts        # reads DOCX with mammoth
│           └── writeDocx.ts       # writes DOCX with docx library
├── scripts/
│   ├── redact-cli.ts              # run from terminal
│   ├── evaluate.ts                # generates evaluation/report.md
│   └── generate-sample-docx.ts   # builds the sample input file
├── data/                          # put your input DOCX here
├── output/                        # redacted file ends up here
├── evaluation/
│   ├── gold_sample.json           # 72 labeled test spans
│   └── report.md                  # auto-generated metrics
└── README.md
```
