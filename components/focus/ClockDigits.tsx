// "25:00" in the mono face. `big` sizes it from the ring it sits in (container query
// units), so it scales with the ring; the header chip passes plain classes instead.
export default function ClockDigits({ text, big = false, className = "" }: { text: string; big?: boolean; className?: string }) {
  return (
    <span
      className={`font-mono font-medium tabular-nums leading-none tracking-tight ${className}`}
      style={big ? { fontSize: text.length > 5 ? "17cqw" : "22cqw" } : undefined}
    >
      {text}
    </span>
  );
}
