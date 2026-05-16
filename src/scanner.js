import fs from 'node:fs';
import path from 'node:path';

const IGNORE_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', 'out', 'coverage',
  '.turbo', '.cache', '.vercel', '.svelte-kit', '.parcel-cache',
  'docs', 'scripts', 'tests', '__tests__', 'test', 'storybook-static',
  'public', 'messages',
]);

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mdx']);

export async function collectProject(root) {
  const stat = await fs.promises.stat(root).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${root}`);
  }
  const project = {
    root,
    files: [],
    pkg: readJsonSafe(path.join(root, 'package.json')),
    framework: null,
    appDir: null,
    pagesDir: null,
    publicDir: null,
    nextConfig: null,
    hasRobotsTxt: false,
    hasSitemap: false,
    hasFavicon: false,
    hasRobotsTs: false,
    hasSitemapTs: false,
    layouts: [],
    pages: [],
    routes: [],
  };

  detectFramework(project);
  walk(root, root, project);
  classifyFiles(project);

  for (const f of project.files) {
    f.text = readTextSafe(f.absPath);
  }
  for (const dirCandidate of ['public']) {
    const p = path.join(root, dirCandidate);
    if (fs.existsSync(p)) project.publicDir = p;
  }
  if (project.publicDir) {
    project.hasFavicon = ['favicon.ico', 'favicon.png', 'favicon.svg'].some((n) =>
      fs.existsSync(path.join(project.publicDir, n))
    );
    project.hasRobotsTxt = fs.existsSync(path.join(project.publicDir, 'robots.txt'));
    project.hasSitemap = ['sitemap.xml', 'sitemap-index.xml'].some((n) =>
      fs.existsSync(path.join(project.publicDir, n))
    );
  }
  for (const f of project.files) {
    const rel = path.relative(root, f.absPath);
    if (/(^|\/)app\/.*robots\.(ts|js|tsx|jsx)$/.test(rel)) project.hasRobotsTs = true;
    if (/(^|\/)app\/.*sitemap\.(ts|js|tsx|jsx)$/.test(rel)) project.hasSitemapTs = true;
    if (/(^|\/)app\/.*sitemap\.xml(\/|$)/.test(rel)) project.hasSitemap = true;
  }
  // app/icon.tsx etc count as favicon in Next.js
  for (const f of project.files) {
    const rel = path.relative(root, f.absPath);
    if (/(^|\/)app\/(favicon|icon|apple-icon)\.(ico|png|svg|tsx|ts|js)$/.test(rel)) {
      project.hasFavicon = true;
    }
  }
  return project;
}

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}
function readTextSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function detectFramework(project) {
  const deps = { ...(project.pkg?.dependencies || {}), ...(project.pkg?.devDependencies || {}) };
  if (deps.next) project.framework = 'next';
  else if (deps['react-scripts']) project.framework = 'cra';
  else if (deps.vite) project.framework = 'vite';
  else if (fs.existsSync(path.join(project.root, 'next.config.js')) || fs.existsSync(path.join(project.root, 'next.config.ts'))) {
    project.framework = 'next';
  } else {
    project.framework = 'unknown';
  }
}

function walk(root, dir, project) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const ent of entries) {
    if (IGNORE_DIRS.has(ent.name)) continue;
    if (ent.name.startsWith('.') && ent.name !== '.well-known') continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(root, abs, project);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (SOURCE_EXT.has(ext)) {
        project.files.push({ absPath: abs, ext });
      }
    }
  }
}

function classifyFiles(project) {
  const root = project.root;
  for (const f of project.files) {
    const rel = path.relative(root, f.absPath).replace(/\\/g, '/');
    f.rel = rel;
    f.isAppDir = /(^|\/)app\//.test(rel) || /(^|\/)src\/app\//.test(rel);
    f.isPagesDir = /(^|\/)pages\//.test(rel) || /(^|\/)src\/pages\//.test(rel);
    const base = path.basename(rel);
    f.isLayout = /^layout\.(t|j)sx?$/.test(base) && f.isAppDir;
    f.isPage = (/^page\.(t|j)sx?$/.test(base) && f.isAppDir) || (f.isPagesDir && !base.startsWith('_') && /\.(t|j)sx?$/.test(base));
    if (f.isLayout) project.layouts.push(f);
    if (f.isPage) project.pages.push(f);
  }
  if (project.pages.length || project.layouts.length) {
    project.appDir = project.layouts[0] ? path.dirname(project.layouts[0].absPath) : null;
  }
}
