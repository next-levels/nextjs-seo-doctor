import path from 'node:path';
import { collectProject } from './scanner.js';
import { runRules } from './rules/index.js';
import { score } from './score.js';
import { renderTextReport, renderJson } from './reporter.js';

const HELP = `nextjs-seo-doctor — static SEO audit for Next.js codebases

Usage:
  npx -y nextjs-seo-doctor@latest [path] [options]

Options:
  --json            Emit JSON report to stdout
  --score           Emit only the numeric health score
  --threshold <n>   Exit code 1 if score < n (default: 0, no gate)
  --category <id>   Limit report to one category id
  --quiet           Hide passing checks
  -h, --help        Show this help
  -v, --version     Show version

Categories mirror the SEO rules taxonomy (rules.txt):
  links, indexability, content-relevance, duplicate-content, security,
  internal, page-speed, redirects, social-media, code-validation,
  search-traffic, mobile-friendly, xml-sitemaps, localization
`;

export async function run(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (args.version) {
    const pkg = await import('../package.json', { with: { type: 'json' } }).then((m) => m.default);
    process.stdout.write(`${pkg.version}\n`);
    return 0;
  }

  const root = path.resolve(args.path ?? '.');
  const project = await collectProject(root);
  const findings = runRules(project);
  const result = score(findings);

  if (args.score) {
    process.stdout.write(`${result.score}\n`);
  } else if (args.json) {
    process.stdout.write(renderJson(result, project, findings) + '\n');
  } else {
    process.stdout.write(renderTextReport(result, project, findings, args) + '\n');
  }

  if (args.threshold != null && result.score < args.threshold) return 1;
  return 0;
}

function parseArgs(argv) {
  const out = { path: null, json: false, score: false, threshold: null, category: null, quiet: false, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '-v' || a === '--version') out.version = true;
    else if (a === '--json') out.json = true;
    else if (a === '--score') out.score = true;
    else if (a === '--quiet') out.quiet = true;
    else if (a === '--threshold') out.threshold = Number(argv[++i]);
    else if (a === '--category') out.category = argv[++i];
    else if (!a.startsWith('-') && out.path == null) out.path = a;
  }
  return out;
}
