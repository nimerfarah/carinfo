import { FactField, FactGrid, FactGroup } from "@/components/FactGrid";
import { formatValue, getFieldLabel, shouldHideField } from "@/utils/formatters";
import type { CkanRecord } from "@/types/Dataset";

interface KeyValueViewProps {
  record: CkanRecord;
}

/** Fields customers usually care about first */
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

function sortEntries(entries: Array<[string, unknown]>): Array<[string, unknown]> {
  const priority = new Map(PRIORITY_KEYS.map((k, i) => [k, i]));
  return [...entries].sort(([a], [b]) => {
    const pa = priority.has(a) ? priority.get(a)! : 1000;
    const pb = priority.has(b) ? priority.get(b)! : 1000;
    if (pa !== pb) return pa - pb;
    if (isCodeKey(a) !== isCodeKey(b)) return isCodeKey(a) ? 1 : -1;
    return getFieldLabel(a).localeCompare(getFieldLabel(b));
  });
}

export function KeyValueView({ record }: KeyValueViewProps) {
  const entries = sortEntries(
    Object.entries(record).filter(
      ([key, value]) =>
        !shouldHideField(key) &&
        value !== null &&
        value !== undefined &&
        value !== "",
    ),
  );

  if (entries.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">No details available.</p>
    );
  }

  const main = entries.filter(([key]) => !isCodeKey(key));
  const codes = entries.filter(([key]) => isCodeKey(key));

  const renderFields = (items: Array<[string, unknown]>) =>
    items.map(([key, value]) => {
      const text = formatValue(
        key,
        value as string | number | boolean | null | undefined,
      );
      return (
        <FactField
          key={key}
          label={getFieldLabel(key)}
          value={text}
          wide={isWideValue(key, text)}
          emphasize={
            PRIORITY_KEYS.indexOf(key) >= 0 && PRIORITY_KEYS.indexOf(key) < 8
          }
        />
      );
    });

  return (
    <div className="space-y-6">
      <FactGrid>{renderFields(main)}</FactGrid>
      {codes.length > 0 ? (
        <FactGroup title="Codes & references">{renderFields(codes)}</FactGroup>
      ) : null}
    </div>
  );
}
