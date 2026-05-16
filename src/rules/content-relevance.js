import { extractMetadata, findStringFieldDeep, findJsxOpeners, getAttr, lineOf } from '../parse-helpers.js';

const CAT = 'content-relevance';

function defineMeta() {
  return [
    rule('title-missing', 'critical', 'Page metadata exported without a title', (p) =>
      forEachPage(p, (file, meta) => {
        if (!meta) return; // covered by indexability/metadata-missing
        if (!/title\s*[:=]/.test(meta.body)) {
          return { file: file.rel, line: 1, hint: 'metadata exported without title field' };
        }
      })
    ),
    rule('title-too-short', 'warning', 'Title too short (< 25 chars)', (p) =>
      forEachPage(p, (file, meta) => {
        const t = staticTitle(meta);
        if (t && t.length < 25) return { file: file.rel, hint: `${t.length} chars: "${t}"` };
      })
    ),
    rule('title-too-long', 'warning', 'Title too long (> 60 chars)', (p) =>
      forEachPage(p, (file, meta) => {
        const t = staticTitle(meta);
        if (t && t.length > 60) return { file: file.rel, hint: `${t.length} chars: "${truncate(t, 80)}"` };
      })
    ),
    rule('title-lowercase', 'notice', 'Title starts with lowercase letter', (p) =>
      forEachPage(p, (file, meta) => {
        const t = staticTitle(meta);
        if (t && /^[a-z]/.test(t.trim())) return { file: file.rel, hint: `"${truncate(t, 60)}"` };
      })
    ),
    rule('description-missing', 'critical', 'Description is missing', (p) =>
      forEachPage(p, (file, meta) => {
        if (!meta) return; // covered by metadata-missing
        if (!/\bdescription\s*[:=]/.test(meta.body)) {
          return { file: file.rel, hint: 'metadata exported without description' };
        }
      })
    ),
    rule('description-too-short', 'warning', 'Description too short (< 70 chars)', (p) =>
      forEachPage(p, (file, meta) => {
        const d = staticString(meta, 'description');
        if (d && d.length < 70) return { file: file.rel, hint: `${d.length} chars` };
      })
    ),
    rule('description-too-long', 'warning', 'Description too long (> 160 chars)', (p) =>
      forEachPage(p, (file, meta) => {
        const d = staticString(meta, 'description');
        if (d && d.length > 160) return { file: file.rel, hint: `${d.length} chars` };
      })
    ),
  ];
}

function defineHeadings() {
  return [
    rule('h1-missing-site', 'critical', 'No <h1> tag found anywhere in the codebase', (p) => {
      const total = p.files.reduce((n, f) => n + countH1(f.text), 0);
      if (total === 0) return [{ file: '(site)', hint: 'No <h1> defined in any file. Each page should expose exactly one.' }];
      return [];
    }),
    rule('h1-multiple', 'critical', 'Page has multiple <h1>', (p) => {
      const out = [];
      for (const file of p.files) {
        if (countH1(file.text) > 1) out.push({ file: file.rel, hint: `${countH1(file.text)} <h1> elements` });
      }
      return out;
    }),
    rule('h1-too-long', 'notice', 'H1 text too long (> 70 chars)', (p) => {
      const out = [];
      for (const file of p.files) {
        const matches = file.text.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g);
        for (const m of matches) {
          const txt = stripJsx(m[1]).trim();
          if (txt && txt.length > 70) out.push({ file: file.rel, line: lineOf(file.text, m.index), hint: `${txt.length} chars` });
        }
      }
      return out;
    }),
  ];
}

function defineImages() {
  return [
    rule('img-alt-missing', 'critical', 'Image without alt attribute', (p) => {
      const out = [];
      for (const file of p.files) {
        for (const tag of ['img', 'Image']) {
          for (const op of findJsxOpeners(file.text, tag)) {
            if (!getAttr(op, 'alt')) {
              out.push({ file: file.rel, line: lineOf(file.text, op.index), hint: `<${tag}>` });
            }
          }
        }
      }
      return out;
    }),
    rule('img-alt-one-word', 'notice', 'Image alt is a single word', (p) => {
      const out = [];
      for (const file of p.files) {
        for (const tag of ['img', 'Image']) {
          for (const op of findJsxOpeners(file.text, tag)) {
            const alt = getAttr(op, 'alt');
            if (alt?.kind === 'string' && alt.value.trim().length > 0 && alt.value.trim().split(/\s+/).length === 1) {
              out.push({ file: file.rel, line: lineOf(file.text, op.index), hint: `alt="${alt.value}"` });
            }
          }
        }
      }
      return out;
    }),
    rule('favicon-missing', 'warning', 'Site has no favicon', (p) => {
      if (p.hasFavicon) return [];
      return [{ file: 'public/', hint: 'No favicon.ico, app/icon.* or app/favicon.ico' }];
    }),
  ];
}

export const contentRelevance = [
  ...defineMeta(),
  ...defineHeadings(),
  ...defineImages(),
];

function rule(id, severity, title, check) {
  return { id, severity, title, category: CAT, check };
}

function forEachPage(project, fn) {
  const out = [];
  for (const file of project.pages) {
    const meta = extractMetadata(file.text);
    const r = fn(file, meta);
    if (r) out.push(r);
  }
  return out;
}
function staticTitle(meta) {
  if (!meta || meta.kind !== 'static') return null;
  const stripped = meta.body.replace(/openGraph[\s\S]*$/, '').replace(/twitter[\s\S]*$/, '');
  return findStringFieldDeep(stripped, 'title');
}
function staticString(meta, key) {
  if (!meta || meta.kind !== 'static') return null;
  return findStringFieldDeep(meta.body, key);
}
function countH1(text) {
  return (text.match(/<h1[\s>]/g) || []).length;
}
function stripJsx(s) { return s.replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, ''); }
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function pageReferencesComponent(text) {
  // Crude: if page renders a custom <Hero>/<Header>/etc, h1 may live there.
  return /<\s*[A-Z][A-Za-z0-9_]*/.test(text);
}
