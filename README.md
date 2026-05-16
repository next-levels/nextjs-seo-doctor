# nextjs-seo-doctor

> Static SEO analyzer for Next.js codebases. Scans your repo and outputs a
> **0–100 health score** with actionable diagnostics, in the spirit of
> [`react-doctor`](https://github.com/millionco/react-doctor).

No crawling. No headless browser. No network. Reads source files, parses
Next.js metadata, JSX attributes, `next.config.*` and `middleware.*`, then
applies a rule set that mirrors the SEO taxonomy in
[`rules.txt`](./rules.txt).

Designed to run in `npx`, in CI, or as a pre-commit gate.

---

## Use

```bash
# Audit current directory
npx -y nextjs-seo-doctor@latest .

# Audit another project
npx -y nextjs-seo-doctor@latest /path/to/your/next-app

# CI gate
npx -y nextjs-seo-doctor@latest . --threshold 80
```

### Example output

```
nextjs-seo-doctor v0.1.0  —  /path/to/your-next-app
Framework: next  ·  52 pages  ·  34 layouts  ·  328 source files

  Health Score   91/100   Great

  ✗ 1 critical   ! 33 warnings   ○ 0 opportunities   · 94 notices

indexability  (33 issues)
  ! [Warning] Page does not declare its own metadata (metadata-missing)
      · src/app/[locale]/(main)/agentur/page.tsx — page inherits from layout title.template only
      … and 28 more

security  (43 issues)
  · [Notice] No Content-Security-Policy header configured (csp-missing)
  · [Notice] No X-Frame-Options / frame-ancestors configured (xfo-missing)
  …

mobile friendly  (1 issue)
  ✗ [Critical] No viewport meta configured (viewport-missing)
      · (site) — No `export const viewport` and no <meta name="viewport"> in layouts
```

### Flags

| Flag                 | Effect                                                |
| -------------------- | ----------------------------------------------------- |
| `--json`             | Emit machine-readable JSON                            |
| `--score`            | Emit only the numeric score (good for CI gates)       |
| `--threshold <n>`    | Exit 1 if score `< n`                                 |
| `--category <id>`    | Limit report to one taxonomy category                 |
| `--quiet`            | Hide categories with no findings                      |
| `-h`, `--help`       | Show help                                             |
| `-v`, `--version`    | Show version                                          |

---

## Categories

The 14 categories match `rules.txt`:

| ID                   | What it covers                                              |
| -------------------- | ----------------------------------------------------------- |
| `links`              | Empty href, `target="_blank"` without `rel="noopener"`, whitespace in href |
| `indexability`       | Missing metadata, canonical URL, `<html lang>`, robots, charset |
| `content-relevance`  | Title/description length, lowercase title, H1 count, image alt text, favicon |
| `duplicate-content`  | Duplicate page titles, duplicate descriptions, reused alt text |
| `security`           | Insecure http:// links, CSP, X-Frame-Options, nosniff, XSS  |
| `internal`           | Missing GTM/GA, hardcoded localhost links                   |
| `page-speed`         | `<Image>` missing `width`/`height`/`fill`, `<img>` without `loading`, legacy formats |
| `redirects`          | `<meta http-equiv="refresh">`, large static redirect tables |
| `social-media`       | Missing OpenGraph, missing OG image, missing Twitter card   |
| `code-validation`    | Inline style overuse, `<table>` without `<caption>`, heading hierarchy skips |
| `search-traffic`     | Reserved — crawl-time signals only                          |
| `mobile-friendly`    | Missing `viewport` export                                   |
| `xml-sitemaps`       | Missing `app/sitemap.ts` or `public/sitemap.xml`, missing robots config |
| `localization`       | i18n project without `alternates.languages`, missing `x-default`, hardcoded `<html lang>` |

Rules that depend on real crawl data (broken external links, render-time
text-to-code ratio, live PageSpeed Insights) are intentionally out of scope.
This tool ships the statically checkable subset.

---

## Scoring

`score = 100 − Σ(weight)` over **unique fired rules**:

| Severity     | Weight |
| ------------ | -----: |
| critical     |    6   |
| warning      |    2   |
| opportunity  |    1   |
| notice       |  0.25  |

Bands:

* **75 – 100** Great
* **50 – 74** Needs work
* **0 – 49** Critical

Counting unique rules, not unique findings, prevents one repeated mistake
(e.g. 100 `<img>` tags without `alt`) from sinking the score below what a
single fix would restore.

---

## How it works

1. Walks the project, skipping `node_modules`, `.next`, `dist`, `build`,
   `out`, `coverage`, `docs`, `scripts`, `tests`, `public`, `messages`.
2. Detects framework (`next`, `vite`, `cra`, `unknown`) from
   `package.json` + config files.
3. Classifies App Router `layout.*` and `page.*` files; also reads
   `next.config.*`, `middleware.*`, `vercel.json`.
4. Parses `metadata` / `generateMetadata` / `viewport` exports
   (regex-based, dependency-free — heuristic but solid for SEO signals).
5. Runs every rule, groups findings by category + severity, scores them.

No dependencies. Pure Node ≥ 18.

---

## CI example

GitHub Actions:

```yaml
- name: SEO health check
  run: npx -y nextjs-seo-doctor@latest . --threshold 80
```

Or as a custom job that posts the score:

```yaml
- name: SEO score
  run: |
    score=$(npx -y nextjs-seo-doctor@latest . --score)
    echo "SEO_SCORE=$score" >> $GITHUB_ENV
```

---

## Project layout

```
bin/cli.js               CLI entry
src/index.js             arg parser, orchestration
src/scanner.js           file walk + framework detection
src/parse-helpers.js     metadata + JSX heuristics
src/categories.js        taxonomy + severity weights
src/score.js             scoring
src/reporter.js          text + JSON renderers
src/rules/*.js           one file per category
rules.txt                source taxonomy
```

---

## License

MIT © [next-levels](https://github.com/next-levels)
