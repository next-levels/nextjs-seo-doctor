import { findJsxOpeners, getAttr, lineOf } from '../parse-helpers.js';

const CAT = 'page-speed';

export const pageSpeed = [
  rule('image-no-dimensions', 'warning', '<Image> missing width/height/fill', (p) => {
    const out = [];
    for (const file of p.files) {
      for (const op of findJsxOpeners(file.text, 'Image')) {
        const w = getAttr(op, 'width');
        const h = getAttr(op, 'height');
        const fill = getAttr(op, 'fill');
        if (!w && !h && !fill) {
          out.push({ file: file.rel, line: lineOf(file.text, op.index), hint: '<Image> without width/height or fill' });
        }
      }
    }
    return out;
  }),
  rule('img-no-loading', 'notice', '<img> without loading="lazy"', (p) => {
    const out = [];
    for (const file of p.files) {
      for (const op of findJsxOpeners(file.text, 'img')) {
        const loading = getAttr(op, 'loading');
        if (!loading) out.push({ file: file.rel, line: lineOf(file.text, op.index) });
      }
    }
    return out;
  }),
  rule('img-not-modern', 'notice', 'Image source uses legacy format (.jpg/.png) instead of webp/avif', (p) => {
    const out = [];
    const seen = new Set();
    for (const file of p.files) {
      const m = /["'`]([^"'`]+\.(jpg|jpeg|png))["'`]/gi;
      let it;
      while ((it = m.exec(file.text)) != null) {
        if (seen.has(it[1])) continue;
        seen.add(it[1]);
        out.push({ file: file.rel, line: lineOf(file.text, it.index), hint: it[1] });
        if (out.length > 50) return out;
      }
    }
    return out;
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }
