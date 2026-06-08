import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Underline,
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="ch-rte-wrapper">
      <div className="ch-rte-toolbar">
        <button
          type="button"
          className={`ch-rte-btn${editor.isActive("heading", { level: 2 }) ? " ch-rte-btn--active" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          className={`ch-rte-btn${editor.isActive("heading", { level: 3 }) ? " ch-rte-btn--active" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </button>
        <span className="ch-rte-sep" />
        <button
          type="button"
          className={`ch-rte-btn${editor.isActive("bold") ? " ch-rte-btn--active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          className={`ch-rte-btn${editor.isActive("italic") ? " ch-rte-btn--active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`ch-rte-btn${editor.isActive("underline") ? " ch-rte-btn--active" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <u>U</u>
        </button>
        <span className="ch-rte-sep" />
        <button
          type="button"
          className={`ch-rte-btn${editor.isActive("bulletList") ? " ch-rte-btn--active" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          className={`ch-rte-btn${editor.isActive("orderedList") ? " ch-rte-btn--active" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1.
        </button>
        <button
          type="button"
          className={`ch-rte-btn${editor.isActive("blockquote") ? " ch-rte-btn--active" : ""}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Block Quote"
        >
          "
        </button>
        <button
          type="button"
          className="ch-rte-btn"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Divider"
        >
          ―
        </button>
        <span className="ch-rte-sep" />
        <button
          type="button"
          className={`ch-rte-btn${editor.isActive("link") ? " ch-rte-btn--active" : ""}`}
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run()
              return
            }
            const url = window.prompt("Enter URL:")
            if (url) {
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
            }
          }}
          title="Link"
        >
          🔗
        </button>
      </div>
      <EditorContent editor={editor} className="ch-rte-content" />
    </div>
  )
}
