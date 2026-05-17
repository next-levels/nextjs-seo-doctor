import { CATEGORIES, SEVERITY } from './categories.js';
import { RULE_META } from './rule-meta.js';

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', italic: '\x1b[3m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
  magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', gray: '\x1b[90m',
  brightYellow: '\x1b[93m', brightRed: '\x1b[91m', brightGreen: '\x1b[92m',
};
const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (style, s) => supportsColor ? `${C[style] || ''}${s}${C.reset}` : s;
const wrap = (styles, s) => supportsColor ? styles.map(st => C[st] || '').join('') + s + C.reset : s;

const SEV_GLYPH = { critical: '✗', warning: '⚠', opportunity: '○', notice: '·' };
const SEV_COLOR = { critical: 'brightRed', warning: 'brightYellow', opportunity: 'cyan', notice: 'gray' };

const MAX_ITEMS_PER_RULE = 1;
const MAX_RULES_PER_CATEGORY = 4;

export function renderJson(result, project, { findings }) {
  const byCategory = {};
  for (const f of findings) {
    (byCategory[f.category] ||= []).push(f);
  }
  return JSON.stringify({
    score: result.score,
    label: result.label,
    counts: result.counts,
    project: {
      root: project.root,
      framework: project.framework,
      pages: project.pages.length,
      layouts: project.layouts.length,
      files: project.files.length,
    },
    findings,
    byCategory,
  }, null, 2);
}

export function renderTextReport(result, project, { findings }, args) {
  const lines = [];
  lines.push('');
  lines.push('  ' + c('bold', 'nextjs-seo-doctor') + c('gray', `  v0.2.0  ·  ${project.root}`));
  lines.push('  ' + c('gray', `${project.framework}  ·  ${project.pages.length} pages  ·  ${project.layouts.length} layouts  ·  ${project.files.length} files`));
  lines.push('');

  const byCat = new Map();
  for (const cat of Object.values(CATEGORIES)) byCat.set(cat.id, { cat, items: [] });
  for (const f of findings) byCat.get(f.category)?.items.push(f);

  let hiddenWarnings = 0;

  for (const { cat, items } of byCat.values()) {
    if (args?.category && args.category !== cat.id) continue;
    if (items.length === 0) continue;

    const header = `${c('bold', cat.label)} ${c('gray', `${items.length} ${items.length === 1 ? 'issue' : 'issues'}`)}`;
    lines.push(header);

    // group by ruleId
    const byRule = new Map();
    for (const f of items) {
      if (!byRule.has(f.ruleId)) byRule.set(f.ruleId, []);
      byRule.get(f.ruleId).push(f);
    }

    const sortedRules = [...byRule.entries()].sort((a, b) => {
      const sa = SEVERITY[a[1][0].severity]?.weight ?? 0;
      const sb = SEVERITY[b[1][0].severity]?.weight ?? 0;
      return sb - sa;
    });

    const shown = sortedRules.slice(0, MAX_RULES_PER_CATEGORY);
    const hidden = sortedRules.slice(MAX_RULES_PER_CATEGORY);

    for (const [ruleId, fs] of shown) {
      const sev = fs[0].severity;
      const glyph = c(SEV_COLOR[sev], SEV_GLYPH[sev]);
      const name = c('bold', fs[0].title);
      const count = fs.length > 1 ? c('gray', ` ×${fs.length}`) : '';
      lines.push(`    ${glyph} ${name}${count}`);

      const meta = RULE_META[ruleId];
      if (meta?.description) lines.push(`      ${c('gray', meta.description)}`);
      if (meta?.fix) lines.push(`      ${c('gray', meta.fix)}`);

      for (const f of fs.slice(0, MAX_ITEMS_PER_RULE)) {
        const where = f.line ? `${f.file}:${f.line}` : f.file;
        lines.push(`      ${c('gray', where)}`);
      }
    }

    for (const [, fs] of hidden) hiddenWarnings += fs.length;
    lines.push('');
  }

  if (hiddenWarnings > 0) {
    const noun = hiddenWarnings === 1 ? 'issue' : 'issues';
    lines.push(`    ${c('brightYellow', '⚠')} ${c('bold', `${hiddenWarnings} more ${noun}`)}`);
    lines.push(`      ${c('gray', 'Run with `--json` or `--category <id>` for full details')}`);
    lines.push('');
  }

  // Score footer
  lines.push(renderScoreFooter(result));
  lines.push('');

  return lines.join('\n');
}

function renderScoreFooter(result) {
  const score = result.score;
  const label = result.label;
  const isGreat = label === 'Great';
  const isCritical = label === 'Critical';
  const barColor = isGreat ? 'brightGreen' : isCritical ? 'brightRed' : 'brightYellow';
  const eyeColor = barColor;

  // Score bar — 56 cells
  const width = 56;
  const filled = Math.round((score / 100) * width);
  const bar = c(barColor, '█'.repeat(filled)) + c('gray', '░'.repeat(width - filled));

  // Face emotion based on band
  let mouth;
  if (isGreat) mouth = '◡';
  else if (isCritical) mouth = '︵';
  else mouth = '—';

  const face = [
    '┌─────────┐',
    `│  ${c(eyeColor, '•')}   ${c(eyeColor, '•')}  │`,
    `│    ${c(eyeColor, mouth)}    │`,
    '└─────────┘',
  ];

  const scoreLine = `${c('bold', `${score}`)} ${c('gray', '/ 100')}  ${c(barColor, label)}`;
  const project = `${c('bold', 'next.js SEO Doctor')} ${c('gray', '(github.com/next-levels/nextjs-seo-doctor)')}`;

  const right = [
    '',
    `   ${scoreLine}`,
    `   ${bar}`,
    `   ${project}`,
  ];

  // join face + right side
  const out = [];
  for (let i = 0; i < face.length; i++) {
    out.push(`  ${face[i]}  ${right[i] || ''}`);
  }
  return out.join('\n');
}
