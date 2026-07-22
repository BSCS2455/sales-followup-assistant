import { UrgencyLevel } from "@/lib/urgency";

const STYLES: Record<UrgencyLevel, { bar: string; label: string; text: string }> = {
  overdue: { bar: "bg-[var(--color-hot)]", label: "Overdue", text: "text-[var(--color-hot)]" },
  "due-soon": { bar: "bg-[var(--color-warm)]", label: "Due soon", text: "text-[var(--color-warm)]" },
  ok: { bar: "bg-[var(--color-cold)]", label: "On track", text: "text-[var(--color-cold)]" },
  closed: { bar: "bg-[#B9B7AE]", label: "Closed", text: "text-[#8C8A80]" },
};

export function UrgencyTab({
  level,
  days,
}: {
  level: UrgencyLevel;
  days: number;
}) {
  const s = STYLES[level];
  return (
    <div className="flex items-stretch gap-3">
      <div className={`w-1.5 rounded-full ${s.bar}`} />
      <div className="flex flex-col justify-center">
        <span className={`text-xs font-semibold uppercase tracking-wide ${s.text}`}>
          {s.label}
        </span>
        <span className="font-num text-xs text-[#6B6A63]">
          {level === "closed" ? "—" : `${days}d since contact`}
        </span>
      </div>
    </div>
  );
}

const TEMP_STYLES: Record<string, { bg: string; text: string }> = {
  hot: { bg: "bg-[var(--color-hot-bg)]", text: "text-[var(--color-hot)]" },
  warm: { bg: "bg-[var(--color-warm-bg)]", text: "text-[var(--color-warm)]" },
  cold: { bg: "bg-[var(--color-cold-bg)]", text: "text-[var(--color-cold)]" },
};

export function TemperatureBadge({ temperature }: { temperature: string }) {
  const s = TEMP_STYLES[temperature] || TEMP_STYLES.cold;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${s.bg} ${s.text}`}
    >
      {temperature}
    </span>
  );
}
