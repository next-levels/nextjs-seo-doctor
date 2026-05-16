import { contentRelevance } from './content-relevance.js';
import { indexability } from './indexability.js';
import { duplicateContent } from './duplicate-content.js';
import { links } from './links.js';
import { security } from './security.js';
import { internal } from './internal.js';
import { pageSpeed } from './page-speed.js';
import { redirects } from './redirects.js';
import { socialMedia } from './social-media.js';
import { codeValidation } from './code-validation.js';
import { mobileFriendly } from './mobile-friendly.js';
import { xmlSitemaps } from './xml-sitemaps.js';
import { localization } from './localization.js';

const RULES = [
  ...links,
  ...indexability,
  ...contentRelevance,
  ...duplicateContent,
  ...security,
  ...internal,
  ...pageSpeed,
  ...redirects,
  ...socialMedia,
  ...codeValidation,
  ...mobileFriendly,
  ...xmlSitemaps,
  ...localization,
];

export function runRules(project) {
  const findings = [];
  for (const rule of RULES) {
    const result = rule.check(project) || [];
    for (const f of result) {
      findings.push({
        ruleId: rule.id,
        category: rule.category,
        severity: rule.severity,
        title: rule.title,
        ...f,
      });
    }
    rule.lastRan = true;
  }
  return { findings, rules: RULES };
}

export { RULES };
