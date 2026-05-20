const ALLOWED_TAGS = new Set(['p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'a']);
const VOID_TAGS = new Set(['br']);
const ALLOWED_STYLES = new Set([
  'font-family',
  'font-size',
  'color',
  'background-color',
  'text-align',
  'font-weight',
  'font-style',
  'text-decoration',
]);
const SAFE_LINK_PATTERN = /^(https?:|mailto:|\/|\.\/|\.\.\/|#)/i;

export function sanitizeRichHtml(value: string): string {
  if (!value) return '';

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (raw, rawTag: string, rawAttributes: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return '';
      if (raw.startsWith('</')) return `</${tag}>`;
      if (VOID_TAGS.has(tag)) return `<${tag}>`;

      const attributes = sanitizeAttributes(tag, rawAttributes);
      return `<${tag}${attributes ? ` ${attributes}` : ''}>`;
    });
}

function sanitizeAttributes(tag: string, rawAttributes: string): string {
  const attributes: string[] = [];
  const style = readAttribute(rawAttributes, 'style');
  const safeStyle = style ? sanitizeStyle(style) : '';

  if (safeStyle) {
    attributes.push(`style="${escapeHtmlAttribute(safeStyle)}"`);
  }

  if (tag === 'a') {
    const href = readAttribute(rawAttributes, 'href');
    if (href && SAFE_LINK_PATTERN.test(href.trim())) {
      attributes.push(`href="${escapeHtmlAttribute(href.trim())}"`);
    }
  }

  return attributes.join(' ');
}

function sanitizeStyle(value: string): string {
  return value
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .flatMap(part => {
      const separator = part.indexOf(':');
      if (separator < 1) return [];
      const property = part.slice(0, separator).trim().toLowerCase();
      const rawValue = part.slice(separator + 1).trim();
      if (!ALLOWED_STYLES.has(property) || !isSafeStyleValue(rawValue)) return [];
      return `${property}: ${rawValue}`;
    })
    .join('; ');
}

function isSafeStyleValue(value: string): boolean {
  const normalized = value.toLowerCase();
  return !/[<>{}]/.test(value)
    && !normalized.includes('javascript:')
    && !normalized.includes('expression(')
    && !normalized.includes('url(');
}

function readAttribute(rawAttributes: string, name: string): string | undefined {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i');
  const match = rawAttributes.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
