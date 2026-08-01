import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export function LoadingCard({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <Card className="overflow-hidden p-5">
        <div className="flex items-start gap-3">
          <div className="size-10 shrink-0 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/5 animate-pulse rounded-md bg-[var(--surface-elevated)]" />
            <div className="h-3 w-4/5 animate-pulse rounded-md bg-[var(--surface-elevated)]" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full animate-pulse rounded-md bg-[var(--surface-elevated)]" />
              <div className="h-3 w-5/6 animate-pulse rounded-md bg-[var(--surface-elevated)]" />
              <div className="h-3 w-3/4 animate-pulse rounded-md bg-[var(--surface-elevated)]" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function LoadingGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }, (_, i) => (
        <LoadingCard key={i} index={i} />
      ))}
    </div>
  );
}
