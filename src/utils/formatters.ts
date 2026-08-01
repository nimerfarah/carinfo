/**
 * Field label translations (Hebrew government field names → readable labels).
 * Unknown fields fall back to a humanized key.
 */
const FIELD_LABELS: Record<string, string> = {
  // Common plate / id
  mispar_rechev: "Vehicle Number",
  MISPAR_RECHEV: "Vehicle Number",
  _id: "Record ID",

  // Manufacturer / model
  tozeret_nm: "Manufacturer",
  tozeret_cd: "Manufacturer Code",
  tozeret_eretz_nm: "Country of Manufacture",
  degem_nm: "Model",
  degem_cd: "Model Code",
  kinuy_mishari: "Commercial Name",
  shnat_yitzur: "Year",
  zmig_kidmi: "Front Tire",
  zmig_ahori: "Rear Tire",

  // Technical
  mispar_shilda: "Chassis Number",
  misgeret: "Chassis Number",
  mispar_manoa: "Engine Number",
  degem_manoa: "Engine Model",
  delek_nm: "Fuel Type",
  nefah_manoa: "Engine Displacement (cc)",
  nefach_manoa: "Engine Displacement (cc)",
  koah_sus: "Horsepower",
  mishkal_kolel: "Total Weight (kg)",
  mispar_moshavim: "Seats",
  mispar_dlatot: "Doors",
  hanaa_nm: "Drivetrain",
  automatic_ind: "Automatic Transmission",
  merkav: "Body Type",
  CO2_WLTP: "CO₂ (WLTP)",
  madad_yarok: "Green Score",
  horaat_rishum: "Registration Order",
  ramat_gimur: "Trim Level",
  ramat_eivzur_betihuty: "Safety Equipment Level",
  kvutzat_zihum: "Pollution Group",
  sug_delek_nm: "Fuel Type",
  sug_degem: "Model Type",
  moed_aliya_lakvish: "Road Registration Date",
  mivchan_acharon_dt: "Last Test Date",
  tokef_dt: "License Valid Until",
  baalut: "Ownership",
  sug_baalut: "Ownership Type",
  tzeva_rechev: "Color",
  tzeva_cd: "Color Code",
  sug_rechev_nm: "Vehicle Type",
  mishkal_azmi: "Curb Weight (kg)",
  mispar_mekomot: "Seats",
  hybrid_ind: "Hybrid",
  elektric_ind: "Electric",
  matzav_rechev: "Vehicle Status",
  shinui_mivne_ind: "Structural Change",
  gapam_ind: "Body Repair Flag",
  shnui_zeva_ind: "Color Change",
  shinui_zmig_ind: "Tire Change",
  rishum_rishon_dt: "First Registration Date",

  // Import
  sug_yevu: "Import Type",
  yevuan_nm: "Importer",

  // Test / mileage
  kilometraz: "Mileage (km)",
  kilometer_test_aharon: "Last Test Mileage",
  test_date: "Test Date",
  moed_test: "Test Date",
  km: "Mileage (km)",
  date_test: "Test Date",
  sug_test: "Test Type",

  // Ownership history
  baalut_dt: "Ownership Date",
  sug_baalut_nm: "Ownership",
  ownership_date: "Ownership Date",
  moed_aliya_labaalut: "Ownership Date",

  // Disability parking tag (field names include spaces)
  "MISPAR RECHEV": "Vehicle Number",
  "TAARICH HAFAKAT TAG": "Tag Issue Date",
  "SUG TAV": "Tag Type",
  SUG_TAV: "Tag Type",

  // Disability (legacy snake_case labels)
  sug_tag: "Tag Type",
  taarich_hafakat_tag: "Tag Issue Date",
  taarich_tokef: "Tag Valid Until",

  // Recall
  RECALL_ID: "Recall ID",
  recall_id: "Recall ID",
  TOZERET_CD: "Manufacturer Code",
  DEGEM_CD: "Model Code",
  SHNAT_YITZUR: "Year",
  TEUR_RECALL: "Recall Description",
  SUG_RECALL: "Recall Type",
  TAARICH_PTICHA: "Open Date",
  TAARICH_SGIRA: "Close Date",
  MISPAR_RIKUZ: "Recall Batch Number",

  // WLTP
  tzinur_co2: "CO₂ Emissions",
  tzinur_no: "NOx Emissions",
  tzinur_pm: "PM Emissions",
  tzinur_thc: "THC Emissions",
  tzinur_nmhc: "NMHC Emissions",
  tzrichat_delek: "Fuel Consumption",
  tzrichat_hashmal: "Electric Consumption",
  טווח_נסיעה: "Range (km)",

  // Cancellation / inactive
  bitul_dt: "Cancellation Date",
  sibbat_bitul: "Cancellation Reason",
  taarich_bitul: "Cancellation Date",
};

const HIDDEN_FIELDS = new Set(["_id", "_full_count", "rank"]);

/** Prefer Hebrew labels when the field is already Hebrew text */
export function getFieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  // Already human-readable Hebrew or spaced text
  if (/[\u0590-\u05FF]/.test(key) || key.includes(" ")) return key;
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function shouldHideField(key: string): boolean {
  return HIDDEN_FIELDS.has(key);
}

/** Detect YYYYMMDD / YYYY-MM-DD / YYYYMM / ISO-ish dates */
function looksLikeDate(value: string | number): boolean {
  const s = String(value).trim();
  if (/^\d{8}$/.test(s)) return true;
  if (/^\d{6}$/.test(s) && Number(s.slice(4, 6)) <= 12) return true;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return true;
  if (/^\d{4}\/\d{2}\/\d{2}/.test(s)) return true;
  return false;
}

function formatDateValue(value: string | number): string {
  const s = String(value).trim();

  if (/^\d{8}$/.test(s)) {
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    const d = s.slice(6, 8);
    return `${d}/${m}/${y}`;
  }

  if (/^\d{6}$/.test(s)) {
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    return `${m}/${y}`;
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return s;
}

/** IDs / codes that must never be parsed as dates (e.g. plate 12869403 → 03/94/1286). */
function isNonDateField(key: string): boolean {
  return /mispar|rechev|degem_cd|tozeret_cd|manoa|shilda|misgeret|recall|horaat|rank|_id|tzeva_cd|kvutzat|ramat_eivzur/i.test(
    key,
  );
}

function formatBoolean(value: unknown): string | null {
  if (value === true || value === "true" || value === "True") return "Yes";
  if (value === false || value === "false" || value === "False") return "No";
  if (value === 1 || value === "1") return "Yes";
  if (value === 0 || value === "0") return "No";
  return null;
}

const BOOLEANISH_KEYS = new Set([
  "automatic_ind",
  "hybrid_ind",
  "elektric_ind",
  "abs_ind",
  "airbag_ind",
]);

export function formatValue(
  key: string,
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (BOOLEANISH_KEYS.has(key) || typeof value === "boolean") {
    const bool = formatBoolean(value);
    if (bool) return bool;
  }

  if (
    (value === 0 || value === 1 || value === "0" || value === "1") &&
    /(_ind|_flag|is_|has_)/i.test(key)
  ) {
    return formatBoolean(value) ?? String(value);
  }

  // Plate numbers, engine numbers, model codes, etc.
  if (isNonDateField(key)) {
    if (typeof value === "number") {
      // Keep plates/codes exact — no thousands separators, no date parsing
      if (/mispar_rechev|MISPAR_RECHEV|MISPAR RECHEV/i.test(key)) {
        return String(value);
      }
      return new Intl.NumberFormat("he-IL").format(value);
    }
    return String(value).trim();
  }

  if (typeof value === "number") {
    if (looksLikeDate(value) && String(value).length >= 6) {
      return formatDateValue(value);
    }
    return new Intl.NumberFormat("he-IL").format(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (looksLikeDate(trimmed) && /date|dt|moed|taarich|tokef/i.test(key)) {
      return formatDateValue(trimmed);
    }
    // Only auto-date plain 8-digit strings when the field name suggests a date
    if (
      looksLikeDate(trimmed) &&
      /^\d{8}$/.test(trimmed) &&
      /date|dt|moed|taarich|tokef/i.test(key)
    ) {
      return formatDateValue(trimmed);
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed) && !looksLikeDate(trimmed)) {
      const n = Number(trimmed);
      if (!Number.isNaN(n) && Math.abs(n) >= 1000) {
        return new Intl.NumberFormat("he-IL").format(n);
      }
    }
    return trimmed;
  }

  return String(value);
}

export function normalizeCarNumber(input: string): string {
  return input.replace(/[\s\-–—]/g, "").trim();
}

export function isValidCarNumber(input: string): boolean {
  const n = normalizeCarNumber(input);
  return /^\d{5,8}$/.test(n);
}

/** Parse common Israeli open-data date shapes into a Date at local midnight. */
export function parseFlexibleDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const s = String(value).trim();

  if (/^\d{8}$/.test(s)) {
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(4, 6));
    const d = Number(s.slice(6, 8));
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // YYYY-M or YYYY-MM
  const ym = s.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) {
    const dt = new Date(Number(ym[1]), Number(ym[2]) - 1, 1);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // YYYY-MM-DD… or YYYY/MM/DD…
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymd) {
    const dt = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Whole calendar months from `from` to `to` (can be negative). */
export function calendarMonthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) -
    (to.getDate() < from.getDate() ? 1 : 0)
  );
}

/**
 * Next test / license deadline:
 * prefer official tokef_dt; otherwise last test + 12 months.
 */
export function resolveNextTestDate(
  validUntil: unknown,
  lastTest: unknown,
): Date | null {
  const fromTokef = parseFlexibleDate(validUntil);
  if (fromTokef) return fromTokef;

  const last = parseFlexibleDate(lastTest);
  if (!last) return null;
  const next = new Date(last);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function formatMonthsToNextTest(months: number): string {
  if (months > 1) return `${months} months left`;
  if (months === 1) return "1 month left";
  if (months === 0) return "Due this month";
  if (months === -1) return "Overdue by 1 month";
  return `Overdue by ${Math.abs(months)} months`;
}

export function computeAvgKmPerYear(
  mileage: unknown,
  year: unknown,
  firstRegistration: unknown,
): number | null {
  const km = Number(String(mileage ?? "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(km) || km < 0) return null;

  let start = parseFlexibleDate(firstRegistration);
  if (!start) {
    const y = Number(year);
    if (Number.isFinite(y) && y >= 1900 && y <= 2100) {
      start = new Date(y, 0, 1);
    }
  }
  if (!start) return null;

  const now = new Date();
  if (start > now) return null;

  const years = Math.max(
    (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    1 / 12,
  );
  return Math.round(km / years);
}

/** Pick summary fields from one or more vehicle records (later records fill gaps). */
export function buildSummary(
  ...records: Array<Record<string, unknown> | undefined>
) {
  const merged: Record<string, unknown> = {};
  for (const record of records) {
    if (!record) continue;
    for (const [key, value] of Object.entries(record)) {
      if (
        (merged[key] === undefined ||
          merged[key] === null ||
          merged[key] === "") &&
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        merged[key] = value;
      }
    }
  }

  if (!Object.keys(merged).length) return null;

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = merged[k];
      if (v !== null && v !== undefined && v !== "") return v;
    }
    return undefined;
  };

  const lastTest = pick("mivchan_acharon_dt");
  const validUntil = pick("tokef_dt");
  const lastMileage = pick("kilometer_test_aharon", "kilometraz");
  const year = pick("shnat_yitzur", "SHNAT_YITZUR");
  const firstRegistration = pick(
    "moed_aliya_lakvish",
    "rishum_rishon_dt",
  );

  const nextTestDate = resolveNextTestDate(validUntil, lastTest);
  const monthsToNextTest =
    nextTestDate != null
      ? calendarMonthsBetween(new Date(), nextTestDate)
      : undefined;

  const avgKmPerYear = computeAvgKmPerYear(
    lastMileage,
    year,
    firstRegistration,
  );

  return {
    vehicleNumber: pick(
      "mispar_rechev",
      "MISPAR_RECHEV",
      "MISPAR RECHEV",
    ),
    manufacturer: pick("tozeret_nm", "TOZERET_NM", "tozar"),
    model: pick("kinuy_mishari", "degem_nm", "DEGEM_NM", "ramat_gimur"),
    year,
    ownership: pick("baalut", "sug_baalut", "sug_baalut_nm"),
    engine: pick("mispar_manoa", "MISPAR_MANOA", "degem_manoa"),
    displacement: pick("nefah_manoa", "nefach_manoa"),
    horsepower: pick("koah_sus"),
    color: pick("tzeva_rechev", "TZEVA_RECHEV"),
    fuel: pick("delek_nm", "sug_delek_nm", "DELEK_NM"),
    chassis: pick("misgeret", "mispar_shilda", "shilda"),
    lastTest,
    validUntil,
    lastMileage,
    monthsToNextTest,
    avgKmPerYear: avgKmPerYear ?? undefined,
  };
}
