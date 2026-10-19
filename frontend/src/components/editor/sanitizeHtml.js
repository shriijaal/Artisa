import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'span',
  'div',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'data-spoiler',
  'style', 'align',
];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
    const href = node.getAttribute('href') || '';
    if (/^\s*javascript:/i.test(href)) {
      node.removeAttribute('href');
    }
  }
  if (node.hasAttribute && node.hasAttribute('style')) {
    const style = node.getAttribute('style') || '';
    const safe = style
      .split(';')
      .map((s) => s.trim())
      .filter((s) => /^(text-align|color)\s*:/i.test(s) && !/expression|javascript|url\s*\(/i.test(s))
      .join('; ');
    if (safe) node.setAttribute('style', safe);
    else node.removeAttribute('style');
  }
});

export function sanitizeHtml(html) {
  if (!html) return '';
  if (typeof html !== 'string') return '';
  const hasTag = /<[a-z][\s\S]*>/i.test(html);
  if (!hasTag) {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
  });
}

export default sanitizeHtml;
