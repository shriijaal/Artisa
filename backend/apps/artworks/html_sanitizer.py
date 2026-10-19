import nh3

ALLOWED_TAGS = {
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'span', 'div',
}

ALLOWED_CLASSES = {
    'artisa-spoiler',
    'rtv-link',
    'is-revealed',
}

_URL_SCHEMES = {'http', 'https', 'mailto', 'tel'}


def _attributes():
    per_tag = {
        'a': {'href', 'target', 'class'},
        'p': {'style', 'align', 'class'},
        'h1': {'style', 'align', 'class'},
        'h2': {'style', 'align', 'class'},
        'h3': {'style', 'align', 'class'},
        'div': {'style', 'align', 'class'},
        'span': {'class', 'data-spoiler', 'style'},
        'code': {'class'},
        'pre': {'class'},
        'ul': {'class'},
        'ol': {'class'},
        'li': {'class'},
        'blockquote': {'class'},
    }
    return per_tag


def _attribute_filter(tag, attribute, value):
    attr = (attribute or '').lower()
    if attr == 'href':
        v = (value or '').strip()
        if v.lower().startswith(('javascript:', 'data:', 'vbscript:')):
            return None
        return v
    if attr == 'class':
        allowed = [c for c in (value or '').split() if c in ALLOWED_CLASSES]
        return ' '.join(allowed) if allowed else None
    if attr == 'data-spoiler':
        return 'true'
    if attr == 'style':
        parts = []
        for chunk in (value or '').split(';'):
            chunk = chunk.strip()
            if not chunk:
                continue
            lower = chunk.lower()
            if not lower.startswith('text-align:'):
                continue
            if any(bad in lower for bad in ('expression', 'javascript', 'url(')):
                continue
            parts.append(chunk)
        return ';'.join(parts) if parts else None
    if attr == 'align':
        v = (value or '').lower()
        return v if v in {'left', 'center', 'right', 'justify'} else None
    return value or None


def clean_rich_text(value):
    """Sanitize user-provided rich text HTML. Empty/None pass through."""
    if value is None:
        return value
    if not isinstance(value, str):
        value = str(value)
    if not value.strip():
        return ''
    cleaned = nh3.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=_attributes(),
        attribute_filter=_attribute_filter,
        url_schemes=_URL_SCHEMES,
        strip_comments=True,
        link_rel='noopener noreferrer nofollow',
        filter_style_properties={'text-align'},
    )
    return cleaned or ''


def strip_html(value, limit=None):
    """Strip all tags to plain text, collapsing whitespace. Optional truncation."""
    if value is None:
        return ''
    if not isinstance(value, str):
        value = str(value)
    if not value.strip():
        return ''
    text = nh3.clean(value, tags=set(), strip_comments=True)
    text = ' '.join(text.split())
    if limit is not None:
        text = text[:limit]
    return text
