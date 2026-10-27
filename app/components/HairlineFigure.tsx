"use client";

import React from "react";

// Host for a Hairline figure (isometric line drawing that answers the pointer).
// The engine lives unchanged in /public/hairline/kernel.js and sets window.HL;
// each figure is a script in /public/hairline/<name>.js that ends with
// hairline({ name, means, range, tour, mount }). This component plays the
// part of the skill's bench: it mounts the figure, shows its read-out, and
// walks its tour until a real pointer arrives.

type Stop = [number, number] | null;
type Figure = {
  name: string;
  means: string;
  range: [number, number, number];
  tour: Stop[] | null;
  mount: (
    host: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string } },
    value: number,
  ) => { set: (v: number) => void; destroy: () => void };
};
type HL = {
  inject: (root: Document) => void;
  mk: (tag: string, attrs: Record<string, string>, parent: Element) => SVGSVGElement;
  tour: (stage: HTMLElement, stops: Stop[], onStop?: (i: number) => void) => { stop: () => void };
  reducedMotion: () => boolean;
  LAP: Stop[];
};

let kernel: Promise<HL> | null = null;
const sources = new Map<string, Promise<string>>();

function loadKernel(): Promise<HL> {
  const w = window as unknown as { HL?: HL };
  if (w.HL) return Promise.resolve(w.HL);
  kernel ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/hairline/kernel.js";
    s.onload = () => (w.HL ? resolve(w.HL) : reject(new Error("hairline kernel did not load")));
    s.onerror = () => { kernel = null; reject(new Error("hairline kernel did not load")); };
    document.head.appendChild(s);
  });
  return kernel;
}

// The figure is run in its own function scope, so mounting it twice (Strict
// Mode, navigating back) never redeclares its top-level constants
async function loadFigure(name: string, hl: HL): Promise<Figure> {
  if (!sources.has(name)) sources.set(name, fetch(`/hairline/${name}.js`).then((r) => r.text()));
  const src = await sources.get(name)!;
  let figure: Figure | null = null;
  new Function("HL", "hairline", src)(hl, (f: Figure) => { figure = f; });
  if (!figure) throw new Error(`hairline figure ${name} did not declare itself`);
  return figure;
}

export default function HairlineFigure({
  name,
  autoplay = true,
  onRead,
  className = "",
  style,
  restFlow,
  coin,
}: {
  name: string;
  autoplay?: boolean;
  onRead?: (text: string) => void;
  className?: string;
  style?: React.CSSProperties;
  // Figures that support it (tide) rest on this value instead of their own; read once at mount
  restFlow?: number;
  // Figures that draw an asset (mint) show this one: "btc", "eth" or "sol"; read once at mount
  coin?: string;
}) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [means, setMeans] = React.useState<string>("");
  const onReadRef = React.useRef(onRead);
  React.useEffect(() => {
    onReadRef.current = onRead;
  }, [onRead]);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    let handle: { destroy: () => void } | null = null;
    let lap: { stop: () => void } | null = null;

    (async () => {
      const hl = await loadKernel();
      const figure = await loadFigure(name, hl);
      if (cancelled) return;
      hl.inject(document);
      stage.setAttribute("data-hairline", figure.name);
      const svg = hl.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
      let text = "rest";
      const read = {
        get textContent() { return text; },
        set textContent(v: string) { text = v == null ? "" : String(v); onReadRef.current?.(text); },
      };
      handle = figure.mount({ stage, svg, read }, figure.range[1]);
      onReadRef.current?.(text);
      setMeans(figure.means);
      if (autoplay && !hl.reducedMotion()) lap = hl.tour(stage, figure.tour ?? hl.LAP);
    })().catch((e) => console.error(e));

    return () => {
      cancelled = true;
      lap?.stop();
      handle?.destroy();
      stage.replaceChildren();
    };
  }, [name, autoplay]);

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label={means || undefined}
      data-flow={restFlow}
      data-coin={coin}
      className={className}
      style={style}
    />
  );
}
