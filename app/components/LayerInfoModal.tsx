"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "@phosphor-icons/react";

// A small explainer for one signal layer on the dashboard (flash news, Reddit,
// funding, fear & greed): what it is in plain words, how it's calculated, what
// it reads right now and what it adds to the blend. Esc, the backdrop or the
// close button dismiss it; page scroll is locked while it's open and focus
// returns to the card that opened it.

export type LayerInfo = {
  tag: string;
  name: string;
  color: string;
  /** Share of the blended score, 0..1 */
  weight: number;
  /** Current layer score, -100..+100 */
  score: number;
  what: string;
  how: string[];
  formula: string;
  now: { label: string; value: React.ReactNode }[];
  read: string;
};

const EASE = [0.32, 0.72, 0, 1] as const;
const sign = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}`;
const sign1 = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;

export default function LayerInfoModal({ layer, onClose }: { layer: LayerInfo | null; onClose: () => void }) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!layer) return;
    const opener = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [layer, onClose]);

  // one decimal: small layers at low weight would otherwise round to "0 pts"
  const contribution = layer ? Math.round(layer.score * layer.weight * 10) / 10 : 0;
  const pos = layer ? ((Math.max(-100, Math.min(100, layer.score)) + 100) / 200) * 100 : 50;

  return (
    <AnimatePresence>
      {layer && (
        <motion.div
          key="layer-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          <button aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-[3px] cursor-default" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="ed-bento relative w-full max-w-[520px] max-h-[85dvh] overflow-y-auto ed-scroll p-6 md:p-7 shadow-[0_22px_50px_-16px_rgba(0,0,0,0.75)]"
            initial={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="ed-eyebrow flex items-center gap-2">
                  <span className="ed-square" style={{ background: layer.color }} />
                  {layer.tag} · {Math.round(layer.weight * 100)}% of the blend
                </span>
                <h2 id={titleId} className="mt-2 text-[22px] font-medium tracking-[-0.025em] text-white">
                  {layer.name}
                </h2>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close"
                className="ed-chip ed-press size-8 shrink-0 flex items-center justify-center text-[var(--ed-fg-70)] hover:text-white cursor-pointer"
              >
                <X size={13} weight="bold" />
              </button>
            </div>

            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ed-fg-70)]">{layer.what}</p>

            {/* Right now: the score on its scale, then the raw readings */}
            <section className="mt-6">
              <h3 className="ed-micro">Right now</h3>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <span className="font-mono text-[34px] leading-none tabular-nums text-white">{sign(layer.score)}</span>
                <span className="text-[13px] text-[var(--ed-fg-55)] text-right">
                  adds <span className="font-mono text-white">{sign1(contribution)}</span> pts to the blended score
                </span>
              </div>
              <div className="relative mt-4 h-1.5 rounded-full bg-white/[0.06]" aria-hidden>
                <span className="absolute left-1/2 top-[-3px] h-3 w-px bg-white/25" />
                <span
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F28C45] shadow-[0_0_0_3px_#131314]"
                  style={{ left: `${pos}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ed-fg-30)]">
                <span>−100 bearish</span>
                <span>0</span>
                <span>+100 bullish</span>
              </div>
              <dl className="mt-4 text-[14px] divide-y divide-[var(--ed-border)] border-t border-[var(--ed-border)]">
                {layer.now.map((r) => (
                  <div key={r.label} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-[var(--ed-fg-55)]">{r.label}</dt>
                    <dd className="font-mono text-[13px] tabular-nums text-[var(--ed-fg-90)] text-right">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-6">
              <h3 className="ed-micro">How it&apos;s calculated</h3>
              <ol className="mt-3 space-y-2 text-[14px] leading-relaxed text-[var(--ed-fg-70)]">
                {layer.how.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-[11px] text-[var(--ed-fg-30)] pt-[3px]">{String(i + 1).padStart(2, "0")}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <code className="mt-3 block rounded-lg bg-[#0c0c0d] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[var(--ed-fg-70)] shadow-[inset_0_0_0_1px_var(--ed-border)]">
                {layer.formula}
              </code>
            </section>

            <section className="mt-6">
              <h3 className="ed-micro">How to read it</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ed-fg-70)]">{layer.read}</p>
            </section>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
