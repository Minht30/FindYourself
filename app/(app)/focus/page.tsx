import type { Metadata } from "next";
import TimerCard from "@/components/focus/TimerCard";

export const metadata: Metadata = { title: "Focus — FindYourself" };

export default function FocusPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <header className="w-full max-w-[460px]">
        <h1 className="font-display text-3xl">Focus</h1>
        <p className="text-ink-secondary text-[15px] mt-1">
          One thing at a time. The timer keeps going while you move around the app.
        </p>
      </header>
      <TimerCard />
    </div>
  );
}
