/**
 * Tide: whale flow between an exchange and cold storage. A tiered exchange
 * tower (order-book ladder on its face, a loading door, a beacon on the roof)
 * and a vault (round door with a wheel, hinges and bolts) stand at either end
 * of a railed track. Carts of coin stacks ride the rails, one of them a whale.
 * The pointer's place along the track sets the net flow on a spring: toward
 * the vault the carts haul coins into cold storage and the door wheel turns;
 * toward the exchange they run back and the sell side of the book grows.
 * Reserve gauges on both buildings follow the flow. At rest the flow is a mild
 * outflow (or the host's data-flow) and the vault door holds the bright. The slider is the top speed.
 */
const {
  Cam, circ, clamp, facing, fit, open, poly, prism, proj, ringAt, rings, run, seg, unproj,
  spring, stepS, disposer, mk, place, pointer, put, register, solid,
} = HL;

const F0 = 0.35, OPEN = 2.8, REACH = 42, WRAP0 = -64, WRAP1 = 62, NC = 4;
const EX = [-82, -20, -44, 20], TW = [-77, -15, -50, 15], VB = [40, -22, 80, 22], VT = [44, -18, 76, 18];
const ASK = [7, 10, 13, 9, 12], BID = [11, 14, 9, 12, 8];
// carts: stacks as [dx, dy, radius, height]; the third cart is the whale
const LOADS = [
  [[-3, -2, 2.6, 5], [3, 2, 2.6, 7]],
  [[-3, 1, 2.6, 6], [3, -1.5, 2.2, 4]],
  [[-2.5, 0, 4, 11], [4.2, -2.6, 2, 5]],
  [[0, 0, 3, 6]],
];

const at = (ring, cx, cy) => ring.map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let vmax = value;
  // a host page may pin the rest flow to live data with data-flow on the stage (-1 inflow … 1 outflow)
  const rest = Number.isFinite(parseFloat(stage.dataset.flow)) ? clamp(parseFloat(stage.dataset.flow), -1, 1) : F0;
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[-90, -28, -5], [88, 42, -5], [88, -28, -5], [-90, 42, -5], [-64, 0, 56], [60, 0, 32]], 200, 170);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const line = (d, cls, parent = g) => mk("path", { d, class: cls }, parent);
  const box = (b, r, inset, z0, z1, parent = g) => { const s = solid(parent), [o, i] = rings(b[0], b[1], b[2], b[3], r, inset); put(s, prism(P, front, o, i, z0, z1)); return s; };
  // a circle standing in the plane y = Y, centred at (u, z) = (x, h)
  const disc = (x, Y, h, r, n = 28) => Array.from({ length: n }, (_, k) => { const a = (k / n) * 6.2832; return P(x + r * Math.cos(a), Y, h + r * Math.sin(a)); });

  // the plinth, then the track bed with its sleepers and rails
  box([-90, -28, 88, 42], 10, 2.2, -5, 0);
  box([-46, -8, 44, 8], 2.5, 0.8, 0, 2);
  line(Array.from({ length: 15 }, (_, k) => seg(P(-42 + k * 6, -7, 2), P(-42 + k * 6, 7, 2))).join(""), "nf lo");
  const rails = line(seg(P(-46, -4.5, 2.4), P(44, -4.5, 2.4)) + seg(P(-46, 4.5, 2.4), P(44, 4.5, 2.4)), "nf");

  // the exchange: a broad base with a loading door, a tower, a roof unit and a beacon
  const exG = mk("g", {}, g);
  box(EX, 4, 1.6, 0, 18, exG);
  line(poly([[-8, 0], [8, 0], [8, 13], [-8, 13]].map(([u, v]) => P(-44, u, v))), "nf lo", exG);
  line(seg(P(-44, 0, 0), P(-44, 0, 13)), "nf lo", exG);
  box(TW, 3.5, 1.4, 18, 50, exG);
  line([26, 34, 42].map((z) => seg(P(-50, -13, z), P(-50, 13, z))).join(""), "nf lo", exG);
  box([-72, -9, -60, 3], 2, 0.8, 50, 54, exG);
  line(seg(P(-56, 8, 50), P(-56, 8, 62)), "nf", exG);
  place(mk("circle", { r: 1.5, class: "dot m" }, exG), P(-56, 8, 62.5));
  // the order book on the tower's front: a spine, asks above the spread, bids below
  line(seg(P(-74, 15, 21), P(-74, 15, 47)), "nf lo", exG);
  line(seg(P(-74, 15, 34), P(-71, 15, 34)), "nf", exG);
  const asks = line("", "nf lo", exG), bids = line("", "nf lo", exG);
  const exGauge = [0, 1, 2, 3, 4, 5].map((k) => { const el = mk("circle", { r: 1.1, class: "dot off" }, exG); place(el, P(-50, 0, 22 + k * 4.4)); return el; });

  // carts, re-sorted back to front as they pass each other
  const cartsG = mk("g", {}, g);
  const carts = LOADS.map((load, k) => {
    const cg = mk("g", {}, cartsG), body = solid(cg), wheels = line("", "nf lo", cg);
    const stacks = load.map(([dx, dy, r, h]) => ({ dx, dy, h, o: circ(r, 28), i: circ(r - 0.7, 28), s: solid(cg), rims: line("", "nf lo", cg) }));
    return { g: cg, body, wheels, stacks, x: WRAP0 + (k + 0.3) * ((WRAP1 - WRAP0) / NC), inside: false };
  });
  const [co, ci] = rings(-7.5, -6.5, 7.5, 6.5, 2.4, 1);
  function drawCart(c) {
    const x = c.x;
    put(c.body, prism(P, front, at(co, x, 0), at(ci, x, 0), 3, 9));
    c.wheels.setAttribute("d", [-4.5, 4.5].map((dx) => poly(disc(x + dx, 6.5, 3.4, 2.2, 14))).join(""));
    for (const st of c.stacks) {
      const o = at(st.o, x + st.dx, st.dy);
      put(st.s, prism(P, front, o, at(st.i, x + st.dx, st.dy), 9, 9 + st.h));
      const fr = run(o, front);
      st.rims.setAttribute("d", Array.from({ length: Math.ceil(st.h / 2) - 1 }, (_, k) => open(ringAt(P, fr, 11 + 2 * k))).join(""));
    }
    // inside the exchange the cart is painted before it, so the building hides it
    const inside = x < EX[2];
    if (inside !== c.inside) { c.inside = inside; if (inside) exG.before(c.g); }
  }

  // the vault: a slab, a heavy body, and a round door on its front with a wheel
  const vG = mk("g", {}, g);
  box(VB, 6, 1.6, 0, 3, vG);
  box(VT, 5, 1.6, 3, 33, vG);
  const DX = 59, DY = 18, DZ = 17, DR = 11.5, HX = DX - DR;
  // the doorway: its frame, the bolts round it, and the shelves inside, which the closed door covers
  line(poly(disc(DX, DY, DZ, DR + 1.6, 40)), "nf", vG);
  line(poly(disc(DX, DY, DZ, DR, 40)), "nf lo", vG);
  line([-4, 3].map((dz) => { const w = Math.sqrt(DR * DR - dz * dz) - 1; return seg(P(DX - w, DY, DZ + dz), P(DX + w, DY, DZ + dz)); }).join(""), "nf lo", vG);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.2832 + 0.39; place(mk("circle", { r: 0.7, class: "dot off" }, vG), P(DX + (DR + 3.2) * Math.cos(a), DY, DZ + (DR + 3.2) * Math.sin(a))); }
  line([DZ + 6, DZ - 6].map((z) => poly([[-1.2, -2], [1.2, -2], [1.2, 2], [-1.2, 2]].map(([u, v]) => P(HX - 1.6 + u, DY, z + v)))).join(""), "nf lo", vG);
  // the door, swung on its left hinge by th. Its outer face carries a ring, the wheel and its hub; its inner
  // face the locking bars. Whichever face looks at the viewer is painted last, and only its marks are drawn.
  const faces = [0, 1].map(() => { const fg = mk("g", {}, vG); return { g: fg, disc: line("", "lo", fg), marks: line("", "nf lo", fg), wheel: line("", "nf", fg) }; });
  const hubDot = mk("circle", { r: 1.3, class: "dot m" }, faces[0].g);
  const D = (th, s, z, off = 0) => P(HX + s * Math.cos(th) + off * Math.sin(th), DY + s * Math.sin(th) - off * Math.cos(th), z);
  const dDisc = (th, r, off = 0) => Array.from({ length: 40 }, (_, k) => { const a = (k / 40) * 6.2832; return D(th, DR + r * Math.cos(a), DZ + r * Math.sin(a), off); });
  let drawnDoor = NaN, doorHi = false, shown = -1;
  function drawDoor(th, turn) {
    const vis = Math.cos(th) - Math.sin(th) > 0 ? 0 : 1, [fo, ba] = faces;
    if (th !== drawnDoor) {
      drawnDoor = th;
      fo.disc.setAttribute("d", poly(dDisc(th, DR)));
      ba.disc.setAttribute("d", poly(dDisc(th, DR, 1.8)));
      if (vis !== shown) { shown = vis; vG.append(faces[1 - vis].g, faces[vis].g); if (vis === 0) fo.g.append(hubDot); else hubDot.remove(); }
      fo.marks.setAttribute("d", vis === 0 ? poly(dDisc(th, DR - 2.5)) : "");
      ba.marks.setAttribute("d", vis === 1 ? poly(dDisc(th, DR - 3, 1.8)) + [0, 1, 2, 3].map((k) => { const a = k * 1.5708 + 0.785; return seg(D(th, DR + 3 * Math.cos(a), DZ + 3 * Math.sin(a), 1.8), D(th, DR + 8 * Math.cos(a), DZ + 8 * Math.sin(a), 1.8)); }).join("") : "");
      if (vis === 0) place(hubDot, D(th, DR, DZ));
      faces.forEach((f, k) => f.disc.setAttribute("class", k === vis ? (doorHi ? "sil hi" : "sil") : "lo"));
    }
    fo.wheel.setAttribute("d", vis === 0 ? [0, 1, 2].map((k) => { const a = turn + (k * 6.2832) / 3; return seg(D(th, DR - 6 * Math.cos(a), DZ - 6 * Math.sin(a)), D(th, DR + 6 * Math.cos(a), DZ + 6 * Math.sin(a))); }).join("") : "");
  }
  const vGauge = [0, 1, 2, 3, 4, 5].map((k) => { const el = mk("circle", { r: 1.1, class: "dot off" }, vG); place(el, P(76, 0, 7 + k * 4.4)); return el; });

  const flow = spring(rest, { eps: 0.002 });
  let turn = 0, drawnF = NaN, mode = "";

  function drawBook(f) {
    const bar = (rows, z0, grow) => rows.map((b, k) => seg(P(-73, 15, z0 - k * 2.6), P(-73 + clamp(b * grow, 2, 22), 15, z0 - k * 2.6))).join("");
    asks.setAttribute("d", bar(ASK, 46, 0.75 - 0.5 * f));
    bids.setAttribute("d", bar(BID, 31, 0.75 + 0.5 * f));
    const lv = Math.round(clamp(3 + f * 3, 0, 6));
    vGauge.forEach((el, k) => el.setAttribute("class", k < lv ? "dot m" : "dot off"));
    exGauge.forEach((el, k) => el.setAttribute("class", k < 6 - lv ? "dot m" : "dot off"));
  }

  const B = register(stage, (dt) => {
    stepS(flow, dt);
    const f = flow.x, v = f * vmax, span = WRAP1 - WRAP0;
    for (const c of carts) {
      c.x += v * dt;
      if (c.x > WRAP1) c.x -= span;
      if (c.x < WRAP0) c.x += span;
      drawCart(c);
    }
    // re-append the carts that are out on the track in order of x, back to front
    carts.filter((c) => !c.inside).sort((a, b) => a.x - b.x).forEach((c) => cartsG.append(c.g));
    turn += Math.max(0, f) * vmax * dt * 0.08;
    // a steep curve, so the door spends little time edge-on to the camera
    drawDoor(Math.pow(clamp((f - 0.4) / 0.5, 0, 1), 0.4) * OPEN, turn);
    if (f !== drawnF) { drawnF = f; drawBook(f); }
    return true; // ambient: the carts keep running while the figure is on screen
  });
  bag.add(B.unregister);

  // the bright follows the flow's target, never its moving value
  function retarget(t, over) {
    flow.t = t;
    const m = t > 0.15 ? "out" : t < -0.15 ? "in" : "flat";
    if (m !== mode) {
      mode = m;
      doorHi = m === "out"; drawnDoor = NaN;
      asks.classList.toggle("hi", m === "in");
      rails.classList.toggle("hi", m === "flat");
    }
    read.textContent = !over ? "rest" : m === "flat" ? "flat" : `${m === "out" ? "outflow" : "inflow"} ${Math.round(Math.abs(t) * 100)}%`;
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { const w = unproj(C, p[0], p[1], 0); retarget(clamp(w[0] / REACH, -1, 1), true); },
    leave: () => retarget(rest, false),
  }));
  bag.add(() => svg.replaceChildren());
  retarget(rest, false);

  return {
    set: (v) => { vmax = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "tide",
  means: "Carts of coins run between an exchange and a vault; the pointer sets which way the whales are moving, and how hard.",
  rules: [1, 3, 4, 5, 9],
  range: [10, 22, 40],
  tour: [[290, 222], [120, 140], [205, 182], null],
  mount,
});
