import { useState } from "react";
import { Check, Download, FileDown, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CarSearchResponse } from "@/types/Dataset";
import { copyShareUrl } from "@/utils/export";
import { downloadCarReportPdf } from "@/utils/pdfReport";

interface ExportToolbarProps {
  response: CarSearchResponse;
}

export function ExportToolbar({ response }: ExportToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const runPdf = async () => {
    setActionError(null);
    setBusy(true);
    try {
      await downloadCarReportPdf(response);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "PDF export failed",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 print:hidden sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void runPdf()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileDown className="size-3.5" />
          )}
          {busy ? "Preparing PDF…" : "PDF"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={async () => {
            await copyShareUrl(response.carNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Link2 className="size-3.5" />
          )}
          {copied ? "Link copied" : "Share URL"}
        </Button>
        <span className="ms-auto hidden text-xs text-[var(--muted)] sm:inline-flex items-center gap-1">
          <Download className="size-3" />
          Export & share
        </span>
      </div>
      {actionError && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {actionError}
        </p>
      )}
    </div>
  );
}
