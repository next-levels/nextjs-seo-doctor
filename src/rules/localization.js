import fs from 'node:fs';
import path from 'node:path';
import { extractMetadata } from '../parse-helpers.js';

const CAT = 'localization';

export const localization = [
  rule('hreflang-missing', 'warning', 'i18n project without alternates.languages (hreflang) declared', (p) => {
    if (!isI18nProject(p)) return [];
    let found = false;
    for (const file of [...p.layouts, ...p.pages]) {
      const meta = extractMetadata(file.text);
      if (!meta) continue;
      if (/languages\s*[:=]/.test(meta.body) || /buildAlternates|altLanguages/.test(meta.body)) { found = true; break; }
    }
    if (found) return [];
    return [{ file: '(site)', hint: 'Project appears multilingual but no metadata.alternates.languages anywhere' }];
  }),
  rule('xdefault-missing', 'notice', 'hreflang group missing x-default', (p) => {
    const out = [];
    for (const file of [...p.layouts, ...p.pages]) {
      const meta = extractMetadata(file.text);
      if (!meta || meta.kind !== 'static') continue;
      const m = /languages\s*:\s*\{([\s\S]*?)\}/.exec(meta.body);
      if (m && !/['"`]x-default['"`]/.test(m[1])) {
        out.push({ file: file.rel, hint: 'alternates.languages without "x-default"' });
      }
    }
    return out;
  }),
  rule('html-lang-static', 'notice', '<html lang> is hardcoded; should reflect active locale in i18n projects', (p) => {
    if (!isI18nProject(p)) return [];
    const out = [];
    for (const file of p.layouts) {
      const m = /<html[^>]*\blang\s*=\s*["']([a-zA-Z-]+)["']/.exec(file.text);
      if (m) out.push({ file: file.rel, hint: `<html lang="${m[1]}"> hardcoded — set via params for i18n` });
    }
    return out;
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }

function isI18nProject(p) {
  const deps = { ...(p.pkg?.dependencies || {}), ...(p.pkg?.devDependencies || {}) };
  if (deps['next-intl'] || deps['next-i18next'] || deps['react-i18next']) return true;
  // [locale] segment
  return p.files.some(f => /\[locale\]/.test(f.rel));
}
