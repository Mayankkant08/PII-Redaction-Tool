// scripts/generate-sample-docx.ts
// Creates a sample Red_Herring_Prospectus.docx from the memory data
// for demonstration/testing purposes when the real DOCX is not present.

import {
  Document, Paragraph, TextRun, HeadingLevel, Packer,
} from 'docx';
import fs from 'fs';
import path from 'path';

const CONTENT = `
KSH INTERNATIONAL LIMITED
(Corporate Identity Number: U28129PN1979PLC141032)
Formerly known as Bhandary Metal Extrusion Private Limited (incorporated July 30, 1979)
and KSH International Private Limited (changed on June 24, 1996)
Converted to public limited company on January 20, 2025

RED HERRING PROSPECTUS
Dated: December 10, 2025

REGISTERED OFFICE:
11/3, 11/4 and 11/5 Village Birdewadi, Chakan Taluka - Khed, Pune - 410 501, Maharashtra, India

CORPORATE OFFICE:
201, Tower 2, Montreal Business Centre, Off Pallod Farms, Baner, Pune - 411 045, Maharashtra, India

Contact Person: Sarthak Malvadkar (Company Secretary and Compliance Officer)
Email: cs.connect@kshinternational.com
Telephone: +91 20 45053237
Website: www.kshinternational.com

PROMOTERS
The Promoters of our Company are:
1. Kushal Subbayya Hegde
2. Pushpa Kushal Hegde
3. Rajesh Kushal Hegde
4. Rohit Kushal Hegde
5. Rakhi Girija Shetty

BOOK RUNNING LEAD MANAGERS

Nuvama Wealth Management Limited
Contact Person: Lokesh Shah / Soumavo Sarkar
Email: ksh.ipo@nuvama.com
Tel: +91 22 40094400

ICICI Securities Limited
Contact Person: Kishan Rastogi / Abhijit Diwan
Email: ksh@icicisecurities.com
Tel: +91 22 6807 7100

REGISTRAR TO THE OFFER
MUFG Intime India Private Limited (formerly Link Intime India Private Limited)
Contact Person: Shanti Gopalkrishnan
Email: kshinternational.ipo@in.mpms.mufg.com
Tel: +91 81081 14949

KEY OFFER DETAILS
Fresh Issue Size: Up to Equity Shares aggregating up to Rs. 4,200.00 million
Offer for Sale: Up to Equity Shares aggregating up to Rs. 2,900.00 million
Total Offer Size: Up to Equity Shares aggregating up to Rs. 7,100.00 million

Anchor Investor Bidding Date: Monday, December 15, 2025
Bid/Offer Opens On: Tuesday, December 16, 2025
Bid/Offer Closes On: Thursday, December 18, 2025

LISTING: BSE Limited (Designated Stock Exchange) & National Stock Exchange of India Limited (NSE)

FINANCIAL HIGHLIGHTS (FY 2025)
Revenue from Operations: Rs. 19,282.93 million
Restated Profit for Year: Rs. 679.88 million
Total Equity / Net Worth: Rs. 2,985.46 million
Return on Net Worth: 22.77%
Earnings Per Share (Basic): Rs. 11.97
Total Borrowings: Rs. 3,600.49 million

PAN CARD DETAILS (PAGE 128 - PII INCIDENT)
PAN Number: NBWPS1951N
Name: VISHAL SINGH
Father's Name: SUGRIV SINGH
Date of Birth: 06/05/2000

ADDRESS ON PAN CARD:
Income Tax PAN Services Unit, NSDL, 4th Floor, Mantri Sterling, Plot No. 341, Survey No. 997/8, Model Colony, Near Deep Bungalow Chowk, Pune - 411 016, Maharashtra, India
Telephone: +91-20-2721 8080
Fax: +91-20-2721 8081
Email: tininfo@nsdl.co.in

RISK FACTORS
1. Top 10 customers contributed 52.54% of total revenue in FY25. Customer concentration risk is high.
2. Top 10 suppliers accounted for 98.45% of raw materials in FY25.
3. Power Sector accounts for 74.79% of revenue.
4. Export revenues constituted 33.20% of total sales in FY25.
5. Operations depend on 3 manufacturing facilities in Maharashtra.

LITIGATION SUMMARY
By the Company: 2 criminal proceedings (Rs. 11.54 million)
Against the Company: 0 criminal, 0 tax, 0 civil proceedings
By Promoters: 1 criminal proceeding, 1 material civil litigation (Rs. 50.00 million)
Against Promoters: 2 tax proceedings (Rs. 2.78 million)

DIRECTORS AND KEY MANAGERIAL PERSONNEL
Director: Kushal Subbayya Hegde, DIN: 00123456
Director: Rajesh Kushal Hegde, DIN: 00234567
Director: Rohit Kushal Hegde, DIN: 00345678
Company Secretary: Sarthak Malvadkar

For further information, please contact:
Name: Rashi Patil
Email: rashhi.patil@gmail.com
Phone: +91 9876543210

Name: Rohan Dey
Email: rohan.dey@gmail.com
Phone: +91 9876543211

IP Address of registered server: 192.168.1.100
Backup server IP: 10.0.0.1

The Company's CIN is U28129PN1979PLC141032.

DECLARATION
We confirm that all information in this Red Herring Prospectus is true and correct.

Kushal Subbayya Hegde
Pushpa Kushal Hegde
Rajesh Kushal Hegde
Rohit Kushal Hegde

Date: December 10, 2025
Place: Pune, Maharashtra, India
`.trim();

async function main() {
  const lines = CONTENT.split('\n');

  const children: Paragraph[] = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return new Paragraph({ children: [new TextRun('')] });

    // All caps headings
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 100) {
      return new Paragraph({ text: trimmed, heading: HeadingLevel.HEADING_1 });
    }

    return new Paragraph({ children: [new TextRun({ text: trimmed, size: 22 })] });
  });

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = Buffer.from(await Packer.toBuffer(doc));
  const outDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'Red_Herring_Prospectus.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Sample DOCX created at: ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
