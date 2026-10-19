import { Extension, InputRule } from '@tiptap/core';

const MD_LINK = /\[([^[\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|tel:[^\s)]+)\)$/;

const normalizeHref = (url) => (/^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`);

const MarkdownLinkInput = Extension.create({
  name: 'markdownLinkInput',

  addInputRules() {
    return [
      new InputRule({
        find: (text) => {
          const match = MD_LINK.exec(text);
          if (!match) return null;
          const [, label, href] = match;
          if (!label.trim()) return null;
          return {
            index: match.index,
            text: match[0],
            replaceWith: label,
            data: { href: normalizeHref(href) },
          };
        },
        handler: ({ state, range, match }) => {
          const href = match.data?.href;
          const label = match[match.length - 1];
          if (!href || !label) return null;
          const full = match[0];
          const { tr } = state;
          const labelStart = range.from + full.indexOf(label);
          const labelEnd = labelStart + label.length;
          if (labelEnd < range.to) tr.delete(labelEnd, range.to);
          if (labelStart > range.from) tr.delete(range.from, labelStart);
          const markEnd = range.from + label.length;
          tr.addMark(range.from, markEnd, state.schema.marks.link.create({ href }));
          tr.removeStoredMark(state.schema.marks.link);
          tr.setMeta('preventAutolink', true);
          if (!tr.steps.length) return null;
          return undefined;
        },
      }),
    ];
  },
});

export default MarkdownLinkInput;
