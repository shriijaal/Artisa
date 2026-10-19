import { Mark, mergeAttributes } from '@tiptap/core';

const SpoilerMark = Mark.create({
  name: 'spoiler',

  addOptions() {
    return { HTMLAttributes: { class: 'artisa-spoiler' } };
  },

  parseHTML() {
    return [{ tag: 'span[data-spoiler]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-spoiler': 'true' }), 0];
  },

  addCommands() {
    return {
      toggleSpoiler:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-s': () => this.editor.commands.toggleSpoiler(),
    };
  },
});

export default SpoilerMark;
