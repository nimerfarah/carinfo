export interface DatasetEnrichment {
  /**
   * Prefer pulling filter values from these dataset ids (in order).
   * Falls back to any successful result that contains the filter fields.
   */
  sourceDatasetIds?: string[];
  /** CKAN filter keys copied from a plate/licensing record (e.g. tozeret_cd, degem_cd) */
  filterFields: string[];
  /**
   * When set, prefer enriched rows whose value equals the source record
   * (e.g. match shnat_yitzur). If none match, keep all filtered rows.
   */
  preferMatchField?: string;
}

export interface DatasetConfig {
  id: string;
  name: string;
  nameHe: string;
  resourceId: string;
  description: string;
  category: DatasetCategory;
  icon: DatasetIconName;
  /** When true, this dataset is preferred for the summary card */
  isPrimary?: boolean;
  /** Field used as plate number when filtering (defaults to q=) */
  plateField?: string;
  /**
   * Secondary lookup when plate search returns empty.
   * Used for model catalogs (WLTP) keyed by manufacturer/model codes.
   */
  enrichFrom?: DatasetEnrichment;
}


export type DatasetCategory =
  | "licensing"
  | "history"
  | "safety"
  | "technical"
  | "accessibility";

export type DatasetIconName =
  | "car"
  | "bus"
  | "import"
  | "archive"
  | "ban"
  | "accessibility"
  | "gauge"
  | "users"
  | "leaf"
  | "alert"
  | "clipboard";

export interface CkanRecord {
  [key: string]: string | number | boolean | null | undefined;
}

export interface CkanSearchResult {
  success: boolean;
  result: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
    records: CkanRecord[];
    total: number;
  };
}

export type DatasetStatus = "success" | "empty" | "error";

export interface DatasetResult {
  config: DatasetConfig;
  status: DatasetStatus;
  records: CkanRecord[];
  total: number;
  error?: string;
}

export interface CarSearchResponse {
  carNumber: string;
  results: DatasetResult[];
  fetchedAt: string;
}

export interface SearchHistoryItem {
  carNumber: string;
  searchedAt: string;
}
