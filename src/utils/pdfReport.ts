import { jsPDF } from "jspdf";
import type { CarSearchResponse, CkanRecord, DatasetResult } from "@/types/Dataset";
import {
  buildSummary,
  formatMonthsToNextTest,
  formatValue,
  getFieldLabel,
  shouldHideField,
} from "@/utils/formatters";

const MARGIN = 14;
const GAP = 3;
const ACCENT: [number, number, number] = [13, 115, 119];
const MUTED: [number, number, number] = [90, 100, 100];
const LINE: [number, number, number] = [220, 225, 225];
const TILE_BG: [number, number, number] = [245, 249, 249];
const TILE_BORDER: [number, number, number] = [210, 222, 222];
const WARN_BG: [number, number, number] = [254, 242, 242];
const OK_BG: [number, number, number] = [232, 245, 245];

type FactTone = "default" | "warn" | "ok";

type FactItem = {
  label: string;
  value: string;
  wide?: boolean;
  tone?: FactTone;
};

const PRIORITY_KEYS = [
  "mispar_rechev",
  "MISPAR_RECHEV",
  "MISPAR RECHEV",
  "tozeret_nm",
  "kinuy_mishari",
  "degem_nm",
  "shnat_yitzur",
  "baalut",
  "sug_baalut_nm",
  "sug_baalut",
  "tzeva_rechev",
  "delek_nm",
  "sug_delek_nm",
  "nefah_manoa",
  "nefach_manoa",
  "koah_sus",
  "degem_manoa",
  "mispar_manoa",
  "mivchan_acharon_dt",
  "tokef_dt",
  "kilometer_test_aharon",
  "kilometraz",
  "km",
  "moed_test",
  "test_date",
  "date_test",
  "baalut_dt",
  "moed_aliya_labaalut",
  "ownership_date",
  "moed_aliya_lakvish",
  "rishum_rishon_dt",
  "TEUR_TAKALA",
  "TEUR_RECALL",
  "SUG_RECALL",
  "TAARICH_PTICHA",
  "TAARICH_SGIRA",
  "CO2_WLTP",
  "tzinur_co2",
  "tzrichat_delek",
  "madad_yarok",
  "kvutzat_zihum",
  "TAARICH HAFAKAT TAG",
  "SUG TAV",
  "SUG_TAV",
];

/**
 * jsPDF has no real RTL. Only reverse pure-Hebrew tokens.
 * Never reshape mixed Hebrew+English lines (that garbles descriptions).
 */
function shapeForPdf(value: string): string {
  const text = String(value);
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) ?? []).length;
  const latinChars = (text.match(/[A-Za-z]/g) ?? []).length;

  if (hebrewChars === 0 || latinChars > 0) return text;

  return text.replace(
    /[\u0590-\u05FF][\u0590-\u05FF'׳״]*/g,
    (run) => [...run].reverse().join(""),
  );
}

function pdfText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return shapeForPdf(String(value));
}

function isCodeKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k === "_id" ||
    k.endsWith("_cd") ||
    k.endsWith("_id") ||
    k.includes("code") ||
    k === "rank"
  );
}

function isWideValue(key: string, value: string): boolean {
  if (value.length > 42) return true;
  const k = key.toLowerCase();
  return (
    k.includes("teur") ||
    k.includes("desc") ||
    k.includes("sibba") ||
    k.includes("recall")
  );
}

function recordFacts(record: CkanRecord): { main: FactItem[]; codes: FactItem[] } {
  const priority = new Map(PRIORITY_KEYS.map((k, i) => [k, i]));
  const entries = Object.entries(record)
    .filter(
      ([key, value]) =>
        !shouldHideField(key) &&
        key !== "rank" &&
        value !== null &&
        value !== undefined &&
        value !== "",
    )
    .sort(([a], [b]) => {
      const pa = priority.has(a) ? priority.get(a)! : 1000;
      const pb = priority.has(b) ? priority.get(b)! : 1000;
      if (pa !== pb) return pa - pb;
      if (isCodeKey(a) !== isCodeKey(b)) return isCodeKey(a) ? 1 : -1;
      return getFieldLabel(a).localeCompare(getFieldLabel(b));
    });

  const main: FactItem[] = [];
  const codes: FactItem[] = [];

  for (const [key, value] of entries) {
    const text = formatValue(
      key,
      value as string | number | boolean | null | undefined,
    );
    const item: FactItem = {
      label: getFieldLabel(key),
      value: text,
      wide: isWideValue(key, text),
    };
    if (isCodeKey(key)) codes.push(item);
    else main.push(item);
  }

  return { main, codes };
}

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function registerFonts(doc: jsPDF): Promise<void> {
  const [regular, bold] = await Promise.all([
    fetch(`${import.meta.env.BASE_URL}fonts/DejaVuSans.ttf`).then((r) => {
      if (!r.ok) throw new Error("Missing DejaVuSans.ttf in /public/fonts");
      return r.arrayBuffer();
    }),
    fetch(`${import.meta.env.BASE_URL}fonts/DejaVuSans-Bold.ttf`).then((r) => {
      if (!r.ok) throw new Error("Missing DejaVuSans-Bold.ttf in /public/fonts");
      return r.arrayBuffer();
    }),
  ]);

  doc.addFileToVFS("DejaVuSans.ttf", await arrayBufferToBase64(regular));
  doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
  doc.addFileToVFS("DejaVuSans-Bold.ttf", await arrayBufferToBase64(bold));
  doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
  doc.setFont("DejaVu", "normal");
}

function addHeader(doc: jsPDF, carNumber: string, generated: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("DejaVu", "bold");
  doc.setFontSize(16);
  doc.text("Israeli Vehicle Report", MARGIN, 12);

  doc.setFont("DejaVu", "normal");
  doc.setFontSize(10);
  doc.text(`Plate ${carNumber}`, MARGIN, 21);
  doc.text(pdfText(generated), pageWidth - MARGIN, 21, { align: "right" });
}

function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, pageHeight - 12, pageWidth - MARGIN, pageHeight - 12);
    doc.setFont("DejaVu", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      "Source: data.gov.il  ·  Built by Tiger",
      MARGIN,
      pageHeight - 7,
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - MARGIN, pageHeight - 7, {
      align: "right",
    });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed < pageHeight - 18) return y;
  doc.addPage();
  return 18;
}

function measureTileHeight(
  doc: jsPDF,
  item: FactItem,
  contentWidth: number,
): number {
  doc.setFont("DejaVu", "bold");
  doc.setFontSize(9.5);
  const valueLines = doc.splitTextToSize(pdfText(item.value), contentWidth);
  return Math.max(14, 7 + valueLines.length * 4.2 + 4);
}

function drawFactTile(
  doc: jsPDF,
  item: FactItem,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const bg =
    item.tone === "warn" ? WARN_BG : item.tone === "ok" ? OK_BG : TILE_BG;
  doc.setFillColor(...bg);
  doc.setDrawColor(...TILE_BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, width, height, 2, 2, "FD");

  const contentWidth = width - 6;
  doc.setFont("DejaVu", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(pdfText(item.label).toUpperCase(), x + 3, y + 4.5);

  doc.setFont("DejaVu", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(25, 35, 35);
  const valueLines = doc.splitTextToSize(pdfText(item.value), contentWidth);
  doc.text(valueLines, x + 3, y + 10);
}

function drawFactTiles(
  doc: jsPDF,
  items: FactItem[],
  startY: number,
): number {
  if (items.length === 0) return startY;

  const pageWidth = doc.internal.pageSize.getWidth();
  const fullWidth = pageWidth - MARGIN * 2;
  const colWidth = (fullWidth - GAP) / 2;
  let y = startY;
  let col = 0;
  let rowY = y;
  let rowHeight = 0;

  const flushRow = () => {
    y = rowY + rowHeight + GAP;
    col = 0;
    rowHeight = 0;
    rowY = y;
  };

  for (const item of items) {
    const wide = Boolean(item.wide);
    if (wide && col === 1) flushRow();

    const width = wide ? fullWidth : colWidth;
    const height = measureTileHeight(doc, item, width - 6);
    y = ensureSpace(doc, rowY, height + 2);
    if (y !== rowY) {
      rowY = y;
      col = 0;
      rowHeight = 0;
    }

    const x = MARGIN + (wide ? 0 : col * (colWidth + GAP));
    drawFactTile(doc, item, x, rowY, width, height);
    rowHeight = Math.max(rowHeight, height);

    if (wide || col === 1) flushRow();
    else col = 1;
  }

  if (col === 1) flushRow();
  return y;
}

function drawGroupTitle(doc: jsPDF, title: string, startY: number): number {
  let y = ensureSpace(doc, startY, 10);
  doc.setFont("DejaVu", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text(title.toUpperCase(), MARGIN, y);
  return y + 4;
}

function drawSummary(
  doc: jsPDF,
  response: CarSearchResponse,
  startY: number,
): number {
  const success = response.results.filter(
    (r) => r.status === "success" && r.records.length > 0,
  );
  const primary = success.find((r) => r.config.isPrimary) ?? success[0];
  const others = success.filter((r) => r !== primary);
  const summary = buildSummary(
    primary?.records[0],
    ...others.map((r) => r.records[0]),
  );
  if (!summary) return startY;

  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Overview banner
  y = ensureSpace(doc, y, 22);
  doc.setFillColor(...OK_BG);
  doc.roundedRect(MARGIN, y, pageWidth - MARGIN * 2, 18, 2.5, 2.5, "F");
  doc.setFont("DejaVu", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("QUICK OVERVIEW", MARGIN + 4, y + 6);
  doc.setFont("DejaVu", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...ACCENT);
  doc.text(String(summary.vehicleNumber ?? response.carNumber), MARGIN + 4, y + 13);
  const headline = [summary.manufacturer, summary.model, summary.year]
    .filter(Boolean)
    .join(" · ");
  if (headline) {
    doc.setFont("DejaVu", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(pdfText(headline), pageWidth - MARGIN - 4, y + 13, {
      align: "right",
    });
  }
  y += 24;

  const groups: Array<{ title: string; items: FactItem[] }> = [
    {
      title: "Vehicle",
      items: [
        {
          label: "Manufacturer",
          value: String(summary.manufacturer ?? ""),
          wide: true,
        },
        { label: "Model", value: String(summary.model ?? "") },
        { label: "Year", value: String(summary.year ?? "") },
        { label: "Ownership", value: String(summary.ownership ?? "") },
        { label: "Color", value: String(summary.color ?? "") },
      ],
    },
    {
      title: "Engine & fuel",
      items: [
        {
          label: "Displacement",
          value:
            summary.displacement != null && summary.displacement !== ""
              ? `${summary.displacement} cc`
              : "",
        },
        {
          label: "Horsepower",
          value:
            summary.horsepower != null && summary.horsepower !== ""
              ? `${summary.horsepower} HP`
              : "",
        },
        { label: "Engine", value: String(summary.engine ?? "") },
        { label: "Fuel", value: String(summary.fuel ?? "") },
      ],
    },
    {
      title: "Tests & license",
      items: [
        {
          label: "Last test mileage",
          value:
            summary.lastMileage != null && summary.lastMileage !== ""
              ? `${Number(summary.lastMileage).toLocaleString("en-US")} km`
              : "",
        },
        {
          label: "Avg. km / year",
          value:
            summary.avgKmPerYear != null && Number(summary.avgKmPerYear) > 0
              ? `${Number(summary.avgKmPerYear).toLocaleString("en-US")} km/year`
              : "",
        },
        { label: "Last test date", value: String(summary.lastTest ?? "") },
        { label: "Valid until", value: String(summary.validUntil ?? "") },
        {
          label: "Until next test",
          value:
            typeof summary.monthsToNextTest === "number"
              ? formatMonthsToNextTest(summary.monthsToNextTest)
              : "",
          wide: true,
          tone:
            typeof summary.monthsToNextTest === "number"
              ? summary.monthsToNextTest < 0
                ? "warn"
                : "ok"
              : "default",
        },
      ],
    },
  ];

  for (const group of groups) {
    const items = group.items.filter((i) => i.value);
    if (items.length === 0) continue;
    y = drawGroupTitle(doc, group.title, y);
    y = drawFactTiles(doc, items, y) + 3;
  }

  return y + 2;
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

function drawDataset(
  doc: jsPDF,
  result: DatasetResult,
  startY: number,
): number {
  let y = ensureSpace(doc, startY, 30);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...ACCENT);
  doc.roundedRect(MARGIN, y, pageWidth - MARGIN * 2, 11, 2, 2, "F");
  doc.setFont("DejaVu", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(
    pdfText(`${result.config.name}  ·  ${result.total} record${result.total === 1 ? "" : "s"}`),
    MARGIN + 3.5,
    y + 7,
  );
  y += 15;

  doc.setFont("DejaVu", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(pdfText(result.config.nameHe), MARGIN, y);
  y += 4;
  const split = doc.splitTextToSize(
    result.config.description,
    pageWidth - MARGIN * 2,
  );
  doc.text(split, MARGIN, y);
  y += split.length * 3.6 + 4;

  result.records.forEach((record, index) => {
    if (result.records.length > 1) {
      y = ensureSpace(doc, y, 12);
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(0.8);
      doc.line(MARGIN, y, MARGIN, y + 8);
      doc.setFont("DejaVu", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...ACCENT);
      doc.text(
        `ENTRY ${index + 1} OF ${result.records.length}`,
        MARGIN + 3,
        y + 3,
      );
      doc.setFont("DejaVu", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(pdfText(recordHeadline(record, index)), MARGIN + 3, y + 8);
      y += 12;
    }

    const { main, codes } = recordFacts(record);
    y = drawFactTiles(doc, main, y) + 2;
    if (codes.length > 0) {
      y = drawGroupTitle(doc, "Codes & references", y);
      y = drawFactTiles(doc, codes, y) + 2;
    }
    y += 4;
  });

  return y + 4;
}

async function loadTigerCircleDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}tiger.png`);
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const size = 160;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = Math.max(size / bitmap.width, size / bitmap.height) * 1.05;
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2 - h * 0.06, w, h);
    bitmap.close();
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function drawCreatorSignature(
  doc: jsPDF,
  startY: number,
  tigerDataUrl: string | null,
): number {
  let y = ensureSpace(doc, startY, 26);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 8;

  const avatar = 12;
  if (tigerDataUrl) {
    doc.addImage(tigerDataUrl, "PNG", MARGIN, y - 1, avatar, avatar);
  } else {
    doc.setFillColor(...ACCENT);
    doc.circle(MARGIN + avatar / 2, y - 1 + avatar / 2, avatar / 2, "F");
  }

  const textX = MARGIN + avatar + 4;
  doc.setFont("DejaVu", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text("Tiger", textX, y + 4);

  doc.setFont("DejaVu", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Designed & built by · Frontend engineer", textX, y + 9);

  return y + avatar + 6;
}

/** Build the vehicle report PDF (grouped fact tiles, matching the app UI). */
export async function buildCarReportPdf(
  response: CarSearchResponse,
): Promise<jsPDF> {
  const success = response.results.filter(
    (r) => r.status === "success" && r.records.length > 0,
  );

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const [, tigerDataUrl] = await Promise.all([
    registerFonts(doc),
    loadTigerCircleDataUrl(),
  ]);

  const generated = new Date(response.fetchedAt).toLocaleString("he-IL");
  addHeader(doc, response.carNumber, generated);

  let y = 36;
  doc.setFont("DejaVu", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `${success.length} source${success.length === 1 ? "" : "s"} with readable details`,
    MARGIN,
    y,
  );
  y += 8;

  y = drawSummary(doc, response, y);

  for (const result of success) {
    y = drawDataset(doc, result, y);
  }

  if (success.length === 0) {
    doc.setFont("DejaVu", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text("No dataset records were available for this plate.", MARGIN, y);
    y += 10;
  }

  drawCreatorSignature(doc, y + 2, tigerDataUrl);
  addFooters(doc);
  return doc;
}

/** Download the vehicle report as a multi-page PDF. */
export async function downloadCarReportPdf(
  response: CarSearchResponse,
): Promise<void> {
  const doc = await buildCarReportPdf(response);
  const raw = doc.output("blob");
  const blob =
    raw.type === "application/pdf"
      ? raw
      : new Blob([raw], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `vehicle-${response.carNumber}.pdf`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
