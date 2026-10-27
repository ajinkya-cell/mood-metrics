"use client";

import React from "react";

// Landing hero illustration: a dotted ivory Earth seen from an elevated
// isometric camera, with BTC / ETH / SOL coins riding tilted, slightly
// wobbling orbits around it. Drawn on a canvas so coins can pass behind the
// globe and be depth-sorted. The pointer nudges the camera; reduced motion
// renders a single still frame.

type V3 = [number, number, number];

const PALETTE = {
  ivory: "#F5F0E8",
  beige: "#E5DDD1",
  orange: "#C87545",
  charcoal: "#252525",
  gold: "#D8AC57",
  grey: "#A9A39A",
};

// ── Vector helpers ──
const rotX = ([x, y, z]: V3, a: number): V3 => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
const rotY = ([x, y, z]: V3, a: number): V3 => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const rotZ = ([x, y, z]: V3, a: number): V3 => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const deg = Math.PI / 180;

// Light from the upper left, slightly in front
const LIGHT = norm([-0.55, 0.75, 0.55]);

// ── Land mask: coarse continent outlines as [lon, lat] rings ──
const LAND: [number, number][][] = [
  // North America
  [[-165, 68], [-140, 70], [-110, 73], [-85, 72], [-70, 62], [-60, 55], [-55, 48], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-82, 29], [-90, 30], [-97, 26], [-97, 20], [-90, 16], [-84, 10], [-78, 8], [-85, 12], [-92, 15], [-105, 20], [-112, 30], [-117, 33], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60], [-160, 65]],
  // Greenland
  [[-55, 60], [-45, 60], [-20, 70], [-20, 80], [-60, 82], [-70, 77], [-55, 70]],
  // South America
  [[-78, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -27], [-58, -38], [-65, -42], [-68, -55], [-74, -50], [-72, -30], [-70, -18], [-80, -5], [-80, 2]],
  // Europe
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [10, 58], [5, 62], [15, 69], [25, 71], [40, 68], [45, 60], [40, 45], [28, 41], [26, 38], [20, 40], [15, 38], [12, 44], [5, 43], [0, 38]],
  // UK
  [[-6, 50], [2, 51], [0, 58], [-6, 58]],
  // Africa
  [[-17, 21], [-17, 14], [-8, 5], [5, 5], [10, 3], [9, -3], [12, -15], [15, -28], [20, -35], [28, -33], [33, -25], [40, -15], [40, -3], [51, 12], [43, 12], [35, 22], [32, 31], [20, 32], [10, 37], [-5, 36], [-10, 30]],
  // Madagascar
  [[44, -25], [50, -15], [49, -12], [44, -17]],
  // Asia
  [[26, 41], [36, 36], [35, 30], [43, 13], [52, 15], [58, 22], [57, 26], [67, 25], [73, 20], [78, 8], [80, 15], [88, 22], [92, 21], [98, 16], [100, 5], [104, 1], [106, 10], [109, 12], [107, 20], [117, 24], [122, 30], [122, 37], [119, 39], [126, 38], [129, 35], [130, 43], [140, 48], [141, 53], [135, 55], [150, 59], [162, 60], [170, 64], [180, 66], [180, 72], [140, 73], [110, 77], [80, 73], [70, 68], [60, 68], [45, 68], [40, 65], [45, 45], [40, 42]],
  // Japan
  [[130, 31], [141, 36], [142, 43], [140, 42], [135, 34]],
  // Maritime Southeast Asia
  [[95, 5], [105, -6], [115, -8], [120, -5], [118, 4], [110, 2]],
  // Australia
  [[114, -22], [122, -17], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [144, -38], [138, -34], [132, -31], [124, -33], [115, -34]],
];

function inRing(lon: number, lat: number, ring: [number, number][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const toUnit = (lat: number, lon: number): V3 => [
  Math.cos(lat * deg) * Math.sin(lon * deg),
  Math.sin(lat * deg),
  Math.cos(lat * deg) * Math.cos(lon * deg),
];

// Evenly spaced dot lattice over the sphere, split into land and sea
function buildDots() {
  const land: V3[] = [];
  const sea: V3[] = [];
  const step = 2.6;
  for (let lat = -78; lat <= 82; lat += step) {
    const n = Math.max(1, Math.round((360 * Math.cos(lat * deg)) / step));
    for (let i = 0; i < n; i++) {
      const lon = -180 + (i + (Math.round(lat / step) % 2) * 0.5) * (360 / n);
      const p = toUnit(lat, lon);
      if (LAND.some((r) => inRing(lon, lat, r))) land.push(p);
      else if (i % 2 === 0) sea.push(p);
    }
  }
  return { land, sea };
}

// Financial hubs, picked out in burnt orange with a slow pulse
const HUBS: V3[] = [
  [40.7, -74], [51.5, -0.1], [1.3, 103.8], [35.7, 139.7], [25.2, 55.3], [22.3, 114.2], [-23.5, -46.6], [37.8, -122.4],
].map(([lat, lon]) => toUnit(lat, lon));

// ── Coins: twelve assets, each appearing exactly once ──
type Kind = "btc" | "eth" | "sol" | "bnb" | "xrp" | "ada" | "doge" | "avax" | "dot" | "link" | "ltc" | "usdt";
type Coin = { kind: Kind; ph: number; r: number; s0: number; spd: number; tilt: number; roll: number };
type Orbit = { a: number; b: number; rx: number; rz: number; ry: number; w: number; wob: number; coins: Coin[] };

const c = (kind: Kind, ph: number, r: number, s0: number, spd: number, tilt = 0, roll = 0): Coin => ({ kind, ph, r, s0, spd, tilt, roll });

const ORBITS: Orbit[] = [
  { a: 1.62, b: 1.38, rx: 14 * deg, rz: -16 * deg, ry: 0, w: 0.13, wob: 0.05, coins: [
    c("btc", 0.2, 0.26, 0.3, 0.45, -8, 6), c("sol", 2.3, 0.21, 2.4, 0.5, -14, 8), c("xrp", 4.4, 0.18, 0.9, -0.36, 6, 18),
  ] },
  { a: 2.2, b: 1.7, rx: -6 * deg, rz: 20 * deg, ry: 30 * deg, w: -0.085, wob: 0.09, coins: [
    c("eth", 0.6, 0.24, 0.1, 0.35, 12, -6), c("bnb", 2.1, 0.2, 2.2, -0.42, -10, 14), c("ada", 3.6, 0.19, 1.2, 0.3, 4, -20), c("avax", 5.0, 0.2, 2.9, 0.4, 8, -4),
  ] },
  { a: 2.55, b: 1.8, rx: 22 * deg, rz: 6 * deg, ry: -20 * deg, w: 0.055, wob: 0.12, coins: [
    c("doge", 0.9, 0.19, 0.4, -0.32, -6, 16), c("link", 2.5, 0.16, 1.8, 0.36, 12, -8), c("ltc", 4.0, 0.17, 2.6, -0.28, -10, 4), c("dot", 5.5, 0.16, 1.1, 0.44, 6, 12),
  ] },
  { a: 1.34, b: 1.3, rx: 72 * deg, rz: 24 * deg, ry: 0, w: 0.16, wob: 0.03, coins: [
    c("usdt", 1.2, 0.15, 0.5, 0.6, 0, 10),
  ] },
];

function orbitPoint(o: Orbit, phi: number): V3 {
  let p: V3 = [o.a * Math.cos(phi), o.wob * Math.sin(2 * phi + o.a), o.b * Math.sin(phi)];
  p = rotX(p, o.rx);
  p = rotZ(p, o.rz);
  return rotY(p, o.ry);
}

// Metal families keep the set restrained: gold, silver, ivory, graphite, and
// a few muted brand tints
type Face = { stops: string[]; edge: string; edgeDark: string; rim: string };
const GOLD: Face = { stops: ["#F0CB7C", PALETTE.gold, "#B98538"], edge: "#B07A34", edgeDark: "#7E5422", rim: "rgba(120,78,28,0.55)" };
const SILVER: Face = { stops: ["#E4E1EA", "#B9B5C3", "#86828F"], edge: "#7C7886", edgeDark: "#55525D", rim: "rgba(60,58,70,0.45)" };
const IVORY: Face = { stops: [PALETTE.ivory, PALETTE.beige, "#C9BFB0"], edge: PALETTE.grey, edgeDark: "#78726A", rim: "rgba(110,104,96,0.45)" };
const GRAPHITE: Face = { stops: ["#4A4846", "#33312F", PALETTE.charcoal], edge: "#2A2928", edgeDark: "#161515", rim: "rgba(216,172,87,0.45)" };
const FACE: Record<Kind, Face> = {
  btc: GOLD,
  eth: SILVER,
  sol: IVORY,
  bnb: GRAPHITE,
  xrp: GRAPHITE,
  ada: IVORY,
  doge: { stops: ["#EAD9A8", "#CDB57A", "#A88E52"], edge: "#97804A", edgeDark: "#6B5A32", rim: "rgba(110,88,40,0.5)" },
  avax: { stops: ["#D98A6A", PALETTE.orange, "#9C5530"], edge: "#8F4E2D", edgeDark: "#62341D", rim: "rgba(90,40,20,0.5)" },
  dot: IVORY,
  link: { stops: ["#8E9CC4", "#5F6FA0", "#3F4C7A"], edge: "#3F4C7A", edgeDark: "#283152", rim: "rgba(220,226,245,0.4)" },
  ltc: SILVER,
  usdt: { stops: ["#86C2B0", "#4E9A86", "#336E5F"], edge: "#336E5F", edgeDark: "#1F4A3F", rim: "rgba(225,245,238,0.4)" },
};

// ₿ in a 100×100 box, filled even-odd so the bowls stay open
const BTC_PATH =
  "M30 22H60C70 22 72 30 72 35C72 41 69 45 65 47C71 49 75 54 75 62C75 72 68 78 60 78H30Z" +
  "M42 31H57C61 31 62 33 62 36C62 39 61 42 57 42H42Z" +
  "M42 51H59C62 51 64 54 64 60C64 66 62 69 59 69H42Z" +
  "M38 12H45V22H38ZM51 12H58V22H51ZM38 78H45V88H38ZM51 78H58V88H51Z" +
  "M24 22H30V30H24ZM24 70H30V78H24Z";

function drawSymbol(ctx: CanvasRenderingContext2D, kind: Kind, btc: Path2D) {
  const poly = (pts: number[][], fill: string | CanvasGradient) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  // Letter-form symbols, embossed: a light offset copy under the ink
  const glyph = (ch: string, ink: string, size = 1.15, lift = "rgba(255,248,235,0.4)") => {
    ctx.save();
    ctx.scale(0.01, 0.01);
    ctx.font = `700 ${size * 100}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = lift;
    ctx.fillText(ch, -2, 4);
    ctx.fillStyle = ink;
    ctx.fillText(ch, 0, 6);
    ctx.restore();
  };

  switch (kind) {
    case "btc":
      ctx.save();
      ctx.rotate(14 * deg);
      ctx.scale(0.0115, 0.0115);
      ctx.translate(-50, -50);
      ctx.fillStyle = "rgba(255,240,205,0.55)";
      ctx.translate(-1.5, -1.5);
      ctx.fill(btc, "evenodd");
      ctx.translate(1.5, 1.5);
      ctx.fillStyle = "#7A4F1E";
      ctx.fill(btc, "evenodd");
      ctx.restore();
      break;
    case "eth":
      poly([[0, -0.62], [-0.38, 0.03], [0, 0.24]], "#2E2C35");
      poly([[0, -0.62], [0.38, 0.03], [0, 0.24]], "#55525F");
      poly([[0, 0.32], [-0.38, 0.11], [0, 0.64]], "#3A3842");
      poly([[0, 0.32], [0.38, 0.11], [0, 0.64]], "#6A6775");
      break;
    case "sol": {
      const g = ctx.createLinearGradient(-0.6, 0.5, 0.6, -0.5);
      g.addColorStop(0, "#3FB8A6");
      g.addColorStop(1, "#7E63CF");
      // Outer bars lean one way, the middle bar the other
      for (const [yc, lean] of [[-0.38, 0], [0, 1], [0.38, 0]])
        poly([[-0.6 + 0.15 * lean, yc - 0.1], [0.6 - 0.15 * (1 - lean), yc - 0.1], [0.6 - 0.15 * lean, yc + 0.1], [-0.6 + 0.15 * (1 - lean), yc + 0.1]], g);
      break;
    }
    case "bnb": {
      // Centre diamond ringed by four smaller ones
      const dia = (x: number, y: number, s: number) => poly([[x, y - s], [x + s, y], [x, y + s], [x - s, y]], PALETTE.gold);
      dia(0, 0, 0.17);
      for (const [x, y] of [[0, -0.42], [0.42, 0], [0, 0.42], [-0.42, 0]]) dia(x, y, 0.12);
      break;
    }
    case "xrp":
      ctx.strokeStyle = PALETTE.ivory;
      ctx.lineWidth = 0.12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-0.42, -0.42);
      ctx.quadraticCurveTo(0, 0.06, 0.42, -0.42);
      ctx.moveTo(-0.42, 0.42);
      ctx.quadraticCurveTo(0, -0.06, 0.42, 0.42);
      ctx.stroke();
      break;
    case "ada":
      ctx.fillStyle = "#3E5BA9";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0.075, 0, Math.PI * 2);
        ctx.arc(Math.cos(a + Math.PI / 6) * 0.5, Math.sin(a + Math.PI / 6) * 0.5, 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case "doge":
      glyph("Ð", "#5E4B22");
      break;
    case "avax":
      poly([[-0.04, -0.5], [0.16, -0.14], [-0.2, 0.42], [-0.52, 0.42]], PALETTE.ivory);
      poly([[0.28, 0.06], [0.52, 0.42], [0.06, 0.42]], PALETTE.ivory);
      break;
    case "dot":
      ctx.fillStyle = "#B4506F";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.save();
        ctx.translate(Math.cos(a) * 0.4, Math.sin(a) * 0.4);
        ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, 0.15, 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    case "link":
      ctx.strokeStyle = PALETTE.ivory;
      ctx.lineWidth = 0.14;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * 0.46, Math.sin(a) * 0.46);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    case "ltc":
      glyph("Ł", "#3A3842");
      break;
    case "usdt":
      glyph("₮", PALETTE.ivory, 1.1, "rgba(0,0,0,0.25)");
      break;
  }
}

export default function CryptoGlobe({ className }: { className?: string }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const { land, sea } = buildDots();
    const btc = new Path2D(BTC_PATH);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1;
    let raf = 0, running = false, visible = true;
    const cam = { yaw: -0.18, pitch: 0.46, tYaw: -0.18, tPitch: 0.46 };
    const start = performance.now();

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    const frame = (t: number) => {
      cam.yaw += (cam.tYaw - cam.yaw) * 0.05;
      cam.pitch += (cam.tPitch - cam.pitch) * 0.05;
      const S = Math.min(w / 5.5, h / 3.7);
      const cx = w / 2, cy = h / 2 - S * 0.06;
      // world → view: [screen x, screen y (down), depth toward viewer]
      const view = (p: V3): V3 => {
        const q = rotY(p, cam.yaw);
        return [q[0], -(q[1] * Math.cos(cam.pitch) - q[2] * Math.sin(cam.pitch)), q[1] * Math.sin(cam.pitch) + q[2] * Math.cos(cam.pitch)];
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Warm halo and a soft contact shadow ground the globe
      const halo = ctx.createRadialGradient(cx, cy, S * 0.6, cx, cy, Math.min(w, h) * 0.49);
      halo.addColorStop(0, "rgba(200,117,69,0.13)");
      halo.addColorStop(1, "rgba(200,117,69,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      const gy = cy + S * 1.55;
      ctx.save();
      ctx.translate(cx, gy);
      ctx.scale(1, 0.32);
      const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 1.25);
      sh.addColorStop(0, "rgba(0,0,0,0.55)");
      sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.arc(0, 0, S * 1.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([1.5, 5]);
      ctx.strokeStyle = "rgba(169,163,154,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, S * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ── Orbit paths and transaction particles, split at the globe ──
      const paths = ORBITS.map((o) => {
        const pts: V3[] = [];
        for (let i = 0; i <= 160; i++) pts.push(view(orbitPoint(o, (i / 160) * Math.PI * 2)));
        return pts;
      });
      const strokePaths = (front: boolean) => {
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = front ? "rgba(229,221,209,0.26)" : "rgba(229,221,209,0.09)";
        ctx.beginPath();
        for (const pts of paths) {
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            if ((a[2] + b[2] >= 0) !== front) continue;
            ctx.moveTo(cx + a[0] * S, cy + a[1] * S);
            ctx.lineTo(cx + b[0] * S, cy + b[1] * S);
          }
        }
        ctx.stroke();
      };
      const particles: { v: V3; hot: boolean }[] = [];
      ORBITS.forEach((o, oi) => {
        for (let k = 0; k < 9; k++) {
          const phi = (k / 9) * Math.PI * 2 + t * o.w * 2.2 + oi;
          particles.push({ v: view(orbitPoint(o, phi)), hot: k % 4 === 0 });
        }
      });
      const drawParticles = (front: boolean) => {
        for (const p of particles) {
          if (p.v[2] >= 0 !== front) continue;
          ctx.fillStyle = p.hot ? `rgba(200,117,69,${front ? 0.9 : 0.35})` : `rgba(245,240,232,${front ? 0.55 : 0.2})`;
          ctx.beginPath();
          ctx.arc(cx + p.v[0] * S, cy + p.v[1] * S, (p.hot ? 1.6 : 1.1) * (1 + p.v[2] * 0.08), 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // ── Coins ──
      const coins = ORBITS.flatMap((o) =>
        o.coins.map((cn) => {
          const pos = orbitPoint(o, cn.ph + t * o.w);
          const v = view(pos);
          return { cn, v, bob: Math.sin(t * 0.9 + cn.ph * 3) * 0.035 };
        })
      ).sort((a, b) => a.v[2] - b.v[2]);

      const drawCoin = ({ cn, v, bob }: (typeof coins)[number]) => {
        const spin = cn.s0 + t * cn.spd;
        const orient = (p: V3) => rotZ(rotX(rotY(p, spin), cn.tilt * deg), cn.roll * deg);
        let U = orient([1, 0, 0]);
        const V = orient([0, 1, 0]);
        let N = orient([0, 0, 1]);
        // Show whichever face looks at the camera; flip U so ₿ never reads mirrored
        if (view(N)[2] < 0) {
          N = [-N[0], -N[1], -N[2]];
          U = [-U[0], -U[1], -U[2]];
        }
        const k = 1 + v[2] * 0.09;
        const r = cn.r * 1.2 * k * S;
        const Us = view(U), Vs = view(V), Ns = view(N);
        const X = cx + v[0] * S, Y = cy + (v[1] - bob) * S;
        const th = cn.r * 1.2 * 0.16 * k * S;
        const f = FACE[cn.kind];
        const at = (ox: number, oy: number) =>
          ctx.setTransform(Us[0] * r * dpr, Us[1] * r * dpr, -Vs[0] * r * dpr, -Vs[1] * r * dpr, (X + ox) * dpr, (Y + oy) * dpr);
        const disc = (rad = 1) => {
          ctx.beginPath();
          ctx.arc(0, 0, rad, 0, Math.PI * 2);
        };

        ctx.save();
        // Coin thickness: stacked discs from the back face forward
        const steps = 7;
        for (let i = steps; i >= 1; i--) {
          at(-Ns[0] * th * (i / steps), -Ns[1] * th * (i / steps));
          if (i === steps) {
            ctx.shadowColor = "rgba(0,0,0,0.45)";
            ctx.shadowBlur = 10 * dpr * k;
            ctx.shadowOffsetY = 4 * dpr * k;
          }
          disc();
          ctx.fillStyle = i > steps / 2 ? f.edgeDark : f.edge;
          ctx.fill();
          ctx.shadowColor = "transparent";
        }

        at(0, 0);
        const g = ctx.createLinearGradient(-1, -1, 1, 1);
        g.addColorStop(0, f.stops[0]);
        g.addColorStop(0.5, f.stops[1]);
        g.addColorStop(1, f.stops[2]);
        disc();
        ctx.fillStyle = g;
        ctx.fill();

        // Brushed satin: a soft band of light that moves as the coin turns
        const lam = Math.max(0, dot(N, LIGHT));
        const shade = (1 - lam) * 0.38 + Math.max(0, -v[2]) * 0.06;
        disc();
        ctx.fillStyle = `rgba(37,37,37,${shade.toFixed(3)})`;
        ctx.fill();
        disc();
        ctx.fillStyle = `rgba(255,250,240,${(Math.pow(lam, 6) * 0.28).toFixed(3)})`;
        ctx.fill();

        ctx.lineWidth = 0.035;
        ctx.strokeStyle = f.rim;
        disc(0.84);
        ctx.stroke();

        drawSymbol(ctx, cn.kind, btc);

        ctx.lineWidth = 0.03;
        ctx.strokeStyle = "rgba(255,248,235,0.35)";
        ctx.beginPath();
        ctx.arc(0, 0, 0.985, Math.PI * 0.95, Math.PI * 1.55);
        ctx.stroke();
        ctx.restore();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      // ── Globe ──
      const spinE = t * 0.06 + 2.2;
      const axial = 18 * deg;
      const earth = (p: V3) => view(rotZ(rotY(p, spinE), axial));
      const drawGlobe = () => {
        const lv = view(LIGHT);
        const g = ctx.createRadialGradient(cx + lv[0] * S * 0.45, cy + lv[1] * S * 0.45, S * 0.05, cx, cy, S * 1.02);
        g.addColorStop(0, PALETTE.ivory);
        g.addColorStop(0.55, PALETTE.beige);
        g.addColorStop(0.86, "#CDC4B6");
        g.addColorStop(1, "#9E978C");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, S, 0, Math.PI * 2);
        ctx.fill();

        // Fine latitude stripes for the sea
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, S, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = "rgba(169,163,154,0.28)";
        ctx.lineWidth = 0.6;
        for (let lat = -75; lat <= 75; lat += 15) {
          ctx.beginPath();
          let pen = false;
          for (let i = 0; i <= 72; i++) {
            const e = earth(toUnit(lat, i * 5));
            if (e[2] < 0) { pen = false; continue; }
            const X = cx + e[0] * S, Y = cy + e[1] * S;
            if (pen) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
            pen = true;
          }
          ctx.stroke();
        }
        ctx.restore();

        const dots = (set: V3[], color: string, base: number) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          for (const p of set) {
            const e = earth(p);
            if (e[2] <= 0.04) continue;
            const X = cx + e[0] * S, Y = cy + e[1] * S;
            const rad = base * (0.35 + 0.65 * Math.sqrt(e[2])) * (S / 80);
            ctx.moveTo(X + rad, Y);
            ctx.arc(X, Y, rad, 0, Math.PI * 2);
          }
          ctx.fill();
        };
        dots(sea, "rgba(169,163,154,0.55)", 0.55);
        dots(land, PALETTE.charcoal, 1.05);

        // Equator in burnt orange, the one strong line on the sphere
        ctx.strokeStyle = "rgba(200,117,69,0.75)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i <= 120; i++) {
          const e = earth(toUnit(0, i * 3));
          if (e[2] < 0) { pen = false; continue; }
          const X = cx + e[0] * S, Y = cy + e[1] * S;
          if (pen) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
          pen = true;
        }
        ctx.stroke();

        HUBS.forEach((h, i) => {
          const e = earth(h);
          if (e[2] <= 0.1) return;
          const X = cx + e[0] * S, Y = cy + e[1] * S;
          const pulse = ((t * 0.5 + i * 0.37) % 1);
          ctx.strokeStyle = `rgba(200,117,69,${(0.7 * (1 - pulse) * e[2]).toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(X, Y, 2 + pulse * 7 * (S / 80), 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = PALETTE.orange;
          ctx.beginPath();
          ctx.arc(X, Y, 2.1 * (S / 80) * (0.5 + 0.5 * e[2]), 0, Math.PI * 2);
          ctx.fill();
        });

        // Terminator: shade the side away from the light, then a crisp rim
        const tg = ctx.createRadialGradient(cx + lv[0] * S * 0.6, cy + lv[1] * S * 0.6, S * 0.4, cx, cy, S * 1.08);
        tg.addColorStop(0, "rgba(37,37,37,0)");
        tg.addColorStop(1, "rgba(37,37,37,0.4)");
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.arc(cx, cy, S, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(245,240,232,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      };

      // Back → globe → front
      strokePaths(false);
      drawParticles(false);
      coins.filter((x) => x.v[2] < 0).forEach(drawCoin);
      drawGlobe();
      strokePaths(true);
      drawParticles(true);
      coins.filter((x) => x.v[2] >= 0).forEach(drawCoin);
    };

    const loop = (now: number) => {
      frame((now - start) / 1000);
      raf = running ? requestAnimationFrame(loop) : 0;
    };
    const play = () => {
      if (reduced || running || !visible) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) frame(reduced ? 6 : (performance.now() - start) / 1000);
    });
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play(); else pause();
    });
    io.observe(wrap);

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      cam.tYaw = -0.18 + ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      cam.tPitch = 0.46 + ((e.clientY - r.top) / r.height - 0.5) * 0.14;
    };
    const onLeave = () => {
      cam.tYaw = -0.18;
      cam.tPitch = 0.46;
    };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    resize();
    frame(reduced ? 6 : 0);
    play();

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A dotted Earth with Bitcoin, Ethereum and Solana coins orbiting it"
        className="block w-full h-full"
      />
    </div>
  );
}
