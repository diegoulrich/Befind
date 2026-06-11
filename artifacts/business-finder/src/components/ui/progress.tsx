import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value?: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-stone-200", className)}>
      <div
        className="h-full rounded-full bg-indigo-600 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
