import { useEffect, useRef } from 'react';
import { sanitizeHtml } from './sanitizeHtml';

const RichTextView = ({ html, className = '' }) => {
  const rootRef = useRef(null);
  const clean = sanitizeHtml(html);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onClick = (e) => {
      const el = e.target.closest('.artisa-spoiler');
      if (el && root.contains(el)) {
        el.classList.toggle('is-revealed');
      }
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [clean]);

  if (!clean) return null;

  return (
    <div
      ref={rootRef}
      className={`rtv text-sm text-stone-700 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};

export default RichTextView;
