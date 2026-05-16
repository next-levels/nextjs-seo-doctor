import { extractViewport } from '../parse-helpers.js';

const CAT = 'mobile-friendly';

export const mobileFriendly = [
  rule('viewport-missing', 'critical', 'No viewport meta configured', (p) => {
    let found = false;
    for (const file of p.layouts) {
      if (extractViewport(file.text)) { found = true; break; }
      if (/<meta[^>]+name\s*=\s*["']viewport["']/.test(file.text)) { found = true; break; }
    }
    if (found) return [];
    return [{ file: '(site)', hint: 'No `export const viewport` and no <meta name="viewport"> in layouts' }];
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }
