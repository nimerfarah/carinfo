import { motion } from "framer-motion";

/**
 * Creator signature — Tiger
 */
export function CreatorSignature() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-8 max-w-md"
    >
      <div className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

      <div className="glass-card flex flex-col items-center gap-3 rounded-2xl px-6 py-5 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
          Designed &amp; built by
        </p>

        <div className="flex items-center gap-3">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-full shadow-lg shadow-[var(--accent)]/25 ring-2 ring-[var(--accent)]/30">
            <img
              src={`${import.meta.env.BASE_URL}tiger.png`}
              alt="Tiger"
              width={48}
              height={48}
              className="size-full scale-105 object-cover object-[center_20%]"
            />
          </span>

          <div className="text-start leading-tight">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--foreground)] sm:text-xl">
              Tiger
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Frontend engineer · Israel vehicle open data
            </p>
          </div>
        </div>

        <p className="max-w-xs text-[11px] leading-relaxed text-[var(--muted)]">
          Crafted with care — parallel government data, clean UI, and practical
          reports for every plate search.
        </p>
      </div>
    </motion.div>
  );
}
