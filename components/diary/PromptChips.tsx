"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";

// The two anchored prompts from PRD §6.3, always visible above the editor.
export const DIARY_PROMPTS = ["What am I thinking today?", "What am I trying to do?"] as const;

type Section = { headingPos: number; endPos: number };

// Finds a top-level heading whose text is exactly `prompt` and returns the
// span of its section: from the heading to just before the next heading (or
// the end of the doc).
function findSection(editor: Editor, prompt: string): Section | null {
  const { doc } = editor.state;
  let headingPos = -1;
  let endPos = doc.content.size;
  doc.forEach((node, offset) => {
    if (node.type.name !== "heading") return;
    if (headingPos === -1) {
      if (node.textContent.trim() === prompt) headingPos = offset;
    } else if (endPos === doc.content.size) {
      endPos = offset;
    }
  });
  return headingPos === -1 ? null : { headingPos, endPos };
}

export default function PromptChips({ editor }: { editor: Editor | null }) {
  // Re-render only when the set of present prompts changes, not per keystroke.
  const present =
    useEditorState({
      editor,
      selector: ({ editor: ed }) =>
        ed ? DIARY_PROMPTS.map((p) => findSection(ed, p) !== null).join(",") : "",
    }) ?? "";
  const presentFlags = present.split(",").map((v) => v === "true");

  function onPrompt(prompt: string) {
    if (!editor) return;
    const section = findSection(editor, prompt);

    if (section) {
      // Already anchored in this entry: jump to the end of its section
      // instead of stacking a duplicate heading.
      const $end = editor.state.doc.resolve(Math.max(section.endPos - 1, section.headingPos + 1));
      const sel = TextSelection.near($end, -1);
      editor.chain().focus().setTextSelection(sel.from).scrollIntoView().run();
      return;
    }

    // Insert at the cursor. An empty paragraph under the heading gives the
    // caret somewhere to land, so the user can start writing immediately.
    editor
      .chain()
      .focus()
      .insertContent([
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: prompt }] },
        { type: "paragraph" },
      ])
      .scrollIntoView()
      .run();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {DIARY_PROMPTS.map((prompt, i) => {
        const isPresent = presentFlags[i];
        return (
          <button
            key={prompt}
            type="button"
            disabled={!editor}
            // Keep focus (and the caret) in the editor on click. Otherwise the
            // button steals focus and Tiptap restores it a frame later, so
            // the first keystrokes land at the old caret instead of under the
            // new heading. Keyboard activation still works via onClick.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPrompt(prompt)}
            aria-label={isPresent ? `Jump to: ${prompt}` : `Insert heading: ${prompt}`}
            className="group flex items-baseline gap-3 text-left rounded-md disabled:opacity-60"
          >
            <span
              className={`font-display italic text-[1.75rem] leading-tight tracking-[-0.01em] transition decoration-accent decoration-2 underline-offset-[6px] group-hover:underline group-focus-visible:underline ${
                isPresent ? "text-ink-muted" : "text-ink-secondary group-hover:text-ink-primary"
              }`}
            >
              {prompt}
            </span>
            <span aria-hidden className="font-mono text-[11px] text-ink-muted opacity-70 group-hover:opacity-100 transition">
              {isPresent ? "↓ jump" : "+ add"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
