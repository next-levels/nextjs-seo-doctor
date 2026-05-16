import { findJsxOpeners, getAttr, lineOf } from '../parse-helpers.js';

const CAT = 'code-validation';

export const codeValidation = [
  rule('inline-style-overuse', 'notice', 'Inline style attribute found (>= threshold)', (p) => {
    let total = 0;
    const sample = [];
    for (const file of p.files) {
      const m = file.text.match(/\bstyle\s*=\s*\{\{/g);
      if (!m) continue;
      total += m.length;
      if (sample.length < 5) sample.push({ file: file.rel, hint: `${m.length} inline style attribute(s)` });
    }
    if (total >= 50) return sample;
    return [];
  }),
  rule('table-no-caption', 'notice', '<table> without <caption>', (p) => {
    const out = [];
    for (const file of p.files) {
      const tables = file.text.matchAll(/<table[\s>][\s\S]*?<\/table>/g);
      for (const t of tables) {
        if (!/<caption[\s>]/.test(t[0])) {
          out.push({ file: file.rel, line: lineOf(file.text, t.index) });
        }
      }
    }
    return out;
  }),
  rule('headings-skip', 'notice', 'Possible heading hierarchy skip (h1 then h3)', (p) => {
    const out = [];
    for (const file of p.files) {
      // very rough: file contains h1 then h3 with no h2 between
      const order = [...file.text.matchAll(/<h([1-6])[\s>]/g)].map(m => Number(m[1]));
      let prev = 0;
      for (const lvl of order) {
        if (prev && lvl > prev + 1) { out.push({ file: file.rel, hint: `h${prev} → h${lvl}` }); break; }
        prev = lvl;
      }
    }
    return out;
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }
