import { CATEGORIES, SEVERITY } from './categories.js';
import path from 'node:path';

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
  bgRed: '\x1b[41m', bgGreen: '\x1b[42m', bgYellow: '\x1b[43m',
};
const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (color, s) => supportsColor ? `${C[color] || ''}${s}${C.reset}` : s;
const SEV_COLOR = { critical: 'red', warning: 'yellow', opportunity: 'cyan', notice: 'gray' };
const SEV_GLYPH = { critical: '✗', warning: '!', opportunity: '○', notice: '·' };

export function renderJson(result, project, { findings }) {
  const byCategory = {};
  for (const f of findings) {
    if (!byCategory[f.category]) byCategory[f.category] = [];
    byCategory[f.category].push(f);
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

export function renderTextReport(result, project, { findings, rules }, args) {
  const lines = [];
  const w = 60;
  lines.push('');
  lines.push(c('bold', 'nextjs-seo-doctor') + c('gray', ` v0.1.0  —  ${project.root}`));
  lines.push(c('gray', `Framework: ${project.framework}  ·  ${project.pages.length} pages  ·  ${project.layouts.length} layouts  ·  ${project.files.length} source files`));
  lines.push('');

  // Score banner
  const scoreColor = result.color === 'green' ? 'green' : result.color === 'yellow' ? 'yellow' : 'red';
  lines.push(`  ${c('bold', 'Health Score')}   ${c(scoreColor, c('bold', `${result.score}/100`))}   ${c(scoreColor, result.label)}`);
  lines.push('');

  // severity counts
  const cnt = result.counts;
  lines.push(
    `  ${c('red',   `${SEV_GLYPH.critical} ${cnt.critical} critical`)}   ` +
    `${c('yellow',`${SEV_GLYPH.warning} ${cnt.warning} warnings`)}   ` +
    `${c('cyan',  `${SEV_GLYPH.opportunity} ${cnt.opportunity} opportunities`)}   ` +
    `${c('gray',  `${SEV_GLYPH.notice} ${cnt.notice} notices`)}`
  );
  lines.push('');

  // by category
  const byCat = new Map();
  for (const cat of Object.values(CATEGORIES)) byCat.set(cat.id, { cat, items: [] });
  for (const f of findings) byCat.get(f.category)?.items.push(f);

  for (const { cat, items } of byCat.values()) {
    if (args?.category && args.category !== cat.id) continue;
    if (items.length === 0 && args?.quiet) continue;

    lines.push(`${c('bold', cat.label.toLowerCase())}  ${c('gray', `(${items.length} ${items.length === 1 ? 'issue' : 'issues'})`)}`);
    lines.push(c('gray', `  ${cat.desc}`));

    if (items.length === 0) {
      lines.push('  ' + c('green', '✓') + c('gray', ' all checks passed'));
      lines.push('');
      continue;
    }

    // group by ruleId
    const byRule = new Map();
    for (const f of items) {
      if (!byRule.has(f.ruleId)) byRule.set(f.ruleId, []);
      byRule.get(f.ruleId).push(f);
    }

    // sort by severity weight desc
    const sortedRules = [...byRule.entries()].sort((a, b) => {
      const sa = SEVERITY[a[1][0].severity]?.weight ?? 0;
      const sb = SEVERITY[b[1][0].severity]?.weight ?? 0;
      return sb - sa;
    });

    for (const [ruleId, fs] of sortedRules) {
      const sev = fs[0].severity;
      const glyph = SEV_GLYPH[sev];
      const label = `[${SEVERITY[sev].label}]`;
      lines.push(`  ${c(SEV_COLOR[sev], glyph)} ${c(SEV_COLOR[sev], label)} ${c('bold', fs[0].title)} ${c('gray', `(${ruleId})`)}`);
      const max = 5;
      for (const f of fs.slice(0, max)) {
        const where = f.line ? `${f.file}:${f.line}` : f.file;
        const hint = f.hint ? c('gray', ` — ${f.hint}`) : '';
        lines.push(`      ${c('gray', '·')} ${where}${hint}`);
      }
      if (fs.length > max) lines.push(c('gray', `      … and ${fs.length - max} more`));
    }
    lines.push('');
  }

  lines.push(c('gray', `Scoring: 100 − Σ severity weights of unique fired rules.  Rules: ${result.firedRules}/${result.totalRules} fired.`));
  lines.push(c('gray', `Use --json for machine output, --score for the bare score, --category <id> to focus, --quiet to hide passing categories.`));
  return lines.join('\n');
}
