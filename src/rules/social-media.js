import { extractMetadata } from '../parse-helpers.js';

const CAT = 'social-media';

export const socialMedia = [
  rule('og-missing', 'warning', 'No OpenGraph metadata configured', (p) => {
    const found = anyMeta(p, /openGraph\s*:/);
    if (found) return [];
    return [{ file: '(site)', hint: 'No metadata.openGraph in any layout/page' }];
  }),
  rule('og-image-missing', 'warning', 'OpenGraph configured without images', (p) => {
    const out = [];
    for (const file of [...p.layouts, ...p.pages]) {
      const meta = extractMetadata(file.text);
      if (!meta) continue;
      if (/openGraph\s*:\s*\{/.test(meta.body) && !/images\s*[:=]/.test(meta.body) && !/openGraphImages|defaultOgImage|ogImage/i.test(meta.body)) {
        out.push({ file: file.rel, hint: 'openGraph defined without images[]' });
      }
    }
    return out;
  }),
  rule('twitter-missing', 'notice', 'No Twitter card metadata configured', (p) => {
    if (anyMeta(p, /twitter\s*:/)) return [];
    return [{ file: '(site)', hint: 'No metadata.twitter card in any layout/page' }];
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }
function anyMeta(p, regex) {
  for (const file of [...p.layouts, ...p.pages]) {
    const meta = extractMetadata(file.text);
    if (!meta) continue;
    if (regex.test(meta.body)) return true;
  }
  return false;
}
