import {
  Calendar,
  CalendarClock,
  Car,
  Factory,
  Fuel,
  Gauge,
  Hash,
  Palette,
  Route,
  Shield,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FactField, FactGroup } from "@/components/FactGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatMonthsToNextTest,
  formatValue,
} from "@/utils/formatters";
import type { buildSummary } from "@/utils/formatters";

type Summary = NonNullable<ReturnType<typeof buildSummary>>;

interface SummaryCardProps {
  summary: Summary;
  carNumber: string;
}

function formatSummaryValue(key: keyof Summary, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "displacement") {
    return `${new Intl.NumberFormat("he-IL").format(Number(value))} cc`;
  }
  if (key === "horsepower") {
    return `${new Intl.NumberFormat("he-IL").format(Number(value))} HP`;
  }
  if (key === "monthsToNextTest" && typeof value === "number") {
    return formatMonthsToNextTest(value);
  }
  if (key === "avgKmPerYear") {
    return `${new Intl.NumberFormat("he-IL").format(Number(value))} km/year`;
  }
  if (key === "lastMileage") {
    return `${new Intl.NumberFormat("he-IL").format(Number(value))} km`;
  }
  return formatValue(String(key), value as string | number | boolean);
}

type FieldDef = {
  key: keyof Summary;
  label: string;
  icon: LucideIcon;
  emphasize?: boolean;
  wide?: boolean;
};

const GROUPS: Array<{ title: string; fields: FieldDef[] }> = [
  {
    title: "Vehicle",
    fields: [
      { key: "manufacturer", label: "Manufacturer", icon: Factory, emphasize: true, wide: true },
      { key: "model", label: "Model", icon: Car, emphasize: true },
      { key: "year", label: "Year", icon: Calendar },
      { key: "ownership", label: "Ownership", icon: Shield },
      { key: "color", label: "Color", icon: Palette },
    ],
  },
  {
    title: "Engine & fuel",
    fields: [
      { key: "displacement", label: "Displacement", icon: Gauge },
      { key: "horsepower", label: "Horsepower", icon: Zap },
      { key: "engine", label: "Engine", icon: Hash },
      { key: "fuel", label: "Fuel", icon: Fuel },
    ],
  },
  {
    title: "Tests & license",
    fields: [
      { key: "lastMileage", label: "Last test mileage", icon: Gauge, emphasize: true },
      { key: "avgKmPerYear", label: "Avg. km / year", icon: Route },
      { key: "lastTest", label: "Last test date", icon: Calendar },
      { key: "validUntil", label: "Valid until", icon: ShieldCheck },
      { key: "monthsToNextTest", label: "Until next test", icon: CalendarClock, wide: true },
    ],
  },
];

function isPresent(summary: Summary, key: keyof Summary): boolean {
  const v = summary[key];
  if (v === undefined || v === null || v === "") return false;
  if (key === "avgKmPerYear" && Number(v) <= 0) return false;
  return true;
}

export function SummaryCard({ summary, carNumber }: SummaryCardProps) {
  const plate = String(summary.vehicleNumber ?? carNumber);
  const headline = [summary.manufacturer, summary.model]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="border-[var(--accent)]/20">
      <div className="h-1.5 w-full bg-gradient-to-r from-[var(--accent)] via-[var(--accent-2)] to-[var(--accent)]" />
      <CardHeader className="gap-3 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Quick overview
          </p>
          <CardTitle className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-wide sm:text-4xl">
            {plate}
          </CardTitle>
          {headline ? (
            <p className="mt-2 text-sm leading-snug text-[var(--muted-foreground)]">
              {headline}
              {summary.year ? ` · ${summary.year}` : ""}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-7">
        {GROUPS.map((group) => {
          const fields = group.fields.filter((f) => isPresent(summary, f.key));
          if (fields.length === 0) return null;

          return (
            <FactGroup key={group.title} title={group.title}>
              {fields.map((field) => {
                const overdue =
                  field.key === "monthsToNextTest" &&
                  typeof summary.monthsToNextTest === "number" &&
                  summary.monthsToNextTest < 0;
                const ok =
                  field.key === "monthsToNextTest" &&
                  typeof summary.monthsToNextTest === "number" &&
                  summary.monthsToNextTest >= 0;

                return (
                  <FactField
                    key={field.key}
                    label={field.label}
                    value={formatSummaryValue(field.key, summary[field.key])}
                    icon={field.icon}
                    emphasize={field.emphasize}
                    wide={field.wide}
                    tone={overdue ? "warn" : ok ? "ok" : "default"}
                  />
                );
              })}
            </FactGroup>
          );
        })}
      </CardContent>
    </Card>
  );
}
