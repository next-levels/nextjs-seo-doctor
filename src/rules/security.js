import fs from 'node:fs';
import path from 'node:path';
import { lineOf } from '../parse-helpers.js';

const CAT = 'security';

export const security = [
  rule('http-link-w3', 'notice', 'Page has HTTP link to www.w3.org', (p) => {
    const out = [];
    for (const file of p.files) {
      const m = /http:\/\/www\.w3\.org\/[A-Za-z0-9./_-]+/g;
      let it; let count = 0;
      while ((it = m.exec(file.text)) != null) { count++; if (count === 1) out.push({ file: file.rel, line: lineOf(file.text, it.index), hint: it[0] }); }
    }
    return out;
  }),
  rule('http-link-other', 'warning', 'Page references insecure http:// resource', (p) => {
    const out = [];
    for (const file of p.files) {
      const re = /(href|src)\s*=\s*["'`]http:\/\/(?!www\.w3\.org|localhost|127\.|0\.0\.0\.0)[^"'`]+/g;
      let it;
      while ((it = re.exec(file.text)) != null) {
        out.push({ file: file.rel, line: lineOf(file.text, it.index), hint: it[0].slice(0, 80) });
      }
    }
    return out;
  }),
  rule('csp-missing', 'notice', 'No Content-Security-Policy header configured', (p) => {
    if (hasHeader(p, /content-security-policy/i)) return [];
    return [{ file: '(site)', hint: 'Add CSP via next.config.js headers() or middleware' }];
  }),
  rule('xfo-missing', 'notice', 'No X-Frame-Options / frame-ancestors configured', (p) => {
    if (hasHeader(p, /x-frame-options|frame-ancestors/i)) return [];
    return [{ file: '(site)', hint: 'Defence against click-jacking missing' }];
  }),
  rule('nosniff-missing', 'notice', 'No X-Content-Type-Options: nosniff configured', (p) => {
    if (hasHeader(p, /x-content-type-options/i)) return [];
    return [{ file: '(site)', hint: 'Defence against MIME-type sniffing missing' }];
  }),
  rule('xss-missing', 'notice', 'No XSS protection / strict CSP configured', (p) => {
    if (hasHeader(p, /x-xss-protection|content-security-policy/i)) return [];
    return [{ file: '(site)', hint: 'No XSS-mitigation header found in next.config or middleware' }];
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }

function hasHeader(p, regex) {
  const candidates = [
    'next.config.js', 'next.config.mjs', 'next.config.ts',
    'middleware.ts', 'middleware.js',
    'src/middleware.ts', 'src/middleware.js',
  ];
  for (const c of candidates) {
    const abs = path.join(p.root, c);
    if (fs.existsSync(abs)) {
      const text = fs.readFileSync(abs, 'utf8');
      if (regex.test(text)) return true;
    }
  }
  // also check vercel.json
  const vercel = path.join(p.root, 'vercel.json');
  if (fs.existsSync(vercel)) {
    if (regex.test(fs.readFileSync(vercel, 'utf8'))) return true;
  }
  return false;
}
