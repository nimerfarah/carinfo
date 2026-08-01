import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FactFieldProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  emphasize?: boolean;
  wide?: boolean;
  tone?: "default" | "warn" | "ok";
}

export function FactField({
  label,
  value,
  icon: Icon,
  emphasize = false,
  wide = false,
  tone = "default",
}: FactFieldProps) {
  return (
    <div
      className={cn(
        "fact-tile min-w-0 rounded-2xl px-4 py-3.5",
        wide && "sm:col-span-2",
        tone === "warn" && "fact-tile--warn",
        tone === "ok" && "fact-tile--ok",
      )}
    >
      <div className="flex items-center gap-1.5">
        {Icon ? (
          <Icon
            className="size-3.5 shrink-0 text-[var(--accent)]"
            aria-hidden
          />
        ) : null}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1.5 break-words font-semibold leading-snug text-[var(--foreground)]",
          emphasize
            ? "font-[family-name:var(--font-display)] text-xl sm:text-2xl"
            : "text-[15px] sm:text-base",
        )}
      >
        {value}
      </p>
    </div>
  );
}

interface FactGroupProps {
  title: string;
  children: ReactNode;
}

export function FactGroup({ title, children }: FactGroupProps) {
  return (
    <section className="space-y-3">
      <h3 className="px-0.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

interface FactGridProps {
  children: ReactNode;
  className?: string;
}

export function FactGrid({ children, className }: FactGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}
