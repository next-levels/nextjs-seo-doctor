// Lightweight, dependency-free helpers. Heuristic, not a full parser.

export function findJsxOpeners(text, tagName) {
  const out = [];
  // Match <Tag ... > or <Tag .../> (allows multiline). Captures opener text.
  const pattern = new RegExp(`<${escape(tagName)}(\\s[^<>]*?)?(/?)>`, 'gms');
  let m;
  while ((m = pattern.exec(text)) != null) {
    out.push({
      index: m.index,
      raw: m[0],
      attrsRaw: m[1] || '',
      selfClosing: m[2] === '/',
    });
  }
  return out;
}

export function getAttr(opener, name) {
  const a = opener.attrsRaw;
  // attr="value"
  let m = new RegExp(`\\b${escape(name)}\\s*=\\s*"([^"]*)"`).exec(a);
  if (m) return { value: m[1], kind: 'string' };
  m = new RegExp(`\\b${escape(name)}\\s*=\\s*'([^']*)'`).exec(a);
  if (m) return { value: m[1], kind: 'string' };
  m = new RegExp(`\\b${escape(name)}\\s*=\\s*\\{`).exec(a);
  if (m) {
    const after = a.slice(m.index + m[0].length);
    const expr = readBraceExpr(after);
    return { value: expr, kind: 'expr' };
  }
  if (new RegExp(`\\b${escape(name)}(\\s|$|/)`).test(a)) return { value: true, kind: 'flag' };
  return null;
}

function readBraceExpr(s) {
  let depth = 1; let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return out; }
    out += c;
  }
  return out;
}

export function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === '\n') line++;
  return line;
}

export function countOccurrences(text, re) {
  return (text.match(re) || []).length;
}

export function findStringFieldDeep(objText, key) {
  // Look for `key:` followed by a string literal (handles nested objects roughly).
  const re = new RegExp(`\\b${escape(key)}\\s*:\\s*(['\"\`])([\\s\\S]*?)\\1`, 'm');
  const m = re.exec(objText);
  return m ? m[2] : null;
}

export function hasField(objText, key) {
  return new RegExp(`\\b${escape(key)}\\s*:`).test(objText);
}

export function extractObjectLiteralAfter(text, anchorRegex) {
  const m = anchorRegex.exec(text);
  if (!m) return null;
  const start = text.indexOf('{', m.index + m[0].length);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

export function extractMetadata(text) {
  // Try: export const metadata: Metadata = { ... }
  let lit = extractObjectLiteralAfter(text, /export\s+const\s+metadata\b[^=]*=/);
  if (lit) return { kind: 'static', body: lit };
  // Try: export const metadata = { ... }
  lit = extractObjectLiteralAfter(text, /export\s+const\s+metadata\s*=/);
  if (lit) return { kind: 'static', body: lit };
  if (/export\s+(async\s+)?function\s+generateMetadata\b/.test(text)) {
    return { kind: 'dynamic', body: text };
  }
  if (/export\s+const\s+generateMetadata\s*=/.test(text)) {
    return { kind: 'dynamic', body: text };
  }
  return null;
}

export function extractViewport(text) {
  let lit = extractObjectLiteralAfter(text, /export\s+const\s+viewport\b[^=]*=/);
  if (lit) return lit;
  if (/export\s+(async\s+)?function\s+generateViewport\b/.test(text)) return text;
  return null;
}

function escape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
