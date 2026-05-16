// Mirrors the taxonomy in rules.txt
export const CATEGORIES = {
  links: { id: 'links', label: 'Links', desc: 'Internal/external links, anchors, status codes, rel attributes.' },
  indexability: { id: 'indexability', label: 'Indexability', desc: 'Crawling and indexing blockers (canonical, robots, head/body integrity).' },
  'content-relevance': { id: 'content-relevance', label: 'Content relevance', desc: 'Title/description/H1 quality, alt text, content tags.' },
  'duplicate-content': { id: 'duplicate-content', label: 'Duplicate content', desc: 'Duplicate titles, descriptions, H1s, alt text.' },
  security: { id: 'security', label: 'Security', desc: 'Security headers, HTTPS, cookies, defences.' },
  internal: { id: 'internal', label: 'Internal', desc: 'URL hygiene, broken assets, GTM presence.' },
  'page-speed': { id: 'page-speed', label: 'Page speed', desc: 'Image dimensions, lazy loading, modern formats.' },
  redirects: { id: 'redirects', label: 'Redirects', desc: 'Redirect chains, 3xx hygiene.' },
  'social-media': { id: 'social-media', label: 'Social media', desc: 'OpenGraph and Twitter cards.' },
  'code-validation': { id: 'code-validation', label: 'Code validation', desc: 'W3C compliance signals, doctype, structure.' },
  'search-traffic': { id: 'search-traffic', label: 'Search traffic', desc: 'Crawlability/indexability vs traffic.' },
  'mobile-friendly': { id: 'mobile-friendly', label: 'Mobile friendly', desc: 'Viewport, responsive markup.' },
  'xml-sitemaps': { id: 'xml-sitemaps', label: 'XML sitemaps', desc: 'Sitemap presence and robots reference.' },
  localization: { id: 'localization', label: 'Localization', desc: 'hreflang, html lang, x-default.' },
};

export const SEVERITY = {
  critical: { weight: 6, label: 'Critical' },
  warning:  { weight: 2, label: 'Warning'  },
  opportunity: { weight: 1, label: 'Opportunity' },
  notice:   { weight: 0.25, label: 'Notice'  },
};
