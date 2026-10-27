"use client";

import React from "react";

// Faint falling-glyph backdrop for the landing hero. Transparent canvas (cleared
// every frame, no black fade-wash) so it sits on the page surface; each column
// is a short trail that brightens at its head. Throttled to ~24fps, paused
// offscreen, and a single still frame under reduced motion.

const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾙﾚﾛﾜ0123456789₿Ξ◎ÐŁ$+−";
const pick = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

type Drop = { y: number; speed: number; len: number; chars: string[] };

export default function MatrixRain({ className, cell = 18 }: { className?: string; cell?: number }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, rows = 0;
    let drops: Drop[] = [];
    let raf = 0, last = 0, running = false;

    const spawn = (scatter: boolean): Drop => {
      const len = 5 + Math.floor(Math.random() * 9);
      return {
        y: scatter ? Math.random() * (rows + len) : -Math.random() * rows * 0.8,
        speed: 0.1 + Math.random() * 0.2,
        len,
        chars: Array.from({ length: len }, pick),
      };
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      rows = Math.ceil(h / cell);
      // Only about one column in three carries a stream, so it never reads as a wall
      drops = Array.from({ length: Math.ceil(w / cell) }, () => (Math.random() < 0.34 ? spawn(true) : null)) as Drop[];
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${cell * 0.72}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      drops.forEach((d, col) => {
        if (!d) return;
        const x = col * cell + cell / 2;
        const head = Math.floor(d.y);
        for (let i = 0; i < d.len; i++) {
          const row = head - i;
          if (row < 0 || row > rows) continue;
          const fade = 1 - i / d.len;
          ctx.fillStyle = i === 0 ? `rgba(245,240,232,0.3)` : `rgba(200,117,69,${(fade * 0.2).toFixed(3)})`;
          ctx.fillText(d.chars[row % d.len], x, row * cell + cell / 2);
        }
      });
    };

    const step = () => {
      drops.forEach((d, col) => {
        if (!d) return;
        d.y += d.speed;
        if (Math.random() < 0.03) d.chars[Math.floor(Math.random() * d.len)] = pick();
        if (d.y - d.len > rows) drops[col] = spawn(false);
      });
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 42) return;
      last = now;
      step();
      draw();
    };
    const play = () => {
      if (reduced || running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()));
    io.observe(canvas);

    resize();
    draw();
    play();
    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
    };
  }, [cell]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
