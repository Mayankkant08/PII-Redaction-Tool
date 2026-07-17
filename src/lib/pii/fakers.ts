// src/lib/pii/fakers.ts
// Deterministic fake value generators.
// Hash the original value to deterministically pick from a pool.

import type { PiiType } from './types';

// ─── Simple hash (djb2) for determinism ──────────────────────────────────────

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return Math.abs(h >>> 0);
}

function pick<T>(arr: T[], key: string): T {
  return arr[hashStr(key) % arr.length];
}

// ─── Pools ───────────────────────────────────────────────────────────────────

const FAKE_FIRST_NAMES = [
  'John', 'Peter', 'Alice', 'Robert', 'Mary', 'James', 'Sarah', 'David',
  'Emma', 'Michael', 'Laura', 'William', 'Anna', 'Thomas', 'Rachel',
  'Christopher', 'Jessica', 'Daniel', 'Olivia', 'Andrew',
];

const FAKE_LAST_NAMES = [
  'Doe', 'Parker', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas',
  'Jackson', 'White', 'Harris', 'Martin', 'Garcia', 'Martinez',
];

const FAKE_COMPANIES = [
  'Acme Corp Private Limited',
  'Globex Securities Limited',
  'Initech Enterprises Ltd',
  'Umbrella Industries Private Limited',
  'Dunder Mifflin Associates LLP',
  'Soylent Technologies Limited',
  'Massive Dynamic Private Limited',
  'Nakatomi Holdings Ltd',
  'Oscorp Ventures Private Limited',
  'Stark Industries Limited',
  'Wayne Enterprises Private Limited',
  'LexCorp Securities Ltd',
  'Vandermeer Finance Private Limited',
  'Bluth Company Associates',
  'Pied Piper Technologies Ltd',
];

const FAKE_STREETS = [
  '42 Baker Street', '221B Elm Avenue', '10 Downing Road', '1600 Pennsylvania Marg',
  'Plot 7, Sector 12', '3rd Floor, Acme Building', 'Survey No. 42, Industrial Area',
  'Flat 5, Green Park Colony', '12/A, Model Colony Road', '99, Ring Road',
];

const FAKE_CITIES = ['Pune', 'Mumbai', 'Nashik', 'Nagpur', 'Aurangabad'];
const FAKE_STATES = ['Maharashtra', 'Gujarat', 'Karnataka'];
const FAKE_PINS = ['400001', '411001', '411045', '422001', '440001'];

const FAKE_PANS = [
  'AAAAA0000A', 'BBBBB1111B', 'CCCCC2222C', 'DDDDD3333D', 'EEEEE4444E',
  'FFFFF5555F', 'GGGGG6666G', 'HHHHH7777H', 'IIIII8888I', 'JJJJJ9999J',
];

const FAKE_CINS = [
  'U99999MH2000PLC999999',
  'L88888DL2001PLC888888',
  'U77777KA2002PLC777777',
  'L66666GJ2003PLC666666',
];

const FAKE_DOMAINS = ['example.com', 'redacted.org', 'sample.net', 'placeholder.io'];

// ─── Fake generators ─────────────────────────────────────────────────────────

// Keep a map of real name → fake name index so email matches name
const nameMap = new Map<string, { first: string; last: string }>();

export function fakeName(real: string): string {
  if (nameMap.has(real)) {
    const n = nameMap.get(real)!;
    return `${n.first} ${n.last}`;
  }
  const first = pick(FAKE_FIRST_NAMES, real + '_first');
  const last = pick(FAKE_LAST_NAMES, real + '_last');
  nameMap.set(real, { first, last });
  return `${first} ${last}`;
}

export function fakeEmail(real: string): string {
  // Try to derive from a mapped name
  const atIdx = real.indexOf('@');
  const localPart = atIdx > -1 ? real.slice(0, atIdx) : real;
  const domain = pick(FAKE_DOMAINS, real);
  const first = pick(FAKE_FIRST_NAMES, localPart + '_e_first').toLowerCase();
  const last = pick(FAKE_LAST_NAMES, localPart + '_e_last').toLowerCase();
  return `${first}.${last}@${domain}`;
}

export function fakePhone(real: string): string {
  // Format-preserving: keep +91 prefix and length
  const digits = real.replace(/\D/g, '');
  const h = hashStr(real);
  if (real.startsWith('+91') || real.startsWith('91')) {
    // Produce a 10-digit mobile starting with 9
    const suffix = String(h).padStart(10, '0').slice(0, 9);
    return `+91 9${suffix}`;
  }
  // Generic
  const fake = String(9000000000 + (h % 999999999));
  return fake;
}

export function fakeCompany(real: string): string {
  return pick(FAKE_COMPANIES, real);
}

export function fakeAddress(real: string): string {
  const street = pick(FAKE_STREETS, real + '_street');
  const city = pick(FAKE_CITIES, real + '_city');
  const state = pick(FAKE_STATES, real + '_state');
  const pin = pick(FAKE_PINS, real + '_pin');
  return `${street}, ${city} - ${pin}, ${state}, India`;
}

export function fakePan(_real: string): string {
  return pick(FAKE_PANS, _real);
}

export function fakeCin(_real: string): string {
  return pick(FAKE_CINS, _real);
}

export function fakeDin(real: string): string {
  const h = hashStr(real);
  return String(10000000 + (h % 89999999));
}

export function fakeSSN(real: string): string {
  const h = hashStr(real);
  const a = String(100 + (h % 799)).padStart(3, '0');
  const b = String(10 + (h % 89)).padStart(2, '0');
  const c = String(1000 + (h % 8999)).padStart(4, '0');
  return `${a}-${b}-${c}`;
}

export function fakeCreditCard(real: string): string {
  const h = hashStr(real);
  // Generate 16-digit Luhn-valid number
  const prefix = '4000'; // Visa-like
  const body = String(h).padStart(12, '1').slice(0, 11);
  const partial = prefix + body;
  // Compute Luhn check digit
  let sum = 0;
  for (let i = 0; i < partial.length; i++) {
    let n = parseInt(partial[partial.length - 1 - i], 10);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${partial}${check}`;
}

export function fakeIP(real: string): string {
  const h = hashStr(real);
  return `192.168.${(h >> 8) & 0xff}.${h & 0xff}`;
}

export function fakeDOB(real: string): string {
  const h = hashStr(real);
  const year = 1970 + (h % 30);
  const month = String(1 + (h % 12)).padStart(2, '0');
  const day = String(1 + (h % 28)).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

// ─── Unified fake generator dispatch ─────────────────────────────────────────

export function generateFake(type: PiiType, real: string): string {
  switch (type) {
    case 'email':       return fakeEmail(real);
    case 'phone':       return fakePhone(real);
    case 'ip':          return fakeIP(real);
    case 'ssn':         return fakeSSN(real);
    case 'credit_card': return fakeCreditCard(real);
    case 'dob':         return fakeDOB(real);
    case 'full_name':   return fakeName(real);
    case 'company_name':return fakeCompany(real);
    case 'address':     return fakeAddress(real);
    case 'pan':         return fakePan(real);
    case 'din':         return fakeDin(real);
    case 'cin':         return fakeCin(real);
    default:            return '[REDACTED]';
  }
}
