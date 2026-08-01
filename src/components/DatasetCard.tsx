import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DatasetIcon } from "@/components/DatasetIcon";
import { KeyValueView } from "@/components/KeyValueView";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CkanRecord, DatasetResult } from "@/types/Dataset";
import { formatValue } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface DatasetCardProps {
  result: DatasetResult;
  index: number;
}

function recordHeadline(record: CkanRecord, index: number): string {
  const dateKeys = [
    "moed_test",
    "test_date",
    "date_test",
    "baalut_dt",
    "moed_aliya_labaalut",
    "ownership_date",
    "TAARICH_PTICHA",
    "mivchan_acharon_dt",
    "tokef_dt",
    "TAARICH HAFAKAT TAG",
  ];
  for (const key of dateKeys) {
    if (record[key] != null && record[key] !== "") {
      return formatValue(key, record[key]);
    }
  }

  const nameKeys = ["sug_baalut_nm", "baalut", "SUG_RECALL", "kinuy_mishari"];
  for (const key of nameKeys) {
    if (record[key] != null && record[key] !== "") {
      return formatValue(key, record[key]);
    }
  }

  return `Entry ${index + 1}`;
}

function DatasetBody({ records }: { records: DatasetResult["records"] }) {
  if (records.length === 0) return null;

  if (records.length === 1) {
    return <KeyValueView record={records[0]} />;
  }

  return (
    <div className="space-y-3">
      {records.map((record, i) => (
        <article key={i} className="record-panel">
          <header className="mb-4 flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-xs font-bold text-[var(--accent)]">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Entry {i + 1} of {records.length}
              </p>
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                {recordHeadline(record, i)}
              </p>
            </div>
          </header>
          <KeyValueView record={record} />
        </article>
      ))}
    </div>
  );
}

export function DatasetCard({ result, index }: DatasetCardProps) {
  const [open, setOpen] = useState(index < 3);
  const { config, records, total } = result;

  useEffect(() => {
    const expand = () => setOpen(true);
    window.addEventListener("beforeprint", expand);
    return () => window.removeEventListener("beforeprint", expand);
  }, []);

  return (
    <div className="print-dataset">
      <Card className="print:bg-white print:shadow-none">
        <CardHeader className="p-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-start gap-3 rounded-2xl p-5 text-start transition-colors hover:bg-[var(--surface-hover)] print:cursor-default print:hover:bg-transparent"
            aria-expanded={open}
          >
            <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] print:bg-transparent print:text-black">
              <DatasetIcon name={config.icon} className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold leading-snug sm:text-lg">
                  {config.name}
                </span>
                <Badge className="shrink-0 print:border-neutral-300">
                  {total} record{total === 1 ? "" : "s"}
                </Badge>
              </span>
              <span
                className="mt-1 block text-sm leading-snug text-[var(--muted)] print:text-neutral-600"
                lang="he"
              >
                {config.nameHe}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)] print:text-neutral-600">
                {config.description}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "mt-2 size-5 shrink-0 text-[var(--muted)] transition-transform duration-300 print:hidden",
                open && "rotate-180",
              )}
            />
          </button>
        </CardHeader>

        {open && (
          <div className="print:hidden">
            <CardContent className="pb-5 pt-0">
              <DatasetBody records={records} />
            </CardContent>
          </div>
        )}

        <div className="hidden print:block">
          <CardContent className="pb-4">
            <DatasetBody records={records} />
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
