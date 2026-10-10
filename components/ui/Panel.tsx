import type { ComponentPropsWithoutRef, ElementType } from "react";

// The one big panel of the app (Diary, Year in pages, and the pages that follow): see-through
// paper over the painting, a frame, a watermark in the foot, the content inside. The markup is
// the same in every theme. The theme's tokens in app/globals.css decide what is drawn (the moon
// frame at night, a hairline and four sparkles by day). Inside it the colour tokens follow the paper:
// Nod-Krai's paper is light inside a dark theme, so its tokens are re-declared there (data-surface).
type Props<T extends ElementType> = {
  as?: T;
  className?: string;
  bodyClassName?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

const PIECES = [
  "pf-corner pf-tl",
  "pf-corner pf-tr",
  "pf-corner pf-bl",
  "pf-corner pf-br",
  "pf-edge-h pf-top",
  "pf-edge-h pf-bottom",
  "pf-edge-v pf-left",
  "pf-edge-v pf-right",
  "pf-medal-h pf-medal-t",
  "pf-medal-h pf-medal-b",
  "pf-medal-v pf-medal-l",
  "pf-medal-v pf-medal-r",
] as const;

export default function Panel<T extends ElementType = "section">({ as, className, bodyClassName, children, ...rest }: Props<T>) {
  const Tag: ElementType = as ?? "section";
  return (
    <Tag data-surface="paper" className={`panel${className ? ` ${className}` : ""}`} {...rest}>
      <div className="panel-paper" aria-hidden="true" />
      <div className="panel-mark" aria-hidden="true" />
      <div className="panel-frame" aria-hidden="true">
        {PIECES.map((p) => (
          <i key={p} className={p} />
        ))}
      </div>
      <div className={`panel-body${bodyClassName ? ` ${bodyClassName}` : ""}`}>{children}</div>
    </Tag>
  );
}
