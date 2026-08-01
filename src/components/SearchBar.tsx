import { useEffect, useId, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { History, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SearchHistoryItem } from "@/types/Dataset";
import { normalizeCarNumber } from "@/utils/formatters";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value?: string) => void;
  isLoading: boolean;
  history: SearchHistoryItem[];
  onClearHistory: () => void;
  validationError: string | null;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  isLoading,
  history,
  onClearHistory,
  validationError,
}: SearchBarProps) {
  const inputId = useId();
  const [debouncedHint, setDebouncedHint] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      const n = normalizeCarNumber(value);
      setDebouncedHint(n.length > 0 && n.length < 5 ? "Need at least 5 digits" : "");
    }, 300);
    return () => clearTimeout(t);
  }, [value]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card mx-auto w-full max-w-xl rounded-3xl p-6 sm:p-8"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--muted-foreground)]"
        >
          Vehicle Number
        </label>
        <div className="relative">
          <Input
            id={inputId}
            inputMode="numeric"
            autoComplete="off"
            placeholder="55555555"
            value={value}
            onChange={(e) =>
              onChange(e.target.value.replace(/[^\d\s\-]/g, ""))
            }
            aria-invalid={Boolean(validationError)}
            aria-describedby={
              validationError || debouncedHint ? `${inputId}-hint` : undefined
            }
            className="pe-12 font-[family-name:var(--font-display)] text-center text-2xl font-semibold tabular-nums"
            maxLength={10}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              aria-label="Clear"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {(validationError || debouncedHint) && (
          <p
            id={`${inputId}-hint`}
            className="text-sm text-amber-600 dark:text-amber-400"
            role="alert"
          >
            {validationError || debouncedHint}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full sm:w-auto sm:self-center sm:min-w-[180px]"
        >
          {isLoading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Searching…
            </>
          ) : (
            <>
              <Search className="size-4" />
              Search
            </>
          )}
        </Button>
      </form>

      {history.length > 0 && (
        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]">
              <History className="size-4" />
              Previous Searches
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="text-[var(--muted)]"
            >
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {history.map((item) => (
              <li key={`${item.carNumber}-${item.searchedAt}`}>
                <button
                  type="button"
                  onClick={() => onSearch(item.carNumber)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-2 font-[family-name:var(--font-display)] text-sm font-semibold tabular-nums transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {item.carNumber}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
}
