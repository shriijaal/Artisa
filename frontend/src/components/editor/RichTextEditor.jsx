import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import SpoilerMark from './spoilerMark';
import MarkdownLinkInput from './markdownLinkInput';
import {
  NormalTextIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  QuoteIcon,
  CodeBlockIcon,
  SpoilerHideIcon,
  SpoilerShowIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  TextAlignJustifyIcon,
  UnorderedListIcon,
  OrderedListIcon,
  LinkEmbedIcon,
} from './editorIcons';

const ToolButton = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    aria-pressed={active || undefined}
    className={`h-7 min-w-7 px-1.5 rounded text-xs font-semibold transition-colors flex items-center justify-center shrink-0 ${
      active
        ? 'bg-[#9c4327] text-white'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
    } disabled:opacity-35 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const Divider = () => <span className="mx-0.5 h-5 w-px bg-stone-200 shrink-0" />;

const ALIGN_OPTIONS = [
  { value: 'left', title: 'Align left', Icon: TextAlignLeftIcon },
  { value: 'center', title: 'Align center', Icon: TextAlignCenterIcon },
  { value: 'right', title: 'Align right', Icon: TextAlignRightIcon },
  { value: 'justify', title: 'Justify', Icon: TextAlignJustifyIcon },
];

const HEADING_OPTIONS = [
  { level: null, title: 'Normal text', icon: true },
  { level: 1, label: 'H1', title: 'Heading 1' },
  { level: 2, label: 'H2', title: 'Heading 2' },
  { level: 3, label: 'H3', title: 'Heading 3' },
];

const RichTextEditor = ({ value = '', onChange, placeholder = 'Write a description...', id }) => {
  const lastEmitted = useRef(value);

  const setLink = useCallback((ed) => {
    if (!ed) return;
    if (ed.isActive('link')) {
      ed.chain().focus().unsetLink().run();
      return;
    }
    const sel = ed.state.selection;
    const from = sel.from;
    const to = sel.to;
    const empty = sel.empty;
    const previous = window.prompt('Link URL (https://…)', 'https://');
    if (previous === null) return;
    const url = previous.trim();
    if (!url || url === 'https://' || url === 'http://') return;
    const normalized = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
    let label = '';
    if (empty) {
      const defaultLabel = normalized.replace(/^https?:\/\//i, '').replace(/\/$/, '');
      const textInput = window.prompt('Link text (what readers see)', defaultLabel);
      if (textInput === null) return;
      label = textInput.trim() || defaultLabel;
    }
    ed.chain()
      .focus()
      .setTextSelection(empty ? from : { from, to })
      .command(({ tr, state }) => {
        const linkType = state.schema.marks.link;
        if (!linkType) return false;
        const { from: s, to: e, empty: isEmpty } = tr.selection;
        let start = s;
        let end = e;
        if (isEmpty) {
          tr.insertText(label, start);
          end = start + label.length;
        }
        if (end <= start) return false;
        tr.addMark(start, end, linkType.create({ href: normalized }));
        tr.removeStoredMark(linkType);
        tr.scrollIntoView();
        return true;
      })
      .run();
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        code: false,
        codeBlock: true,
        link: {
          openOnClick: false,
          autolink: true,
          markdownLinks: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank', class: 'rtv-link' },
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      SpoilerMark,
      MarkdownLinkInput,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rte prose-sm max-w-none focus:outline-none min-h-[140px] px-4 py-3 text-sm text-stone-800',
        id: id || undefined,
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.isEmpty ? '' : e.getHTML();
      lastEmitted.current = html;
      onChange?.(html);
    },
    onCreate: ({ editor: e }) => {
      const html = e.isEmpty ? '' : e.getHTML();
      lastEmitted.current = html;
      if ((value || '') !== html && (value || '') !== (e.isEmpty ? '' : e.getHTML())) {
        onChange?.(html);
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    if (value === (editor.isEmpty ? '' : editor.getHTML())) {
      lastEmitted.current = value;
      return;
    }
    lastEmitted.current = value;
    try {
      editor.commands.setContent(value || '', { emitUpdate: false });
    } catch {
      editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="min-h-[200px] px-4 py-3 text-sm text-stone-400">{placeholder}</div>
      </div>
    );
  }

  const setHeading = (level) => {
    if (level == null) {
      editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          const paragraph = state.schema.nodes.paragraph;
          if (!paragraph) return false;
          const { from, to } = tr.selection;
          tr.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'heading') {
              tr.setNodeMarkup(pos, paragraph, {});
            }
          });
          if (tr.selection.$from.parent.type.name === 'heading') {
            tr.setNodeMarkup(tr.selection.$from.before(), paragraph, {});
          }
          return true;
        })
        .unsetAllMarks()
        .setParagraph()
        .clearNodes()
        .run();
      return;
    }
    editor.chain().focus().toggleHeading({ level }).run();
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400">
      <div
        className="flex items-center gap-0.5 overflow-x-auto border-b border-stone-200 bg-stone-50/80 px-2 py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="toolbar"
        aria-label="Text formatting"
        onMouseDown={(e) => e.preventDefault()}
      >
        {HEADING_OPTIONS.map((h) => (
          <ToolButton
            key={h.level == null ? 'normal' : `h${h.level}`}
            title={h.title}
            active={h.level == null ? editor.isActive('paragraph') && !editor.isActive('heading') : editor.isActive('heading', { level: h.level })}
            onClick={() => setHeading(h.level)}
          >
            {h.icon ? <NormalTextIcon className="h-3 w-3" /> : h.label}
          </ToolButton>
        ))}

        <Divider />

        <ToolButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <StrikethroughIcon className="h-4 w-4" />
        </ToolButton>

        <Divider />

        <ToolButton
          title="Bulleted list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <UnorderedListIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <OrderedListIcon className="h-4 w-4" />
        </ToolButton>

        <Divider />

        {ALIGN_OPTIONS.map((a) => (
          <ToolButton
            key={a.value}
            title={a.title}
            active={editor.isActive({ textAlign: a.value })}
            onClick={() => editor.chain().focus().setTextAlign(a.value).run()}
          >
            <a.Icon className="h-4 w-4" />
          </ToolButton>
        ))}

        <Divider />

        <ToolButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <QuoteIcon className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <CodeBlockIcon className="h-4 w-4" />
        </ToolButton>

        <Divider />

        <ToolButton title="Insert link" active={editor.isActive('link')} onClick={() => setLink(editor)}>
          <LinkEmbedIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title={editor.isActive('spoiler') ? 'Remove spoiler' : 'Add spoiler'}
          active={editor.isActive('spoiler')}
          onClick={() => editor.chain().focus().toggleSpoiler().run()}
        >
          {editor.isActive('spoiler') ? (
            <SpoilerShowIcon className="h-4 w-4" />
          ) : (
            <SpoilerHideIcon className="h-4 w-4" />
          )}
        </ToolButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
