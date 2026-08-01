import type { DatasetConfig } from "@/types/Dataset";

/**
 * All Government CKAN datasets from:
 * https://car-check-il.netlify.app/guides/car-check-data-sources/
 *
 * Adding a new dataset: append an object below — no other code changes needed.
 */
export const DATASETS: DatasetConfig[] = [
  {
    id: "private-commercial-active",
    name: "Private & Commercial Vehicles",
    nameHe: "רישוי פרטי/מסחרי פעיל",
    resourceId: "053cea08-09bc-40ec-8f7a-156f0677aff3",
    description:
      "Active private and commercial vehicle licensing records (primary search source).",
    category: "licensing",
    icon: "car",
    isPrimary: true,
  },
  {
    id: "public-vehicles",
    name: "Public Vehicles",
    nameHe: "רכב ציבורי פעיל",
    resourceId: "cf29862d-ca25-4691-84f6-1be60dcb4a1e",
    description: "Active public transport and municipal vehicle licensing records.",
    category: "licensing",
    icon: "bus",
  },
  {
    id: "personal-import",
    name: "Personal Import Vehicles",
    nameHe: "ביבוא אישי",
    resourceId: "03adc637-b6fe-402b-9937-7c3d3afc9140",
    description: "Vehicles imported under personal import regulations.",
    category: "licensing",
    icon: "import",
  },
  {
    id: "inactive-with-model",
    name: "Inactive Vehicles (with Model Code)",
    nameHe: "לא פעיל + קוד דגם",
    resourceId: "f6efe89a-fb3d-43a4-bb61-9bf12a9b9099",
    description: "Inactive vehicles that include manufacturer/model codes.",
    category: "licensing",
    icon: "archive",
  },
  {
    id: "inactive-without-model",
    name: "Inactive Vehicles (without Model Code)",
    nameHe: "לא פעיל בלי קוד דגם",
    resourceId: "6f6acd03-f351-4a8f-8ecf-df792f4f573a",
    description: "Inactive vehicles without manufacturer/model codes.",
    category: "licensing",
    icon: "archive",
  },
  {
    id: "final-cancellation",
    name: "Final Cancellation",
    nameHe: "ביטול סופי",
    resourceId: "851ecab1-0622-4dbe-a6c7-f950cf82abf9",
    description: "Vehicles with final registration cancellation.",
    category: "licensing",
    icon: "ban",
  },
  {
    id: "disability-parking",
    name: "Disability Parking Tag",
    nameHe: "תג חניה לנכה",
    resourceId: "c8b9f9c8-4612-4068-934f-d4acd2e3c06e",
    description: "Vehicles issued a disability parking permit tag.",
    category: "accessibility",
    icon: "accessibility",
    plateField: "MISPAR RECHEV",
  },
  {
    id: "test-mileage-history",
    name: "Test Mileage History",
    nameHe: "ק״מ בטסט / היסטוריית טסטים",
    resourceId: "56063a99-8a3e-4ff4-912e-5966c0279bad",
    description:
      "Annual inspection (test) mileage history for private vehicles (typically 2017+).",
    category: "history",
    icon: "gauge",
  },
  {
    id: "ownership-history",
    name: "Ownership History",
    nameHe: "היסטוריית בעלות",
    resourceId: "bb2355dc-9ec7-4f06-9c3f-3344672171da",
    description:
      "Ownership transfer history for private vehicles (typically 2017+).",
    category: "history",
    icon: "users",
  },
  {
    id: "wltp-specs",
    name: "WLTP Model Specs",
    nameHe: "מפרט WLTP לפי דגם",
    resourceId: "142afde2-6228-49f9-8a29-9b6c3a0cbe40",
    description:
      "Model technical specs (engine cc, horsepower, WLTP emissions) keyed by manufacturer/model codes — not by plate.",
    category: "technical",
    icon: "leaf",
    enrichFrom: {
      sourceDatasetIds: [
        "private-commercial-active",
        "public-vehicles",
        "personal-import",
        "inactive-with-model",
      ],
      filterFields: ["tozeret_cd", "degem_cd"],
      preferMatchField: "shnat_yitzur",
    },
  },
  {
    id: "outstanding-recalls",
    name: "Outstanding Recalls",
    nameHe: "רכבים שלא ביצעו ריקול",
    resourceId: "36bf1404-0be4-49d2-82dc-2f1ead4a8b93",
    description:
      "Vehicles with outstanding (uncompleted) safety recalls, keyed by MISPAR_RECHEV. Shown only when records exist.",
    category: "safety",
    icon: "alert",
    plateField: "MISPAR_RECHEV",
  },
  {
    id: "recall-catalog",
    name: "Recall Catalog",
    nameHe: "קטלוג קריאות שירות",
    resourceId: "2c33523f-87aa-44ec-a736-edbb0a82975e",
    description:
      "Service recall catalog (primarily keyed by RECALL_ID; may return empty for plate-only search).",
    category: "safety",
    icon: "clipboard",
    enrichFrom: {
      sourceDatasetIds: ["outstanding-recalls"],
      filterFields: ["RECALL_ID"],
    },
  },
];

export const DATASET_BY_ID = Object.fromEntries(
  DATASETS.map((d) => [d.id, d]),
) as Record<string, DatasetConfig>;

export const PRIMARY_DATASET =
  DATASETS.find((d) => d.isPrimary) ?? DATASETS[0];
