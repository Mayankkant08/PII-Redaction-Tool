// scripts/generate-test-docx.ts
// Generates a completely different test DOCX — a fictional HR onboarding document
// with diverse PII types: names, emails, phones, SSN, DOB, addresses, credit cards, IPs, etc.

import {
  Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType,
} from 'docx';
import fs from 'fs';
import path from 'path';

const CONTENT_SECTIONS = [
  {
    heading: 'EMPLOYEE ONBOARDING DOCUMENT',
    level: HeadingLevel.HEADING_1,
    body: [],
  },
  {
    heading: null,
    level: null,
    body: [
      'Confidential — HR Department Use Only',
      'Prepared by: Ananya Sharma, Human Resources Manager',
      'Date Prepared: 14 March 2024',
      'Document Reference: HR/OB/2024/0047',
    ],
  },
  {
    heading: 'SECTION 1 — PERSONAL DETAILS',
    level: HeadingLevel.HEADING_2,
    body: [
      'Employee Name: Priya Mehta',
      'Date of Birth: 22/08/1994',
      'Gender: Female',
      'Nationality: Indian',
      'PAN Number: BVZPM7823K',
      'Aadhaar Reference: Will be collected separately',
      'Personal Email: priya.mehta94@gmail.com',
      'Personal Phone: +91 9823401122',
      'Emergency Contact: Rakesh Mehta (Father)',
      'Emergency Phone: +91 9765001234',
    ],
  },
  {
    heading: 'SECTION 2 — RESIDENTIAL ADDRESS',
    level: HeadingLevel.HEADING_2,
    body: [
      'Current Address: Flat 12B, Sunrise Apartments, MG Road, Pune - 411 001, Maharashtra, India',
      'Permanent Address: 45, Shivaji Nagar Colony, Near Railway Station, Nashik - 422 001, Maharashtra, India',
      'Correspondence Address: Same as Current Address',
    ],
  },
  {
    heading: 'SECTION 3 — EMPLOYMENT DETAILS',
    level: HeadingLevel.HEADING_2,
    body: [
      'Employee ID: EMP-2024-0047',
      'Designation: Senior Software Engineer',
      'Department: Product Engineering',
      'Reporting Manager: Vikram Nair',
      'Work Email: priya.mehta@techvista.in',
      'Work Phone: +91 80 4567 8901',
      'Office Location: Tower B, 3rd Floor, Techvista Park, Electronic City, Bangalore - 560 100, Karnataka, India',
      'Start Date: 01 April 2024',
      'Employment Type: Full-Time Permanent',
      'CTC: Rs. 18,00,000 per annum (Confidential)',
    ],
  },
  {
    heading: 'SECTION 4 — BANK & PAYMENT DETAILS',
    level: HeadingLevel.HEADING_2,
    body: [
      'Bank Name: HDFC Bank Limited',
      'Account Holder: Priya Mehta',
      'Account Number: 5020 0123 4567 890',
      'IFSC Code: HDFC0001234',
      'Branch: Koregaon Park, Pune',
      'Salary Credit Mode: NEFT',
      'Corporate Card (issued after confirmation): 4111 1111 1111 1111',
    ],
  },
  {
    heading: 'SECTION 5 — SYSTEM ACCESS & IT SETUP',
    level: HeadingLevel.HEADING_2,
    body: [
      'Laptop Serial: TLV-2024-BLR-1099',
      'Assigned IP Address: 10.0.45.112',
      'VPN IP Range Assigned: 172.16.0.0/24',
      'Primary Workstation IP: 192.168.10.45',
      'GitHub Handle: pmehta-dev',
      'Slack Username: priya.mehta',
      'IT Admin Contact: helpdesk@techvista.in',
      'IT Admin Phone: 022-6891-0000',
    ],
  },
  {
    heading: 'SECTION 6 — REFERENCES & BACKGROUND VERIFICATION',
    level: HeadingLevel.HEADING_2,
    body: [
      'Reference 1:',
      '  Name: Dr. Suresh Patel',
      '  Designation: Professor, IIT Bombay',
      '  Email: suresh.patel@iitb.ac.in',
      '  Phone: +91 22 2572 3456',
      '',
      'Reference 2:',
      '  Name: Neha Joshi',
      '  Designation: Engineering Manager, Infosys Limited',
      '  Email: neha.joshi@infosys.com',
      '  Phone: +91 80 4116 7800',
      '',
      'Background Verification Agency: TrustVerify Services Private Limited',
      'Verification Contact: Amit Kulkarni',
      'Verification Email: amit.kulkarni@trustverify.in',
      'Verification Phone: +91 98765 43210',
    ],
  },
  {
    heading: 'SECTION 7 — PREVIOUS EMPLOYMENT',
    level: HeadingLevel.HEADING_2,
    body: [
      'Previous Employer: Zenith Analytics Private Limited',
      'Employment Period: June 2020 – February 2024',
      'Last Designation: Software Engineer II',
      'HR Contact: Pooja Rao',
      'HR Email: hr@zenithanalytics.io',
      'HR Phone: +91 80 2345 6789',
      'Reason for Leaving: Better growth opportunity',
      'CIN of Previous Employer: U72200KA2015PTC081234',
    ],
  },
  {
    heading: 'SECTION 8 — ADDITIONAL NOTES',
    level: HeadingLevel.HEADING_2,
    body: [
      'Note 1: Employee provided US SSN 523-45-6789 for overseas payroll compliance (US project team).',
      'Note 2: Travel document — Passport No. will be collected before first international trip.',
      'Note 3: Secondary personal email: priya.r.mehta@yahoo.co.in',
      'Note 4: Date of birth also verified from Govt ID: 22-08-1994',
      'Note 5: Previous company DIN for director reference — DIN: 07654321',
      '',
      'This document was created by Ananya Sharma on behalf of Techvista Solutions Private Limited.',
      'Any queries: contact ananya.sharma@techvista.in or call +91 9900112233.',
    ],
  },
  {
    heading: 'DECLARATION',
    level: HeadingLevel.HEADING_2,
    body: [
      'I, Priya Mehta, hereby declare that all information provided in this onboarding form is true and correct to the best of my knowledge.',
      '',
      'Signed: Priya Mehta',
      'Date: 14/03/2024',
      'Place: Pune, Maharashtra',
    ],
  },
  {
    heading: 'AUTHORISED BY HR',
    level: HeadingLevel.HEADING_2,
    body: [
      'HR Manager: Ananya Sharma',
      'Email: ananya.sharma@techvista.in',
      'Employee ID: HR-0012',
      'Date: 15/03/2024',
      '',
      '— END OF DOCUMENT —',
    ],
  },
];

async function main() {
  const children: Paragraph[] = [];

  for (const section of CONTENT_SECTIONS) {
    // Section heading
    if (section.heading && section.level) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: section.level,
          spacing: { before: 300, after: 100 },
        }),
      );
    }

    // Body lines
    for (const line of section.body) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          alignment: AlignmentType.LEFT,
          spacing: { after: 80 },
        }),
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = Buffer.from(await Packer.toBuffer(doc));
  const outDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'test_employee_onboarding.docx');
  fs.writeFileSync(outPath, buffer);

  console.log(`✅  Test DOCX created: ${outPath}`);
  console.log(`\nPII planted in this document:`);
  console.log(`  👤 Names        : Priya Mehta, Ananya Sharma, Vikram Nair, Rakesh Mehta,`);
  console.log(`                    Dr. Suresh Patel, Neha Joshi, Pooja Rao, Amit Kulkarni`);
  console.log(`  📧 Emails       : priya.mehta94@gmail.com, priya.mehta@techvista.in, suresh.patel@iitb.ac.in,`);
  console.log(`                    neha.joshi@infosys.com, ananya.sharma@techvista.in, hr@zenithanalytics.io`);
  console.log(`  📞 Phones       : +91 9823401122, +91 9765001234, +91 80 4567 8901, +91 98765 43210, 022-6891-0000`);
  console.log(`  🪪 PAN          : BVZPM7823K`);
  console.log(`  🏛️  CIN          : U72200KA2015PTC081234`);
  console.log(`  🆔 DIN          : 07654321`);
  console.log(`  🎂 DOB          : 22/08/1994 (appears twice in different formats)`);
  console.log(`  🌐 IP Addresses : 10.0.45.112, 192.168.10.45`);
  console.log(`  💳 Credit Card  : 4111 1111 1111 1111 (Luhn-valid)`);
  console.log(`  🔒 SSN          : 523-45-6789`);
  console.log(`  📍 Addresses    : Flat 12B Sunrise Apartments Pune, Shivaji Nagar Nashik, Electronic City Bangalore`);
  console.log(`  🏢 Companies    : HDFC Bank Limited, Infosys Limited, Zenith Analytics Private Limited,`);
  console.log(`                    TrustVerify Services Private Limited, Techvista Solutions Private Limited`);
}

main().catch(err => { console.error(err); process.exit(1); });
