import fs from 'node:fs';
import path from 'node:path';

const CAT = 'redirects';

export const redirects = [
  rule('meta-refresh', 'critical', 'Page uses <meta http-equiv="refresh"> redirect', (p) => {
    const out = [];
    for (const file of p.files) {
      if (/http-equiv\s*=\s*["']refresh["']/i.test(file.text)) {
        out.push({ file: file.rel });
      }
    }
    return out;
  }),
  rule('redirects-large', 'notice', 'next.config has many static redirects (review for chains)', (p) => {
    for (const c of ['next.config.js', 'next.config.mjs', 'next.config.ts', 'redirects.json']) {
      const abs = path.join(p.root, c);
      if (!fs.existsSync(abs)) continue;
      const text = fs.readFileSync(abs, 'utf8');
      const matches = text.match(/source\s*:/g);
      if (matches && matches.length > 50) return [{ file: c, hint: `${matches.length} redirect entries — audit for chains/loops` }];
    }
    return [];
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }
