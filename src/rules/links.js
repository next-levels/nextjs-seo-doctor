import { findJsxOpeners, getAttr, lineOf } from '../parse-helpers.js';

const CAT = 'links';

export const links = [
  rule('empty-href', 'notice', 'Link with empty or "#" href', (p) => {
    const out = [];
    for (const file of p.files) {
      for (const tag of ['a', 'Link']) {
        for (const op of findJsxOpeners(file.text, tag)) {
          const href = getAttr(op, 'href');
          if (href?.kind === 'string' && (href.value === '' || href.value === '#')) {
            out.push({ file: file.rel, line: lineOf(file.text, op.index), hint: `<${tag} href="${href.value}">` });
          }
        }
      }
    }
    return out;
  }),
  rule('blank-no-rel', 'warning', 'External link with target="_blank" missing rel="noopener noreferrer"', (p) => {
    const out = [];
    for (const file of p.files) {
      for (const tag of ['a', 'Link']) {
        for (const op of findJsxOpeners(file.text, tag)) {
          const target = getAttr(op, 'target');
          if (target?.value === '_blank') {
            const rel = getAttr(op, 'rel');
            const v = rel?.kind === 'string' ? rel.value : '';
            if (!v.includes('noopener')) {
              out.push({ file: file.rel, line: lineOf(file.text, op.index), hint: '<a target="_blank"> without rel="noopener"' });
            }
          }
        }
      }
    }
    return out;
  }),
  rule('whitespace-href', 'notice', 'href with surrounding whitespace', (p) => {
    const out = [];
    for (const file of p.files) {
      for (const tag of ['a', 'Link']) {
        for (const op of findJsxOpeners(file.text, tag)) {
          const href = getAttr(op, 'href');
          if (href?.kind === 'string' && href.value !== href.value.trim()) {
            out.push({ file: file.rel, line: lineOf(file.text, op.index), hint: `href="${href.value}"` });
          }
        }
      }
    }
    return out;
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }
