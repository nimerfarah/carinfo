import type { CarSearchResponse, CkanRecord, DatasetResult } from "@/types/Dataset";
import {
  buildSummary,
  formatMonthsToNextTest,
  formatValue,
  getFieldLabel,
  shouldHideField,
} from "@/utils/formatters";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function recordEntries(record: CkanRecord) {
  return Object.entries(record).filter(
    ([key, value]) =>
      !shouldHideField(key) &&
      value !== null &&
      value !== undefined &&
      value !== "",
  );
}

function columnsFor(records: CkanRecord[]): string[] {
  const keys = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!shouldHideField(key)) keys.add(key);
    }
  }
  return Array.from(keys);
}

function renderKeyValue(record: CkanRecord): string {
  const rows = recordEntries(record)
    .map(
      ([key, value]) => `
      <tr>
        <th>${escapeHtml(getFieldLabel(key))}</th>
        <td>${escapeHtml(formatValue(key, value))}</td>
      </tr>`,
    )
    .join("");
  return `<table class="kv">${rows}</table>`;
}

function renderTable(records: CkanRecord[]): string {
  const columns = columnsFor(records);
  const head = columns
    .map((c) => `<th>${escapeHtml(getFieldLabel(c))}</th>`)
    .join("");
  const body = records
    .map((record) => {
      const cells = columns
        .map((c) => `<td>${escapeHtml(formatValue(c, record[c]))}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table class="grid"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderDataset(result: DatasetResult): string {
  const { config, records, total } = result;
  const body =
    records.length > 1 ? renderTable(records) : renderKeyValue(records[0]);

  return `
    <section class="dataset">
      <h2>${escapeHtml(config.name)} <span class="meta">(${total})</span></h2>
      <p class="sub">${escapeHtml(config.nameHe)} — ${escapeHtml(config.description)}</p>
      ${body}
    </section>`;
}

function renderSummary(response: CarSearchResponse): string {
  const success = response.results.filter((r) => r.status === "success");
  const primary = success.find((r) => r.config.isPrimary) ?? success[0];
  const others = success.filter((r) => r !== primary);
  const summary = buildSummary(
    primary?.records[0],
    ...others.map((r) => r.records[0]),
  );
  if (!summary) return "";

  const candidates: Array<{ label: string; value: unknown }> = [
    { label: "Manufacturer", value: summary.manufacturer },
    { label: "Model", value: summary.model },
    { label: "Year", value: summary.year },
    { label: "Ownership", value: summary.ownership },
    {
      label: "Displacement",
      value:
        summary.displacement != null && summary.displacement !== ""
          ? `${summary.displacement} cc`
          : undefined,
    },
    {
      label: "Horsepower",
      value:
        summary.horsepower != null && summary.horsepower !== ""
          ? `${summary.horsepower} HP`
          : undefined,
    },
    { label: "Engine", value: summary.engine },
    { label: "Fuel", value: summary.fuel },
    { label: "Color", value: summary.color },
    { label: "Last Test Mileage", value: summary.lastMileage },
    {
      label: "Avg. km / Year",
      value:
        summary.avgKmPerYear != null
          ? `${summary.avgKmPerYear} km/year`
          : undefined,
    },
    { label: "Last Test Date", value: summary.lastTest },
    { label: "Valid Until", value: summary.validUntil },
    {
      label: "Until Next Test",
      value:
        typeof summary.monthsToNextTest === "number"
          ? formatMonthsToNextTest(summary.monthsToNextTest)
          : undefined,
    },
  ];
  const fields = candidates.filter(
    (f) => f.value !== undefined && f.value !== null && f.value !== "",
  );

  const items = fields
    .map(
      (f) => `
      <div class="summary-item">
        <div class="label">${escapeHtml(f.label)}</div>
        <div class="value">${escapeHtml(String(f.value))}</div>
      </div>`,
    )
    .join("");

  return `
    <section class="summary">
      <div class="plate">Vehicle ${escapeHtml(String(summary.vehicleNumber ?? response.carNumber))}</div>
      <div class="summary-grid">${items}</div>
    </section>`;
}

export function buildPrintHtml(response: CarSearchResponse): string {
  const success = response.results.filter((r) => r.status === "success");
  const generated = new Date(response.fetchedAt).toLocaleString("he-IL");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vehicle Report ${escapeHtml(response.carNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }
    .page {
      width: 100%;
      max-width: 100%;
      padding: 12mm;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 6px;
      white-space: normal;
      word-break: break-word;
    }
    .meta-line { color: #555; margin-bottom: 16px; font-size: 11px; }
    .summary {
      border: 1px solid #bbb;
      padding: 14px;
      margin-bottom: 16px;
      border-radius: 4px;
    }
    .plate { font-size: 20px; font-weight: 700; margin-bottom: 12px; letter-spacing: 0.02em; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px 14px;
    }
    .label { color: #666; font-size: 10px; margin-bottom: 2px; }
    .value { font-weight: 700; word-break: break-word; }
    .dataset {
      border: 1px solid #bbb;
      padding: 14px;
      margin-bottom: 14px;
      border-radius: 4px;
      page-break-inside: auto;
      break-inside: auto;
    }
    .dataset h2 { font-size: 15px; margin: 0 0 2px; }
    .dataset .meta { font-weight: 400; color: #666; }
    .sub { margin: 0 0 10px; color: #555; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; table-layout: auto; }
    table.kv th {
      text-align: left;
      width: 40%;
      padding: 6px 8px;
      border-bottom: 1px solid #e5e5e5;
      color: #555;
      font-weight: 600;
      vertical-align: top;
    }
    table.kv td {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e5e5;
      word-break: break-word;
      text-align: left;
    }
    table.grid th, table.grid td {
      border: 1px solid #ddd;
      padding: 5px 6px;
      text-align: left;
      word-break: break-word;
      font-size: 10px;
    }
    table.grid th { background: #f3f3f3; }
    @page { size: A4 portrait; margin: 10mm; }
    @media print {
      .page { padding: 0; }
      .dataset { page-break-inside: auto; }
      tr { page-break-inside: avoid; break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <h1>Israeli Vehicle Report — ${escapeHtml(response.carNumber)}</h1>
    <div class="meta-line">${escapeHtml(generated)} · ${success.length} dataset${success.length === 1 ? "" : "s"} · data.gov.il</div>
    ${renderSummary(response)}
    ${success.map(renderDataset).join("")}
  </div>
</body>
</html>`;
}

/**
 * Print a standalone report document.
 * Uses a full-width off-screen iframe (never 0×0 — Chrome otherwise
 * lays out a tiny column and clips titles/content).
 */
export function printCarReport(response: CarSearchResponse): void {
  const html = buildPrintHtml(response);

  // Prefer a real window — most reliable print layout in Chrome.
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    const run = () => {
      printWindow.print();
      // Close after dialog; browsers differ on afterprint timing.
      printWindow.addEventListener("afterprint", () => printWindow.close());
      window.setTimeout(() => {
        try {
          printWindow.close();
        } catch {
          /* ignore */
        }
      }, 60_000);
    };
    if (printWindow.document.readyState === "complete") {
      window.setTimeout(run, 100);
    } else {
      printWindow.onload = () => window.setTimeout(run, 100);
    }
    return;
  }

  // Popup blocked — fall back to a properly sized hidden iframe.
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Print report");
  // A4 ~794px at 96dpi — must be non-zero or Chrome clips the preview.
  iframe.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:794px",
    "height:1123px",
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    throw new Error("Unable to open print frame");
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => iframe.remove();
  const trigger = () => {
    try {
      win.focus();
      win.print();
    } finally {
      window.setTimeout(cleanup, 2000);
    }
  };

  window.setTimeout(trigger, 150);
}
