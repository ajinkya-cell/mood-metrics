"use client";

import React from "react";

// Isometric line drawing (design-bh §5.6.1): an exchange block and a cold-storage
// vault joined by a railed track. Coin stacks travel toward the vault on net
// outflow (accumulation) and toward the exchange on net inflow (selling), faster
// for stronger signals. Monochrome at rest; the track, coins and order-book bars
// take the blue accent while the surrounding card (.group) is hovered.

// World → screen: +x runs down-right, +y down-left, z up (2:1 isometric)
const OX = 70;
const OY = 72;
const P = (x: number, y: number, z: number) => [OX + (x - y) * 0.866, OY + (x + y) * 0.5 - z] as const;
const pts = (...ps: (readonly [number, number])[]) => ps.map((p) => p.join(",")).join(" ");

// The three visible faces of a box
function IsoBox({ x, y, dx, dy, dz }: { x: number; y: number; dx: number; dy: number; dz: number }) {
  const [x1, y1] = [x + dx, y + dy];
  return (
    <g strokeLinejoin="round" strokeWidth="1" className="stroke-white/35">
      <polygon points={pts(P(x, y, dz), P(x1, y, dz), P(x1, y1, dz), P(x, y1, dz))} fill="#18181b" />
      <polygon points={pts(P(x, y1, 0), P(x1, y1, 0), P(x1, y1, dz), P(x, y1, dz))} fill="#0f0f11" />
      <polygon points={pts(P(x1, y, 0), P(x1, y1, 0), P(x1, y1, dz), P(x1, y, dz))} fill="#131315" />
    </g>
  );
}

// Circle lying in the y = yPlane wall, centred at (cx, cz)
const wallCircle = (cx: number, yPlane: number, cz: number, r: number) =>
  pts(...Array.from({ length: 25 }, (_, i) => {
    const t = (i / 24) * Math.PI * 2;
    return P(cx + r * Math.cos(t), yPlane, cz + r * Math.sin(t));
  }));

// Disc lying flat at height z, centred at (cx, cy)
const disc = (cx: number, cy: number, z: number, r: number) =>
  pts(...Array.from({ length: 17 }, (_, i) => {
    const t = (i / 16) * Math.PI * 2;
    return P(cx + r * Math.cos(t), cy + r * Math.sin(t), z);
  }));

const ACCENT = "group-hover:stroke-[oklch(78.5%_0.115_274.713)] transition-[stroke] duration-500";
const TRACK = { from: 64, to: 172, y: 25 };

export default function WhaleFlowIllustration({ score }: { score: number }) {
  // Positive whale score = outflow from exchanges = accumulation → toward the vault
  const toVault = score >= 0;
  const strength = Math.min(Math.abs(score), 100) / 100;
  const duration = 5.5 - strength * 3; // 5.5s idle drift → 2.5s strong flow
  const travel = TRACK.to - TRACK.from - 12;
  const [dx, dy] = [travel * 0.866, travel * 0.5];

  return (
    <svg viewBox="0 0 300 232" className="w-full h-auto" role="img" aria-label={toVault ? "Coins flowing from exchanges into cold storage" : "Coins flowing from cold storage onto exchanges"}>
      {/* Corner registration marks, like a technical drawing */}
      {[
        [10, 10],
        [290, 10],
        [10, 222],
        [290, 222],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x - 4},${y}H${x + 4}M${x},${y - 4}V${y + 4}`} className="stroke-white/20" strokeWidth="1" />
      ))}

      {/* Track: two rails and sleepers along +x */}
      <g strokeWidth="1" strokeLinecap="round">
        {[TRACK.y - 8, TRACK.y + 8].map((ry) => (
          <polyline key={ry} points={pts(P(TRACK.from, ry, 0), P(TRACK.to, ry, 0))} fill="none" className={`stroke-white/35 ${ACCENT}`} />
        ))}
        {Array.from({ length: 10 }, (_, i) => TRACK.from + 6 + i * 11).map((sx) => (
          <polyline key={sx} points={pts(P(sx, TRACK.y - 8, 0), P(sx, TRACK.y + 8, 0))} fill="none" className="stroke-white/15" />
        ))}
      </g>

      {/* Exchange: box with order-book bars on its front wall */}
      <IsoBox x={0} y={0} dx={60} dy={50} dz={58} />
      <g strokeWidth="2" strokeLinecap="round">
        {[12, 20, 28, 36, 44].map((z, i) => (
          <polyline key={z} points={pts(P(8, 50, z), P(8 + [38, 24, 44, 18, 30][i], 50, z))} fill="none" className={`stroke-white/30 ${ACCENT}`} />
        ))}
      </g>

      {/* Vault: box with a dial and handle on its front wall */}
      <IsoBox x={172} y={0} dx={48} dy={50} dz={46} />
      <polygon points={wallCircle(196, 50, 23, 13)} fill="none" strokeWidth="1" className={`stroke-white/35 ${ACCENT}`} />
      <polygon points={wallCircle(196, 50, 23, 4)} fill="none" strokeWidth="1" className="stroke-white/35" />
      <polyline points={pts(P(196, 50, 27), P(196, 50, 33))} strokeWidth="1.5" strokeLinecap="round" className="stroke-white/35" />

      {/* Coin stacks travelling along the track */}
      {[0, 1, 2].map((k) => (
        <g
          key={k}
          className="ed-wf-coin"
          style={
            {
              "--wf-dx": `${dx}px`,
              "--wf-dy": `${dy}px`,
              animationDuration: `${duration}s`,
              animationDelay: `${(-duration / 3) * k}s`,
              animationDirection: toVault ? "normal" : "reverse",
            } as React.CSSProperties
          }
        >
          {[0, 3, 6].map((z) => (
            <polygon key={z} points={disc(TRACK.from + 6, TRACK.y, z, 6)} fill="#1c1c1f" strokeWidth="1" className={`stroke-white/50 ${ACCENT}`} />
          ))}
        </g>
      ))}

      <text x={28} y={146} fontSize="9" letterSpacing="2" fill="oklch(98.5% 0 0 / 0.45)" style={{ fontFamily: "var(--font-grotesk)" }}>
        EXCHANGE
      </text>
      <text x={176} y={224} fontSize="9" letterSpacing="2" fill="oklch(98.5% 0 0 / 0.45)" style={{ fontFamily: "var(--font-grotesk)" }}>
        COLD STORAGE
      </text>
    </svg>
  );
}
