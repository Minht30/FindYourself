"use client";

import Spirit from "@/components/focus/Spirit";

// The night theme's symbol, the moon-moth, floating at the corner of the hero card (it
// bobs gently; still under reduced motion). By day the corner is left empty: the dandelion
// seed is the timer's companion, not the landing page's.
export default function HeroSpirit() {
  return (
    <div aria-hidden className="for-nodkrai-night pointer-events-none absolute -right-3 -top-12 hidden sm:block">
      <Spirit state="idle" size={96} inline />
    </div>
  );
}
