// description = what the issue means (one sentence)
// fix         = how to fix it, with code snippet in backticks
export const RULE_META = {
  // links
  'empty-href': {
    description: 'Anchor has empty or placeholder href — search engines treat it as a non-link.',
    fix: 'Set a real URL: `<a href="/about">…</a>` or use a `<button>` if it triggers an action.',
  },
  'blank-no-rel': {
    description: 'External link with target="_blank" opens a tabnabbing vector and leaks referrer.',
    fix: 'Add `rel="noopener noreferrer"` to every `target="_blank"` link.',
  },
  'whitespace-href': {
    description: 'href contains leading/trailing whitespace — some crawlers follow it as a broken link.',
    fix: 'Trim the value: `href={url.trim()}`.',
  },

  // indexability
  'metadata-missing': {
    description: 'Page does not declare its own metadata or generateMetadata.',
    fix: 'Add `export const metadata = { title: "…", description: "…" }` or `export async function generateMetadata()`.',
  },
  'canonical-missing': {
    description: 'No canonical URL set anywhere — duplicate-content risk on parameterised URLs.',
    fix: 'Add `alternates: { canonical: "https://your.site/path" }` to metadata (or use a `buildAlternates` helper).',
  },
  'canonical-relative': {
    description: 'Canonical URL is relative — Google may resolve it to the wrong origin.',
    fix: 'Use an absolute URL: `canonical: "https://your.site/path"`.',
  },
  'html-lang-missing': {
    description: '<html> tag has no lang attribute — hurts accessibility and locale signals.',
    fix: 'Set the lang attribute in the root layout: `<html lang={locale}>`.',
  },
  'robots-noindex': {
    description: 'Page declares noindex — verify this is intentional.',
    fix: 'Remove `robots: { index: false }` from metadata if the page should be indexed.',
  },
  'charset-missing': {
    description: 'Custom <head> without a charSet declaration.',
    fix: 'Add `<meta charSet="utf-8" />` to your custom <head>.',
  },

  // content-relevance
  'title-missing': {
    description: 'metadata exported without a title field — Google falls back to the URL slug.',
    fix: 'Add `title: "…"` to metadata, or `title: { default, template }` for templates.',
  },
  'title-too-short': {
    description: 'Title is shorter than 25 chars — wastes SERP real estate.',
    fix: 'Aim for 30–60 chars including a primary keyword and brand.',
  },
  'title-too-long': {
    description: 'Title exceeds 60 chars — Google truncates with an ellipsis.',
    fix: 'Trim to ≤ 60 chars; lead with the most important phrase.',
  },
  'title-lowercase': {
    description: 'Title starts with a lowercase letter — looks unprofessional in SERPs.',
    fix: 'Capitalise the first word.',
  },
  'description-missing': {
    description: 'metadata exported without a description — Google synthesises one from the page.',
    fix: 'Add `description: "…"` to metadata.',
  },
  'description-too-short': {
    description: 'Description shorter than 70 chars — under-utilises snippet space.',
    fix: 'Expand to 120–160 chars with the page intent and call-to-action.',
  },
  'description-too-long': {
    description: 'Description over 160 chars — truncated in SERPs.',
    fix: 'Compress to ≤ 160 chars; put the key value proposition first.',
  },
  'h1-missing-site': {
    description: 'No <h1> in any source file — the dominant heading signal is missing.',
    fix: 'Ensure every page renders exactly one `<h1>` describing its primary topic.',
  },
  'h1-multiple': {
    description: 'Multiple <h1> tags in one file — Google may pick the wrong one.',
    fix: 'Keep a single `<h1>`; demote the others to `<h2>`/`<h3>`.',
  },
  'h1-too-long': {
    description: 'H1 longer than 70 chars — reads as a paragraph, not a heading.',
    fix: 'Tighten to a clear headline ≤ 70 chars.',
  },
  'img-alt-missing': {
    description: 'Image without alt attribute — invisible to screen readers and image search.',
    fix: 'Add a descriptive `alt="…"`. For decorative images use `alt=""`.',
  },
  'img-alt-one-word': {
    description: 'alt text is a single word — too thin to be useful.',
    fix: 'Describe the subject in context: `alt="Team standing in front of Berlin office"`.',
  },
  'favicon-missing': {
    description: 'No favicon detected.',
    fix: 'Add `public/favicon.ico` or `app/icon.tsx`.',
  },

  // duplicate-content
  'duplicate-title': {
    description: 'Multiple pages share the same title — they compete in SERPs.',
    fix: 'Make every page title unique. Use `title: { default, template }` to vary suffixes.',
  },
  'duplicate-description': {
    description: 'Multiple pages share the same meta description.',
    fix: 'Write a unique description per page that summarises its intent.',
  },
  'duplicate-alt': {
    description: 'Same alt text repeated across many images.',
    fix: 'Describe each image individually instead of reusing a generic label.',
  },

  // security
  'http-link-w3': {
    description: 'Inline SVGs reference `http://www.w3.org/2000/svg` — fine for the XML namespace, flagged for parity with rules.txt.',
    fix: 'Cosmetic only; rules.txt counts it. Safe to ignore unless aiming for 100/100.',
  },
  'http-link-other': {
    description: 'href/src points to insecure http:// resource — triggers mixed-content blocks.',
    fix: 'Switch to https:// or use a protocol-relative URL.',
  },
  'csp-missing': {
    description: 'No Content-Security-Policy header configured.',
    fix: 'Add a `headers()` entry in next.config that returns a CSP for `/(.*)`.',
  },
  'xfo-missing': {
    description: 'No X-Frame-Options / frame-ancestors header — clickjacking risk.',
    fix: 'Add `X-Frame-Options: SAMEORIGIN` (or CSP `frame-ancestors`) via next.config headers().',
  },
  'nosniff-missing': {
    description: 'No X-Content-Type-Options header — MIME-sniffing risk.',
    fix: 'Add `X-Content-Type-Options: nosniff` via next.config headers().',
  },
  'xss-missing': {
    description: 'No XSS-mitigation header / strict CSP configured.',
    fix: 'Ship a CSP with `script-src \'self\'` (and nonce / hashes for inline scripts).',
  },

  // internal
  'gtm-missing': {
    description: 'No Google Tag Manager / GA snippet detected.',
    fix: 'Add `@next/third-parties/google` or a GTM container if analytics is required.',
  },
  'localhost-link': {
    description: 'Hardcoded localhost/127.0.0.1 URL — will ship to production.',
    fix: 'Replace with an env-driven URL: `process.env.NEXT_PUBLIC_API_URL`.',
  },

  // page-speed
  'image-no-dimensions': {
    description: '<Image> without width/height/fill — causes layout shift and disables optimisation.',
    fix: 'Pass `width` + `height`, or `fill` with a positioned parent.',
  },
  'img-no-loading': {
    description: 'Raw <img> without loading="lazy" — blocks the main thread above the fold.',
    fix: 'Prefer `next/image`. If you must use `<img>`, add `loading="lazy"`.',
  },
  'img-not-modern': {
    description: 'Asset uses legacy .jpg/.png instead of WebP/AVIF.',
    fix: 'Serve `.webp` or `.avif` (next/image converts automatically when used).',
  },

  // redirects
  'meta-refresh': {
    description: '<meta http-equiv="refresh"> is a hard redirect that breaks crawlers.',
    fix: 'Use a server redirect: `redirects()` in next.config or `redirect()` from `next/navigation`.',
  },
  'redirects-large': {
    description: 'Many static redirects — audit for chains and loops.',
    fix: 'Consolidate to a single hop per destination; remove dead entries.',
  },

  // social-media
  'og-missing': {
    description: 'No OpenGraph metadata — link previews fall back to URL + title only.',
    fix: 'Add `openGraph: { title, description, images: [{ url, width, height }] }` to metadata.',
  },
  'og-image-missing': {
    description: 'openGraph configured without images — previews look empty on Facebook/LinkedIn.',
    fix: 'Add `openGraph.images: [{ url: "/og.png", width: 1200, height: 630 }]`.',
  },
  'twitter-missing': {
    description: 'No Twitter card metadata configured.',
    fix: 'Add `twitter: { card: "summary_large_image", title, description, images }`.',
  },

  // code-validation
  'inline-style-overuse': {
    description: 'Many inline `style={{}}` attributes — hurts maintainability and CSP.',
    fix: 'Move repeated styles to Tailwind classes, CSS modules, or component variants.',
  },
  'table-no-caption': {
    description: '<table> without <caption> — fails WCAG and screen-reader accessibility.',
    fix: 'Add `<caption>` describing what the table contains.',
  },
  'headings-skip': {
    description: 'Heading hierarchy skips a level (e.g. h2 → h4).',
    fix: 'Use heading levels sequentially: h1 → h2 → h3.',
  },

  // mobile-friendly
  'viewport-missing': {
    description: 'No viewport meta — page renders unscaled on mobile devices.',
    fix: 'Add `export const viewport = { width: "device-width", initialScale: 1 }` in your root layout.',
  },

  // xml-sitemaps
  'sitemap-missing': {
    description: 'No sitemap detected — search engines must guess your URLs.',
    fix: 'Add `app/sitemap.ts` (returns `MetadataRoute.Sitemap`) or `public/sitemap.xml`.',
  },
  'robots-missing': {
    description: 'No robots config detected.',
    fix: 'Add `app/robots.ts` (returns `MetadataRoute.Robots`) or `public/robots.txt`.',
  },

  // localization
  'hreflang-missing': {
    description: 'i18n project without `alternates.languages` — Google can\'t map locales to URLs.',
    fix: 'In metadata: `alternates: { canonical, languages: { en: "…", de: "…", "x-default": "…" } }`.',
  },
  'xdefault-missing': {
    description: 'hreflang group missing `x-default` — no fallback for unmatched locales.',
    fix: 'Add `"x-default": "https://your.site/"` to `alternates.languages`.',
  },
  'html-lang-static': {
    description: 'Hardcoded `<html lang>` in an i18n project — wrong locale signalled to non-default users.',
    fix: 'Pass the active locale: `<html lang={params.locale}>`.',
  },
};
