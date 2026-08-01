import { useMemo } from "react";
import { motion } from "framer-motion";
import { Database, Info } from "lucide-react";
import { CreatorSignature } from "@/components/CreatorSignature";
import { DatasetCard } from "@/components/DatasetCard";
import { ExportToolbar } from "@/components/ExportToolbar";
import { LoadingGrid } from "@/components/LoadingCard";
import { SearchBar } from "@/components/SearchBar";
import { SummaryCard } from "@/components/SummaryCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DATASETS } from "@/config/datasets";
import { useCarSearch } from "@/hooks/useCarSearch";
import { buildSummary } from "@/utils/formatters";

function getInitialPlate(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("plate") ?? undefined;
}

export function Home() {
  const {
    carNumber,
    setCarNumber,
    search,
    history,
    clearHistory,
    validationError,
    isLoading,
    data,
    successResults,
    errorResults,
    hasSearched,
  } = useCarSearch(getInitialPlate());

  const summary = useMemo(() => {
    const primary =
      successResults.find((r) => r.config.isPrimary) ?? successResults[0];
    const others = successResults.filter((r) => r !== primary);
    return buildSummary(
      primary?.records[0],
      ...others.map((r) => r.records[0]),
    );
  }, [successResults]);

  return (
    <div className="app-shell relative min-h-dvh print:overflow-visible">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden print:hidden">
        <div className="absolute -start-32 -top-24 size-[420px] rounded-full bg-[var(--accent)]/20 blur-3xl" />
        <div className="absolute -end-24 top-40 size-[380px] rounded-full bg-[var(--accent-2)]/15 blur-3xl" />
        <div className="absolute bottom-0 start-1/3 size-[320px] rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/70 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/30">
              <Database className="size-4.5" />
            </span>
            <div className="leading-tight">
              <p className="font-[family-name:var(--font-display)] text-sm font-bold sm:text-base">
                Car Check IL
              </p>
              <p className="text-[10px] text-[var(--muted)] sm:text-xs">
                data.gov.il open data
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center print:hidden"
        >
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-5xl">
            Israeli Vehicle Information
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--muted-foreground)] sm:text-base">
            Enter a license plate to query all {DATASETS.length} government
            open-data datasets in parallel.
          </p>
        </motion.div>

        <div className="print:hidden">
          <SearchBar
            value={carNumber}
            onChange={setCarNumber}
            onSearch={search}
            isLoading={isLoading}
            history={history}
            onClearHistory={clearHistory}
            validationError={validationError}
          />
        </div>

        {hasSearched && (
          <section className="mt-10 space-y-6 overflow-visible">
            {isLoading && <LoadingGrid count={4} />}

            {!isLoading && data && (
              <>
                <div className="mb-4 hidden print:block">
                  <h1 className="text-2xl font-bold">
                    Israeli Vehicle Report — {data.carNumber}
                  </h1>
                  <p className="mt-1 text-sm text-neutral-600">
                    Generated {new Date(data.fetchedAt).toLocaleString("he-IL")} ·{" "}
                    {successResults.length} dataset
                    {successResults.length === 1 ? "" : "s"} · data.gov.il
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Search results
                    </p>
                    <h2 className="mt-1 text-xl font-bold leading-snug sm:text-2xl">
                      Plate{" "}
                      <span className="font-[family-name:var(--font-display)] tabular-nums text-[var(--accent)]">
                        {data.carNumber}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {successResults.length} source
                      {successResults.length === 1 ? "" : "s"} with readable
                      details below
                    </p>
                  </div>
                  {successResults.length > 0 && (
                    <ExportToolbar response={data} />
                  )}
                </div>

                {summary && (
                  <SummaryCard summary={summary} carNumber={data.carNumber} />
                )}

                {successResults.length === 0 && (
                  <div className="glass-card flex items-start gap-3 rounded-2xl p-5">
                    <Info className="mt-0.5 size-5 shrink-0 text-[var(--accent)]" />
                    <div className="min-w-0">
                      <p className="font-semibold">No records found</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {errorResults.length === DATASETS.length
                          ? "Could not reach government data. Check your network and try again."
                          : "None of the government datasets returned data for this plate. Empty sources are hidden automatically."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 overflow-visible">
                  {successResults.map((result, index) => (
                    <DatasetCard
                      key={result.config.id}
                      result={result}
                      index={index}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-12 pt-6 print:hidden sm:px-6">
        <CreatorSignature />
      </footer>
    </div>
  );
}
