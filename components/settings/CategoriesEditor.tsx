"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
  type CategoryResult,
} from "@/app/(app)/settings/category-actions";
import { categoryColor } from "@/lib/categories";
import {
  CATEGORY_MESSAGES,
  MAX_CATEGORIES,
  MAX_NAME,
  PALETTE,
  validateCategoryName,
  type CategoryReason,
} from "@/lib/categoryRules";
import { moveDown, moveUp } from "@/lib/music/playlist";

export type EditableCategory = { id: string; name: string; color: string };
export type CategoryUsage = Record<string, { blocks: number; tasks: number }>;

type Problem = { where: string; reason: CategoryReason } | null;

// A request that gets no answer at all (signed out in another tab) has no result.
const asResult = (r: CategoryResult | undefined): CategoryResult => r ?? { ok: false, reason: "unauthenticated" };

function Swatches({ value, onPick, label }: { value: string; onPick: (hex: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {PALETTE.map((hex) => {
        const selected = hex.toUpperCase() === value.toUpperCase();
        return (
          <button
            key={hex}
            type="button"
            aria-label={hex}
            aria-pressed={selected}
            onClick={() => onPick(hex)}
            className={`w-6 h-6 rounded-full border-2 transition ${selected ? "border-ink-primary" : "border-transparent hover:border-[var(--border-strong)]"}`}
            style={{ background: hex }}
          />
        );
      })}
    </div>
  );
}

// Rename, recolour, reorder, delete (with "move things to...") and add. The
// saved categories (from the server) are the source of truth: after every
// change the page refreshes and this list follows it.
export default function CategoriesEditor({
  categories,
  usage,
}: {
  categories: EditableCategory[];
  usage: CategoryUsage;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [items, setItems] = useState(categories);
  const [problem, setProblem] = useState<Problem>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState<string>("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const unused = PALETTE.find((p) => !categories.some((c) => c.color.toUpperCase() === p.toUpperCase())) ?? PALETTE[0];
  const [newColor, setNewColor] = useState<string>(unused);

  useEffect(() => setItems(categories), [categories]);

  const atCap = items.length >= MAX_CATEGORIES;

  function run(where: string, call: () => Promise<CategoryResult | undefined>, after?: () => void) {
    setProblem(null);
    start(async () => {
      const res = asResult(await call());
      if (!res.ok) {
        setProblem({ where, reason: res.reason });
        setItems(categories); // back to what is saved
        return;
      }
      after?.();
      router.refresh();
    });
  }

  function saveName(c: EditableCategory) {
    const draft = names[c.id];
    if (draft === undefined || draft === c.name) return;
    const checked = validateCategoryName(draft);
    if (!checked.ok) {
      setProblem({ where: c.id, reason: checked.reason });
      return;
    }
    run(c.id, () => updateCategory(c.id, { name: checked.value }), () =>
      setNames((n) => {
        const { [c.id]: _gone, ...rest } = n;
        void _gone;
        return rest;
      }),
    );
  }

  function move(index: number, dir: "up" | "down") {
    const next = dir === "up" ? moveUp(items, index) : moveDown(items, index);
    setItems(next);
    run("list", () => reorderCategories(next.map((c) => c.id)));
  }

  function add() {
    const checked = validateCategoryName(newName);
    if (!checked.ok) {
      setProblem({ where: "new", reason: checked.reason });
      return;
    }
    run("new", () => createCategory(checked.value, newColor), () => setNewName(""));
  }

  const message = (where: string) =>
    problem && problem.where === where ? (
      <p role="alert" data-reason={problem.reason} className="mt-1 text-[12px] text-[var(--danger)]">
        {CATEGORY_MESSAGES[problem.reason]}
      </p>
    ) : null;

  return (
    <div className="space-y-4">
      <ul className="space-y-2" aria-label="Your categories">
        {items.map((c, i) => {
          const use = usage[c.id] ?? { blocks: 0, tasks: 0 };
          const isDeleting = deleting === c.id;
          const others = items.filter((o) => o.id !== c.id);
          return (
            <li key={c.id} data-category-row={c.name} className="rounded-xl border border-[var(--border)] bg-bg-elevated p-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Colour for ${c.name}`}
                  aria-expanded={picking === c.id}
                  onClick={() => setPicking(picking === c.id ? null : c.id)}
                  className="w-6 h-6 rounded-md border border-[var(--border-strong)] shrink-0"
                  style={{ background: categoryColor(c) }}
                />
                <input
                  aria-label={`Name of ${c.name}`}
                  value={names[c.id] ?? c.name}
                  maxLength={MAX_NAME * 2}
                  onChange={(e) => setNames((n) => ({ ...n, [c.id]: e.target.value }))}
                  onBlur={() => saveName(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") {
                      setNames((n) => {
                        const { [c.id]: _gone, ...rest } = n;
                        void _gone;
                        return rest;
                      });
                      setProblem(null);
                    }
                  }}
                  className="min-w-0 flex-1 rounded-md border border-transparent hover:border-[var(--border)] focus:border-accent bg-transparent px-2 py-1 font-ui text-[15px] text-ink-primary"
                />
                <button
                  type="button"
                  aria-label={`Move ${c.name} up`}
                  disabled={i === 0 || pending}
                  onClick={() => move(i, "up")}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-secondary"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${c.name} down`}
                  disabled={i === items.length - 1 || pending}
                  onClick={() => move(i, "down")}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-secondary"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${c.name}`}
                  aria-expanded={isDeleting}
                  disabled={items.length <= 1 || pending}
                  title={items.length <= 1 ? "Keep at least one category" : undefined}
                  onClick={() => {
                    setDeleting(isDeleting ? null : c.id);
                    setMoveTo("");
                    setProblem(null);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-secondary"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {picking === c.id ? (
                <div className="mt-2 pl-8">
                  <Swatches
                    label={`Pick a colour for ${c.name}`}
                    value={c.color}
                    onPick={(hex) => {
                      setPicking(null);
                      run(c.id, () => updateCategory(c.id, { color: hex }));
                    }}
                  />
                </div>
              ) : null}

              {message(c.id)}

              {isDeleting ? (
                <div className="mt-3 rounded-lg bg-bg-alt p-3 font-ui text-[13px] text-ink-secondary" data-delete-panel>
                  <p>
                    Delete <strong className="text-ink-primary">{c.name}</strong>?{" "}
                    {use.blocks + use.tasks === 0
                      ? "Nothing uses it."
                      : `It is used by ${use.blocks} ${use.blocks === 1 ? "block" : "blocks"} and ${use.tasks} ${use.tasks === 1 ? "task" : "tasks"}.`}
                  </p>
                  {use.blocks + use.tasks > 0 ? (
                    <label className="mt-2 flex items-center gap-2">
                      Move them to
                      <select
                        value={moveTo}
                        onChange={(e) => setMoveTo(e.target.value)}
                        className="rounded-md border border-[var(--border)] bg-bg-elevated px-2 py-1 text-ink-primary"
                      >
                        <option value="">No category</option>
                        {others.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(c.id, () => deleteCategory(c.id, moveTo === "" ? null : moveTo), () => setDeleting(null))}
                      className="px-3 py-1.5 rounded-full bg-[var(--danger)] text-white font-semibold disabled:opacity-60"
                    >
                      Delete
                    </button>
                    <button type="button" onClick={() => setDeleting(null)} className="px-3 py-1.5 rounded-full border border-[var(--border-strong)] text-ink-primary">
                      Keep
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {message("list")}

      <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-3">
        <p className="font-ui text-[13px] text-ink-secondary mb-2">
          {atCap ? `You have ${MAX_CATEGORIES} categories, the most you can have.` : `Add a category (${items.length} of ${MAX_CATEGORIES})`}
        </p>
        {!atCap ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                aria-label="New category name"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") add();
                }}
                className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-bg-elevated px-2 py-1.5 font-ui text-[15px] text-ink-primary"
              />
              <button
                type="button"
                onClick={add}
                disabled={pending}
                className="px-4 py-1.5 rounded-full bg-accent text-cat-ink font-ui font-semibold disabled:opacity-60"
              >
                Add
              </button>
            </div>
            <Swatches label="Pick a colour for the new category" value={newColor} onPick={setNewColor} />
          </div>
        ) : null}
        {message("new")}
      </div>
    </div>
  );
}
