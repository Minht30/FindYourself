"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { updateBlock, deleteBlock } from "@/app/(app)/today/actions";
import type { CategoryDTO, TimeBlockDTO } from "./WeekGrid";

type Props = {
  block: TimeBlockDTO & { notes?: string | null };
  anchor: DOMRect;
  categories: CategoryDTO[];
  onClose: () => void;
  onSaved: () => void;
};

const POPOVER_WIDTH = 320;
const GAP = 8;

export default function BlockPopover({ block, anchor, categories, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(block.title || "");
  const [categoryId, setCategoryId] = useState<string | null>(block.category_id);
  const [notes, setNotes] = useState(block.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close on outside click or Esc
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(t)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Position: prefer to the right of the block, fall back to left, then below
  const { top, left } = computePosition(anchor);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await updateBlock({
      id: block.id,
      title: title.trim() || "Untitled",
      categoryId,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved();
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const res = await deleteBlock(block.id);
    setDeleting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved();
  }

  if (!mounted) return null;

  return createPortal(
    <div
      ref={rootRef}
      className="fixed z-[100] rounded-2xl bg-bg-elevated border border-[var(--border-strong)] shadow-card p-4 font-ui"
      style={{ top, left, width: `${POPOVER_WIDTH}px` }}
      role="dialog"
      aria-label="Edit time block"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          Edit block
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-7 h-7 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
        >
          <X size={14} />
        </button>
      </div>

      <label className="block mb-3">
        <span className="block text-[11px] font-ui font-semibold text-ink-secondary mb-1 uppercase tracking-wider">
          Title
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="w-full px-3 py-2 rounded-lg bg-bg-alt border border-[var(--border)] text-ink-primary text-sm focus:outline-none focus:border-accent"
          placeholder="Untitled"
        />
      </label>

      <label className="block mb-3">
        <span className="block text-[11px] font-ui font-semibold text-ink-secondary mb-1 uppercase tracking-wider">
          Category
        </span>
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value || null)}
          className="w-full px-3 py-2 rounded-lg bg-bg-alt border border-[var(--border)] text-ink-primary text-sm focus:outline-none focus:border-accent"
        >
          <option value="">— No category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block mb-3">
        <span className="block text-[11px] font-ui font-semibold text-ink-secondary mb-1 uppercase tracking-wider">
          Notes
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-bg-alt border border-[var(--border)] text-ink-primary text-sm focus:outline-none focus:border-accent resize-none"
          placeholder="Optional"
        />
      </label>

      {error && (
        <div className="mb-3 text-xs text-danger bg-bg-alt border border-[var(--border)] rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {confirmDelete ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger text-white text-xs font-ui hover:opacity-90 disabled:opacity-60 transition"
          >
            <Trash2 size={12} /> {deleting ? "Deleting…" : "Confirm delete"}
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-strong)] text-danger text-xs font-ui hover:bg-danger/10 transition"
          >
            <Trash2 size={12} /> Delete
          </button>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-full text-ink-secondary text-xs font-ui hover:bg-bg-alt transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-full bg-accent text-cat-ink text-xs font-ui font-semibold hover:bg-accent-soft disabled:opacity-60 transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function computePosition(anchor: DOMRect): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const desiredTop = anchor.top;
  const spaceRight = vw - anchor.right;

  // Place to the right if there's room, else to the left; else center-below.
  let left: number;
  if (spaceRight >= POPOVER_WIDTH + GAP) {
    left = anchor.right + GAP;
  } else if (anchor.left >= POPOVER_WIDTH + GAP) {
    left = anchor.left - POPOVER_WIDTH - GAP;
  } else {
    left = Math.max(GAP, Math.min(vw - POPOVER_WIDTH - GAP, anchor.left));
  }

  // Roughly guess the popover height for clamping — matches actual layout.
  const approxHeight = 380;
  const top = Math.max(GAP, Math.min(vh - approxHeight - GAP, desiredTop));

  return { top, left };
}
