import type { ThemeName } from "@/lib/theme";
import { PHONE_MAX_WIDTH, WALLPAPERS } from "@/lib/wallpapers";

// Tells the browser to start fetching the painting for `theme` before it has read the
// stylesheet that uses it (it is the largest thing on the page). rel=preload is allowed in
// the body; a phone gets the small file when there is one.
export default function PreloadWallpaper({ theme }: { theme: ThemeName }) {
  const w = WALLPAPERS[theme];
  if (!w.phoneSrc) return <link rel="preload" as="image" href={w.src} />;
  return (
    <>
      <link rel="preload" as="image" href={w.phoneSrc} media={`(max-width: ${PHONE_MAX_WIDTH}px)`} />
      <link rel="preload" as="image" href={w.src} media={`(min-width: ${PHONE_MAX_WIDTH + 1}px)`} />
    </>
  );
}
