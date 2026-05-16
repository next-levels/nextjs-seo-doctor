import { SEVERITY } from './categories.js';

export function score({ findings, rules }) {
  const uniqueRules = new Map();
  for (const f of findings) {
    if (!uniqueRules.has(f.ruleId)) uniqueRules.set(f.ruleId, f);
  }
  let penalty = 0;
  for (const f of uniqueRules.values()) {
    penalty += SEVERITY[f.severity]?.weight ?? 1;
  }
  const raw = 100 - penalty;
  const value = Math.max(0, Math.min(100, Math.round(raw)));
  let label, color;
  if (value >= 75) { label = 'Great'; color = 'green'; }
  else if (value >= 50) { label = 'Needs work'; color = 'yellow'; }
  else { label = 'Critical'; color = 'red'; }

  // counts by severity
  const counts = { critical: 0, warning: 0, opportunity: 0, notice: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;

  return { score: value, label, color, counts, totalRules: rules.length, firedRules: uniqueRules.size };
}
