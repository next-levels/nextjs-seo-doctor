import { extractMetadata, findStringFieldDeep, findJsxOpeners, getAttr, hasField, lineOf } from '../parse-helpers.js';

const CAT = 'indexability';

export const indexability = [
  rule('metadata-missing', 'warning', 'Page does not declare its own metadata', (p) => {
    if (!parentLayoutHasMetadata(p)) {
      // No template at all → critical site issue, surface only once.
      return [{ file: '(site)', hint: 'No metadata in root layout and no per-page metadata. Search engines see no title/description.' }];
    }
    const out = [];
    for (const file of p.pages) {
      const meta = extractMetadata(file.text);
      if (!meta) out.push({ file: file.rel, hint: 'No `metadata` const or `generateMetadata` — page inherits from layout title.template only' });
    }
    return out;
  }),
  rule('canonical-missing', 'warning', 'Canonical URL not set', (p) => {
    let foundAny = false;
    for (const file of [...p.pages, ...p.layouts]) {
      const meta = extractMetadata(file.text);
      if (!meta) continue;
      if (/canonical\s*[:=]/.test(meta.body) || /buildAlternates|alternates\s*:/.test(meta.body)) foundAny = true;
    }
    if (foundAny) return [];
    return [{ file: '(site)', hint: 'No metadata.alternates.canonical found in any layout/page' }];
  }),
  rule('canonical-relative', 'warning', 'Canonical URL is relative (should be absolute)', (p) => {
    const out = [];
    for (const file of [...p.pages, ...p.layouts]) {
      const meta = extractMetadata(file.text);
      if (!meta || meta.kind !== 'static') continue;
      const m = /canonical\s*:\s*(['"`])([^'"`]+)\1/.exec(meta.body);
      if (m && !/^https?:\/\//.test(m[2]) && !m[2].startsWith('${')) {
        out.push({ file: file.rel, hint: `canonical: "${m[2]}"` });
      }
    }
    return out;
  }),
  rule('html-lang-missing', 'critical', '<html> tag is missing the lang attribute', (p) => {
    const out = [];
    for (const file of p.layouts) {
      const ops = findJsxOpeners(file.text, 'html');
      for (const op of ops) {
        if (!getAttr(op, 'lang')) {
          out.push({ file: file.rel, line: lineOf(file.text, op.index), hint: '<html> without lang' });
        }
      }
    }
    return out;
  }),
  rule('robots-noindex', 'notice', 'Page declares noindex', (p) => {
    const out = [];
    for (const file of p.pages) {
      const meta = extractMetadata(file.text);
      if (!meta || meta.kind !== 'static') continue;
      if (/robots\s*:\s*{[\s\S]*?index\s*:\s*false/.test(meta.body)) {
        out.push({ file: file.rel, hint: 'metadata.robots.index = false' });
      }
    }
    return out;
  }),
  rule('charset-missing', 'notice', 'Charset not declared (Next normally injects, custom <head> may omit)', (p) => {
    const out = [];
    for (const file of p.layouts) {
      if (/<head[\s>]/.test(file.text) && !/charSet|charset/i.test(file.text)) {
        out.push({ file: file.rel, hint: 'custom <head> without charSet' });
      }
    }
    return out;
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }

function parentLayoutHasMetadata(p) {
  for (const file of p.layouts) {
    if (extractMetadata(file.text)) return true;
  }
  return false;
}
