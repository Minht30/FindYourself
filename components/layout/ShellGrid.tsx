"use client";

import { useNav } from "./NavContext";

// The sidebar and the page, side by side. The sidebar column is 280 px, or a
// 64 px icon rail when the person has folded it (desktop only; phones use the drawer).
export default function ShellGrid({ children }: { children: React.ReactNode }) {
  const { collapsed } = useNav();
  return (
    <div
      data-sidebar={collapsed ? "min" : "full"}
      className={`flex-1 grid grid-cols-1 ${
        collapsed ? "md:grid-cols-[64px_1fr]" : "md:grid-cols-[280px_1fr]"
      } md:transition-[grid-template-columns] md:duration-200 gap-3 p-3 min-h-0`}
    >
      {children}
    </div>
  );
}
