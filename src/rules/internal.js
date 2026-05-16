import { lineOf } from '../parse-helpers.js';

const CAT = 'internal';

export const internal = [
  rule('gtm-missing', 'notice', 'No Google Tag Manager / GA snippet detected', (p) => {
    const all = p.files.map(f => f.text).join('\n');
    if (/GTM-[A-Z0-9]+/.test(all)) return [];
    if (/G-[A-Z0-9]{6,}/.test(all)) return [];
    if (/googletagmanager\.com|gtag\(|next-third-parties\/google/.test(all)) return [];
    return [{ file: '(site)', hint: 'No GTM/GA tag (GTM-XXXX, G-XXXX, gtag, next-third-parties)' }];
  }),
  rule('localhost-link', 'warning', 'Hardcoded localhost / 127.0.0.1 link', (p) => {
    const out = [];
    for (const file of p.files) {
      const m = /(href|src)\s*=\s*["'`]https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)[^"'`]*/g;
      let it;
      while ((it = m.exec(file.text)) != null) {
        out.push({ file: file.rel, line: lineOf(file.text, it.index), hint: it[0].slice(0, 80) });
      }
    }
    return out;
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }
