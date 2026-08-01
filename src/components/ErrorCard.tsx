import { AlertCircle } from "lucide-react";
import { DatasetIcon } from "@/components/DatasetIcon";
import { Card } from "@/components/ui/card";
import type { DatasetResult } from "@/types/Dataset";

interface ErrorCardProps {
  result: DatasetResult;
}

export function ErrorCard({ result }: ErrorCardProps) {
  return (
    <Card className="flex items-start gap-3 border-red-500/20 p-4 opacity-90">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
        <DatasetIcon name={result.config.icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{result.config.name}</h3>
          <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="size-3" />
            Unavailable
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {result.config.nameHe}
          {result.error ? ` — ${result.error}` : ""}
        </p>
      </div>
    </Card>
  );
}
