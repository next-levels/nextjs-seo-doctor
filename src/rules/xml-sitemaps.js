const CAT = 'xml-sitemaps';

export const xmlSitemaps = [
  rule('sitemap-missing', 'critical', 'No sitemap detected', (p) => {
    if (p.hasSitemap || p.hasSitemapTs) return [];
    return [{ file: '(site)', hint: 'No public/sitemap.xml and no app/sitemap.(ts|js)' }];
  }),
  rule('robots-missing', 'warning', 'No robots configuration detected', (p) => {
    if (p.hasRobotsTxt || p.hasRobotsTs) return [];
    return [{ file: '(site)', hint: 'No public/robots.txt and no app/robots.(ts|js)' }];
  }),
];

function rule(id, severity, title, check) { return { id, severity, title, category: CAT, check }; }
