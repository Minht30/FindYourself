import Image from "next/image";
import { flowerLabel, flowerStates } from "@/lib/focus/arc";

// The round's tally: one flower per focus session, bloomed for the ones done and a
// bud (day) or a dimmed bloom (night) for the ones to come. By day the red fan flower,
// at night the frost flower. The theme picks the picture in CSS (.for-*).
export default function SessionFlowers({ done, total, size = 32 }: { done: number; total: number; size?: number }) {
  return (
    <div role="img" aria-label={flowerLabel(done, total)} className="flex items-end justify-center gap-2">
      {flowerStates(done, total).map((state, i) => (
        <span key={i} aria-hidden className="relative block shrink-0" style={{ width: size, height: size }}>
          <Image
            src={state === "bloom" ? "/assets/world/Monstadt_Day/flower-bloom.webp" : "/assets/world/Monstadt_Day/flower-bud.webp"}
            alt=""
            width={112}
            height={112}
            className="for-monstadt h-full w-full object-contain"
          />
          <Image
            src="/assets/world/NodKrai_Night/nodkrai-frost-icon.webp"
            alt=""
            width={112}
            height={112}
            className={`for-nodkrai-night h-full w-full object-contain ${state === "bud" ? "opacity-50" : ""}`}
          />
        </span>
      ))}
    </div>
  );
}
