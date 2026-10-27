/**
 * Confluence: a sentiment engine on a rounded plinth. Three sources sit round
 * it, each with its own channel cut into the plinth: a cluster of opinion
 * nodes (left), vaults and coin stacks (right), headline panels and an antenna
 * (rear). Signals ride the channels into the engine; a dial stands in front.
 * At rest the dial's needle is bright and reads the blend. The pointer picks a
 * source: its parts swell, staggered outwards from its main solid, which takes
 * the bright with its channel; the engine's core lifts, and the needle swings
 * to that source's reading. The slider is the gain: how far a reading moves
 * the needle.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, open, poly, prism, proj, rad, ringAt, rings, run, seg,
  tween, tset, tval, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const PL = 84, ER = 30, LIFT0 = 8, LIFT1 = 21, SWELL = 14, STEP = 45, BLEND = 0.24, SWING = 78;
const S2 = Math.SQRT1_2;
const SOURCES = [
  { name: "social", score: 0.62, from: [-30, 50], hit: [-44, 58, 6], key: 4 },
  { name: "whales", score: -0.41, from: [40, -34], hit: [56, -42, 12], key: 1 },
  { name: "news", score: 0.08, from: [-38, -46], hit: [-50, -62, 22], key: 1 },
];
// opinion nodes, far to near: x, y, radius, height; the fifth is the hub the links converge on
const NODES = [[-66, 38, 2.6, 6], [-50, 42, 4, 4], [-62, 58, 3, 2.5], [-60, 74, 2.6, 4], [-30, 50, 6, 7], [-44, 66, 4.5, 10], [-24, 72, 3.2, 3]];
const LINKS = [[4, 1], [4, 5], [4, 6], [1, 0], [1, 2], [5, 2], [5, 3], [0, 2]];

const at = (ring, cx, cy) => ring.map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));
const turn = (ring) => ring.map((q) => ({ u: (q.u - q.v) * S2, v: (q.u + q.v) * S2, nu: (q.nu - q.nv) * S2, nv: (q.nu + q.nv) * S2 }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gain = value;
  const C = Cam(45, 0.5, 1.36);
  fit(C, [[-PL, -PL, -6], [PL, PL, -6], [PL, -PL, -6], [-PL, PL, -6], [-66, -40, 46], [0, 0, 23 + LIFT1]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const line = (d, cls) => mk("path", { d, class: cls }, g);
  const drum = (cx, cy, R, b, z0, z1) => {
    const s = solid(g), o = at(circ(R, 48), cx, cy), i = at(circ(R - b, 48), cx, cy);
    s.draw = (z) => put(s, prism(P, front, o, i, z0, z));
    s.draw(z1);
    return s;
  };
  const box = (x0, y0, x1, y1, r, b, z0, z1) => { const s = solid(g), [o, i] = rings(x0, y0, x1, y1, r, b); put(s, prism(P, front, o, i, z0, z1)); return s; };
  // the parts that swell when their source is picked, each on its own tween
  const parts = [[], [], []];
  const part = (k, draw) => parts[k].push({ tw: tween(0), draw, d: NaN });

  // the plinth, then everything cut into its top: links, channels and the dots that ride them
  const [pr, pi] = rings(-PL, -PL, PL, PL, 14, 2.2);
  put(solid(g), prism(P, front, pr, pi, -6, 0));
  for (const [a, b] of LINKS) line(seg(P(NODES[a][0], NODES[a][1], 0), P(NODES[b][0], NODES[b][1], 0)), "nf lo");
  const chans = SOURCES.map(({ from }) => {
    const L = Math.hypot(from[0], from[1]), to = [(from[0] / L) * (ER + 1), (from[1] / L) * (ER + 1)];
    const nx = (from[1] / L) * 2.6, ny = (-from[0] / L) * 2.6;
    const rails = line(seg(P(from[0] + nx, from[1] + ny, 0), P(to[0] + nx, to[1] + ny, 0)) + seg(P(from[0] - nx, from[1] - ny, 0), P(to[0] - nx, to[1] - ny, 0)), "nf lo");
    return { from, to, rails, dots: [0, 1, 2].map(() => flatDot(g, C, 0.9, "dot off")) };
  });

  // news, at the back: a low rail, three headline panels leaning back, an antenna
  box(-80, -70, -22, -52, 3, 1.2, 0, 3);
  const panels = [[-78, 14, 26], [-60, 16, 34], [-40, 14, 22]].map(([x0, w, h], k) => {
    const s = Math.sin(rad(10)), c = Math.cos(rad(10)), Y = -62, TK = 1.6;
    const shape = fillet([[0, 0], [w, 0], [w, h], [0, h]], [1, 1, 2.4, 2.4]);
    const back = line("", "lo"), face = line("", "sil"), head = line("", "nf"), rows = line("", "nf lo");
    part(2, (dz) => {
      const wf = (u, v) => P(x0 + u, Y - v * s, 3 + dz + v * c), wb = (u, v) => P(x0 + u, Y - v * s - TK * c, 3 + dz + v * c + TK * s);
      back.setAttribute("d", poly(shape.map((p) => wb(p[0], p[1]))));
      face.setAttribute("d", poly(shape.map((p) => wf(p[0], p[1]))));
      head.setAttribute("d", seg(wf(3, h - 5), wf(w - 3, h - 5)));
      rows.setAttribute("d", [h - 10, h - 14, h - 18].map((v) => seg(wf(3, v), wf(w - 3 - ((v + k) % 5), v))).join(""));
    });
    return { sil: face };
  });
  drum(-66, -40, 3.2, 0.8, 0, 3);
  drum(-66, -40, 1.1, 0.4, 3, 44);
  place(flatDot(g, C, 1.2, "dot m"), P(-66, -40, 45.5));

  // the engine: three stacked drums round a lifting core, status lights on each step
  drum(0, 0, ER, 2, 0, 9);
  for (let k = 0; k < 14; k++) place(flatDot(g, C, 0.75, "dot off"), P(26.5 * Math.cos((k / 14) * 6.283), 26.5 * Math.sin((k / 14) * 6.283), 9));
  drum(0, 0, 23, 1.8, 9, 17);
  for (let k = 0; k < 10; k++) place(flatDot(g, C, 0.75, "dot off"), P(19.6 * Math.cos((k / 10) * 6.283 + 0.3), 19.6 * Math.sin((k / 10) * 6.283 + 0.3), 17));
  drum(0, 0, 16, 1.6, 17, 23);
  const core = solid(g), [co, ci] = rings(-6.5, -6.5, 6.5, 6.5, 2, 1);
  const coreO = turn(co), coreI = turn(ci), coreDots = [0, 1, 2].map((k) => flatDot(g, C, 0.8, k === 1 ? "dot m" : "dot off"));

  // social, on the left: opinion nodes of every size, each with a light on top
  const nodes = NODES.map(([x, y, r, h]) => {
    const s = drum(x, y, r, Math.min(1, r / 3), 0, h), dot = flatDot(g, C, 0.8, "dot off");
    part(0, (dz) => { s.draw(h + dz); place(dot, P(x, y, h + dz)); });
    return s;
  });

  // whales, on the right: a vault with its door, a safe, coin stacks, one far larger than the rest
  const vault = box(44, -72, 74, -46, 3.5, 1.6, 0, 22);
  line(poly(fillet([[50, 3], [68, 3], [68, 18], [50, 18]], [2, 2, 2, 2]).map(([u, v]) => P(u, -46, v))), "nf lo");
  line(poly(circ(3, 16).map((q) => P(59 + q.u, -46, 10.5 + q.v))), "nf lo");
  const stack = (x, y, R, h) => {
    const s = drum(x, y, R, 1, 0, h), rims = line("", "nf lo"), front0 = run(at(circ(R, 32), x, y), front);
    part(1, (dz) => { s.draw(h + dz); rims.setAttribute("d", Array.from({ length: Math.floor((h + dz) / 3.2) }, (_, k) => open(ringAt(P, front0, 3.2 * (k + 1)))).join("")); });
    return s;
  };
  stack(30, -54, 3, 6.4);
  const whale = stack(40, -34, 7.5, 18);
  stack(54, -16, 3.4, 6.4);
  box(62, -38, 78, -24, 2.5, 1.2, 0, 12);
  stack(66, -10, 3, 3.2);

  // the dial, at the front: a base, a face leaning back toward the engine, ticks, a needle
  box(34, 34, 66, 66, 6, 1.6, 0, 6);
  const t = rad(60), e1 = [S2, -S2, 0], e2 = [-S2 * Math.cos(t), -S2 * Math.cos(t), Math.sin(t)], nr = [S2 * Math.sin(t), S2 * Math.sin(t), Math.cos(t)];
  const D = (a, b, off = 0) => P(50 + a * e1[0] + b * e2[0] - off * nr[0], 50 + a * e1[1] + b * e2[1] - off * nr[1], 6 + b * e2[2] - off * nr[2]);
  const arc = (r, a0, a1, n) => Array.from({ length: n + 1 }, (_, k) => { const a = rad(a0 + ((a1 - a0) * k) / n); return [r * Math.cos(a), 5 + r * Math.sin(a)]; });
  const dial = fillet([[-25, 0], [25, 0], ...arc(25, 0, 180, 18)], [2, 2, ...Array(19).fill(0.5)]);
  line(poly(dial.map(([a, b]) => D(a, b, 2))), "lo");
  line(poly(dial.map(([a, b]) => D(a, b))), "sil");
  line(open(arc(16, 10, 170, 24).map(([a, b]) => D(a, b))), "nf lo");
  line(Array.from({ length: 9 }, (_, k) => { const a = rad(10 + k * 20), r0 = k === 4 ? 17.5 : 18.5; return seg(D(r0 * Math.cos(a), 5 + r0 * Math.sin(a)), D(21.5 * Math.cos(a), 5 + 21.5 * Math.sin(a))); }).join(""), "nf lo");
  const needle = line("", "nf hi"), hub = mk("circle", { r: 1.7, class: "dot m" }, g);
  place(hub, D(0, 5));

  const keys = [nodes[4], whale, panels[1]];
  const lift = tween(LIFT0), ang = tween(BLEND);
  let act = -1, phase = 0, drawn = [NaN, NaN];

  const B = register(stage, (dt, now) => {
    phase = (phase + dt * 0.32) % 1;
    chans.forEach((ch, k) => ch.dots.forEach((el, j) => {
      const f = (phase + j / 3) % 1;
      place(el, P(ch.from[0] + (ch.to[0] - ch.from[0]) * f, ch.from[1] + (ch.to[1] - ch.from[1]) * f, 0));
      el.setAttribute("class", k === act ? "dot" : "dot off");
    }));
    for (const zone of parts) for (const p of zone) { const v = tval(p.tw, now); if (v !== p.d) { p.d = v; p.draw(v); } }
    const z = tval(lift, now), s = clamp(tval(ang, now) * gain, -1, 1);
    if (z !== drawn[0]) {
      put(core, prism(P, front, coreO, coreI, 23, 23 + z));
      coreDots.forEach((el, k) => place(el, P((k - 1) * 2.4 * S2, (1 - k) * 2.4 * S2, 23 + z)));
    }
    if (s !== drawn[1]) { const a = rad(90 - s * SWING); needle.setAttribute("d", seg(D(0, 5), D(15 * Math.cos(a), 5 + 15 * Math.sin(a)))); }
    drawn = [z, s];
    return true; // ambient: signals keep riding the channels while the figure is on screen
  });
  bag.add(B.unregister);

  // hit test on the rest pose: each source's screen point at its middle height, which never moves
  const marks = SOURCES.map((s) => P(...s.hit)), eng = P(0, 0, 14);
  function hit([x, y]) {
    let best = -1, bd = Math.hypot(x - eng[0], y - eng[1]);
    marks.forEach((m, k) => { const d = Math.hypot(x - m[0], y - m[1]); if (d < bd && d < 64) { best = k; bd = d; } });
    return best;
  }
  function setActive(a) {
    if (a === act) return;
    const now = performance.now();
    act = a;
    tset(lift, a < 0 ? LIFT0 : LIFT1, now, 0);
    tset(ang, a < 0 ? BLEND : SOURCES[a].score, now, 0);
    parts.forEach((zone, k) => zone.forEach((p, i) => tset(p.tw, k === a ? SWELL : 0, now, Math.abs(i - SOURCES[k].key) * STEP)));
    chans.forEach((ch, k) => ch.rails.setAttribute("class", k === a ? "nf hi" : "nf lo"));
    keys.forEach((s, k) => s.sil.classList.toggle("hi", k === a));
    needle.setAttribute("class", a < 0 ? "nf hi" : "nf sil");
    const sc = a < 0 ? 0 : SOURCES[a].score;
    read.textContent = a < 0 ? "rest" : `${SOURCES[a].name} ${sc < 0 ? "−" : "+"}${Math.abs(sc).toFixed(2)}`;
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { gain = v; drawn = [drawn[0], NaN]; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "confluence",
  means: "Social, whale and news signals ride into one engine; point at a source to see how far it swings the sentiment dial.",
  rules: [1, 2, 4, 5],
  range: [0.5, 1, 1.4],
  tour: [[102, 175], [294, 167], [211, 96], null],
  mount,
});
