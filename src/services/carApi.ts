import axios, { AxiosError, type AxiosInstance } from "axios";
import { DATASETS } from "@/config/datasets";
import type {
  CarSearchResponse,
  CkanRecord,
  CkanSearchResult,
  DatasetConfig,
  DatasetResult,
} from "@/types/Dataset";
import { normalizeCarNumber } from "@/utils/formatters";

const REQUEST_TIMEOUT_MS = 20_000;
const RECORD_LIMIT = 100;

/**
 * Call data.gov.il directly — the API sends `Access-Control-Allow-Origin: *`.
 * Prefer the browser path over a Vite Node proxy: on corporate networks Node DNS
 * often cannot resolve data.gov.il, while the system/browser proxy can.
 */
const API_BASE = "https://data.gov.il/api/3/action/datastore_search";

const client: AxiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
});

export async function fetchDataset(
  resourceId: string,
  carNumber: string,
  signal?: AbortSignal,
): Promise<{ records: CkanRecord[]; total: number }> {
  const q = normalizeCarNumber(carNumber);

  const { data } = await client.get<CkanSearchResult>(API_BASE, {
    params: {
      resource_id: resourceId,
      q,
      limit: RECORD_LIMIT,
    },
    signal,
  });

  if (!data?.success || !data.result) {
    throw new Error("Unexpected response from data.gov.il");
  }

  const raw = data.result.records ?? [];
  const records = filterExactPlate(raw, q);

  return {
    records,
    total: records.length,
  };
}

export async function fetchDatasetByFilters(
  resourceId: string,
  filters: Record<string, string | number>,
  signal?: AbortSignal,
): Promise<{ records: CkanRecord[]; total: number }> {
  const { data } = await client.get<CkanSearchResult>(API_BASE, {
    params: {
      resource_id: resourceId,
      filters: JSON.stringify(filters),
      limit: RECORD_LIMIT,
    },
    signal,
  });

  if (!data?.success || !data.result) {
    throw new Error("Unexpected response from data.gov.il");
  }

  const records = data.result.records ?? [];
  return {
    records,
    total: data.result.total ?? records.length,
  };
}

/** Known plate-number field variants across government datasets */
const PLATE_FIELDS = [
  "mispar_rechev",
  "MISPAR_RECHEV",
  "MISPAR RECHEV",
  "mispar rechev",
] as const;

function getPlateValue(record: CkanRecord): string {
  for (const field of PLATE_FIELDS) {
    const value = record[field];
    if (value !== null && value !== undefined && value !== "") {
      return String(value).replace(/\D/g, "");
    }
  }
  // Fallback: any key that looks like mispar/rechev
  for (const [key, value] of Object.entries(record)) {
    if (/mispar.*rechev|rechev.*mispar/i.test(key) && value != null && value !== "") {
      return String(value).replace(/\D/g, "");
    }
  }
  return "";
}

/** CKAN `q` is full-text; keep only rows whose plate field equals the search. */
function filterExactPlate(records: CkanRecord[], plate: string): CkanRecord[] {
  const hasPlateField = records.some((r) => getPlateValue(r) !== "");
  if (!hasPlateField) return records;

  return records.filter((r) => getPlateValue(r) === plate);
}

function toErrorMessage(error: unknown): string {
  if (axios.isCancel(error) || (error as AxiosError)?.code === "ERR_CANCELED") {
    return "Request cancelled";
  }
  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED") return "Request timed out";
    if (error.response) return `HTTP ${error.response.status}`;
    if (error.request) return "Network error";
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

async function fetchOne(
  config: DatasetConfig,
  carNumber: string,
  signal?: AbortSignal,
): Promise<DatasetResult> {
  try {
    const { records, total } = await fetchDataset(
      config.resourceId,
      carNumber,
      signal,
    );

    if (!records.length || total === 0) {
      return { config, status: "empty", records: [], total: 0 };
    }

    return { config, status: "success", records, total };
  } catch (error) {
    return {
      config,
      status: "error",
      records: [],
      total: 0,
      error: toErrorMessage(error),
    };
  }
}

function findEnrichmentSource(
  config: DatasetConfig,
  results: DatasetResult[],
): CkanRecord | undefined {
  const enrichment = config.enrichFrom;
  if (!enrichment) return undefined;

  const preferred = enrichment.sourceDatasetIds ?? [];
  const ordered: DatasetResult[] = [];
  for (const id of preferred) {
    const match = results.find((r) => r.config.id === id && r.status === "success");
    if (match) ordered.push(match);
  }
  for (const result of results) {
    if (result.status === "success" && !ordered.includes(result)) {
      ordered.push(result);
    }
  }

  for (const result of ordered) {
    const record = result.records[0];
    if (!record) continue;
    const hasAll = enrichment.filterFields.every((field) => {
      const value = record[field];
      return value !== null && value !== undefined && value !== "";
    });
    if (hasAll) return record;
  }
  return undefined;
}

function buildFiltersFromRecord(
  config: DatasetConfig,
  source: CkanRecord,
): Record<string, string | number> | null {
  const enrichment = config.enrichFrom;
  if (!enrichment) return null;

  const filters: Record<string, string | number> = {};
  for (const field of enrichment.filterFields) {
    const value = source[field];
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "boolean") continue;
    filters[field] = value;
  }

  return Object.keys(filters).length ? filters : null;
}

function preferMatchingYear(
  records: CkanRecord[],
  source: CkanRecord,
  preferMatchField?: string,
): CkanRecord[] {
  if (!preferMatchField || !records.length) return records;
  const target = source[preferMatchField];
  if (target === null || target === undefined || target === "") return records;

  const matched = records.filter(
    (r) => String(r[preferMatchField]) === String(target),
  );
  return matched.length ? matched : records;
}

async function enrichEmptyDatasets(
  results: DatasetResult[],
  signal?: AbortSignal,
): Promise<DatasetResult[]> {
  const enrichable = results.filter(
    (r) =>
      r.config.enrichFrom &&
      (r.status === "empty" || r.status === "error") &&
      r.records.length === 0,
  );

  if (!enrichable.length) return results;

  const enriched = await Promise.all(
    enrichable.map(async (result) => {
      const source = findEnrichmentSource(result.config, results);
      if (!source) return result;

      const filters = buildFiltersFromRecord(result.config, source);
      if (!filters) return result;

      try {
        const { records } = await fetchDatasetByFilters(
          result.config.resourceId,
          filters,
          signal,
        );
        const preferred = preferMatchingYear(
          records,
          source,
          result.config.enrichFrom?.preferMatchField,
        );

        if (!preferred.length) return result;

        return {
          config: result.config,
          status: "success" as const,
          records: preferred,
          total: preferred.length,
        };
      } catch {
        // Enrichment is best-effort — keep the original empty/error state
        return result;
      }
    }),
  );

  const byId = new Map(enriched.map((r) => [r.config.id, r]));
  return results.map((r) => byId.get(r.config.id) ?? r);
}

/**
 * Query every configured Government dataset in parallel.
 * Individual failures never abort the rest (Promise.allSettled).
 * Datasets with `enrichFrom` (e.g. WLTP model specs) are filled in a
 * second pass using manufacturer/model codes from licensing results.
 */
export async function fetchAllDatasets(
  carNumber: string,
  signal?: AbortSignal,
): Promise<CarSearchResponse> {
  const normalized = normalizeCarNumber(carNumber);

  const settled = await Promise.allSettled(
    DATASETS.map((dataset) => fetchOne(dataset, normalized, signal)),
  );

  let results: DatasetResult[] = settled.map((outcome, index) => {
    if (outcome.status === "fulfilled") return outcome.value;

    return {
      config: DATASETS[index],
      status: "error" as const,
      records: [],
      total: 0,
      error: toErrorMessage(outcome.reason),
    };
  });

  results = await enrichEmptyDatasets(results, signal);

  return {
    carNumber: normalized,
    results,
    fetchedAt: new Date().toISOString(),
  };
}
