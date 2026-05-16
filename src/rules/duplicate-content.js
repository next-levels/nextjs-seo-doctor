import { extractMetadata, findStringFieldDeep, findJsxOpeners, getAttr } from '../parse-helpers.js';

const CAT = 'duplicate-content';

export const duplicateContent = [
  {
    id: 'duplicate-title', severity: 'warning', category: CAT,
    title: 'Duplicate page titles',
    check(p) {
      const map = new Map();
      for (const file of p.pages) {
        const meta = extractMetadata(file.text);
        if (!meta || meta.kind !== 'static') continue;
        const t = findStringFieldDeep(meta.body, 'title');
        if (!t) continue;
        if (!map.has(t)) map.set(t, []);
        map.get(t).push(file.rel);
      }
      const out = [];
      for (const [t, files] of map) {
        if (files.length > 1) out.push({ file: files[0], hint: `Title "${t}" used in ${files.length} pages: ${files.slice(0,3).join(', ')}` });
      }
      return out;
    },
  },
  {
    id: 'duplicate-description', severity: 'warning', category: CAT,
    title: 'Duplicate meta descriptions',
    check(p) {
      const map = new Map();
      for (const file of p.pages) {
        const meta = extractMetadata(file.text);
        if (!meta || meta.kind !== 'static') continue;
        const d = findStringFieldDeep(meta.body, 'description');
        if (!d) continue;
        if (!map.has(d)) map.set(d, []);
        map.get(d).push(file.rel);
      }
      const out = [];
      for (const [d, files] of map) {
        if (files.length > 1) out.push({ file: files[0], hint: `Description shared by ${files.length} pages` });
      }
      return out;
    },
  },
  {
    id: 'duplicate-alt', severity: 'notice', category: CAT,
    title: 'Identical alt text reused across many images',
    check(p) {
      const counts = new Map();
      for (const file of p.files) {
        for (const tag of ['img', 'Image']) {
          for (const op of findJsxOpeners(file.text, tag)) {
            const alt = getAttr(op, 'alt');
            if (alt?.kind === 'string' && alt.value.trim().length > 0) {
              const k = alt.value.trim();
              counts.set(k, (counts.get(k) || 0) + 1);
            }
          }
        }
      }
      const out = [];
      for (const [t, n] of counts) {
        if (n >= 5) out.push({ file: '(site)', hint: `alt="${t}" reused ${n}×` });
      }
      return out;
    },
  },
];
