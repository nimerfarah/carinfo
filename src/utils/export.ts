import type { CarSearchResponse, CkanRecord, DatasetResult } from "@/types/Dataset";
import { getFieldLabel, shouldHideField } from "@/utils/formatters";

export function getVisibleResults(response: CarSearchResponse | undefined) {
  if (!response) return { success: [] as DatasetResult[], errors: [] as DatasetResult[] };
  return {
    // Only datasets with real rows are shown — empty/error stay off the page
    success: response.results.filter(
      (r) => r.status === "success" && r.records.length > 0,
    ),
    errors: response.results.filter((r) => r.status === "error"),
  };
}

export function exportToJson(response: CarSearchResponse): void {
  const payload = {
    carNumber: response.carNumber,
    fetchedAt: response.fetchedAt,
    datasets: response.results
      .filter((r) => r.status === "success")
      .map((r) => ({
        name: r.config.name,
        nameHe: r.config.nameHe,
        resourceId: r.config.resourceId,
        total: r.total,
        records: r.records,
      })),
  };

  downloadBlob(
    JSON.stringify(payload, null, 2),
    `vehicle-${response.carNumber}.json`,
    "application/json",
  );
}

export function exportToCsv(response: CarSearchResponse): void {
  const lines: string[] = [];

  for (const result of response.results.filter((r) => r.status === "success")) {
    lines.push(`# ${result.config.name} (${result.config.nameHe})`);
    if (!result.records.length) continue;

    const keys = Object.keys(result.records[0]).filter((k) => !shouldHideField(k));
    lines.push(keys.map((k) => csvEscape(getFieldLabel(k))).join(","));
    for (const record of result.records) {
      lines.push(keys.map((k) => csvEscape(String(record[k] ?? ""))).join(","));
    }
    lines.push("");
  }

  downloadBlob(
    lines.join("\n"),
    `vehicle-${response.carNumber}.csv`,
    "text/csv;charset=utf-8",
  );
}

export async function copyJson(response: CarSearchResponse): Promise<void> {
  const payload = {
    carNumber: response.carNumber,
    fetchedAt: response.fetchedAt,
    datasets: response.results
      .filter((r) => r.status === "success")
      .map((r) => ({
        name: r.config.name,
        resourceId: r.config.resourceId,
        records: r.records,
      })),
  };
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
}

export function shareSearchUrl(carNumber: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("plate", carNumber);
  return url.toString();
}

export async function copyShareUrl(carNumber: string): Promise<string> {
  const url = shareSearchUrl(carNumber);
  await navigator.clipboard.writeText(url);
  return url;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function recordsToRows(records: CkanRecord[]) {
  if (!records.length) return { columns: [] as string[], rows: [] as string[][] };
  const columns = Object.keys(records[0]).filter((k) => !shouldHideField(k));
  const rows = records.map((r) => columns.map((c) => String(r[c] ?? "")));
  return { columns, rows };
}
