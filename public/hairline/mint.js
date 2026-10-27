/**
 * Mint: one thick coin hanging at an angle, face tilted back toward the
 * viewer's left so its reeded edge shows along the lower right. The asset's
 * mark is built on the face as a relief: the bitcoin B with its ticks, the
 * ether diamond with its facet line, or the three solana bars (the host picks
 * one with data-coin on the stage). The pointer leans the coin toward it, two
 * springs on its heading and pitch. At rest the mark holds the bright; while
 * the pointer leans the coin, the bright moves to the face's rim. The slider
 * is the largest lean, in degrees.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, rad, spring, stepS, disposer, mk, pointer, register,
} = HL;

const TURN_C = Math.cos(0.5), TURN_S = Math.sin(0.5);
const R = 40, T = 9, BEV = 1.4, CZ = 52, AZ0 = 108, EL0 = 50, N = 72;
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
const arc = (cx, cy, r, a0, a1, k = 10) => Array.from({ length: k + 1 }, (_, i) => { const a = rad(a0 + ((a1 - a0) * i) / k); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });

// each mark: [points, closed] strokes in face units (-1…1, v up)
const MARKS = {
  btc: [
    [[[-0.32, -0.62], [-0.32, 0.62]], false],
    [[[-0.32, 0.62], [0.1, 0.62], ...arc(0.1, 0.33, 0.29, 90, -90), [-0.32, 0.04]], false],
    [[[-0.32, 0.04], [0.14, 0.04], ...arc(0.14, -0.29, 0.33, 90, -90), [-0.32, -0.62]], false],
    [[[-0.14, 0.62], [-0.14, 0.8]], false], [[[0.06, 0.62], [0.06, 0.8]], false],
    [[[-0.14, -0.62], [-0.14, -0.8]], false], [[[0.06, -0.62], [0.06, -0.8]], false],
  ],
  eth: [
    [[[0, 0.84], [0.44, 0.06], [0, -0.2], [-0.44, 0.06]], true],
    [[[-0.44, 0.06], [0, 0.27], [0.44, 0.06]], false],
    [[[0, 0.84], [0, -0.2]], false],
    [[[-0.44, -0.12], [0, -0.84], [0.44, -0.12], [0, -0.37]], true],
  ],
  // three parallelograms: the outer two lean one way, the middle one the other
  sol: [-0.42, 0, 0.42].map((y, i) => {
    const k = (i === 1 ? -1 : 1) * 0.14, h = 0.11;
    return [[[-0.56 + k, y + h], [0.56 + k, y + h], [0.56 - k, y - h], [-0.56 - k, y - h]], true];
  }),
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lean = value;
  const coin = MARKS[stage.dataset.coin] ? stage.dataset.coin : "btc";
  const C = Cam(45, 0.5, 2.25);
  fit(C, [[-R, -R, CZ - R - 8], [R, R, CZ + R], [R, -R, CZ], [-R, R, CZ]], 200, 160);
  const P = proj(C);
  // the direction toward the camera: perpendicular to both screen axes, pointing up
  const o = P(0, 0, 0), sx = P(1, 0, 0), sy = P(0, 1, 0), sz = P(0, 0, 1);
  const ax = [sx[0] - o[0], sy[0] - o[0], sz[0] - o[0]], ay = [sx[1] - o[1], sy[1] - o[1], sz[1] - o[1]];
  let VIEW = unit(cross(ax, ay));
  if (VIEW[2] < 0) VIEW = VIEW.map((c) => -c);
  const C0 = [0, 0, CZ];

  const g = mk("g", {}, svg);
  const line = (cls) => mk("path", { class: cls }, g);
  // a dashed guide on the ground under the coin: where it hangs
  mk("path", { class: "dash nf", d: poly(Array.from({ length: 48 }, (_, k) => { const a = (k / 48) * 6.2832; return P(R * 0.62 * Math.cos(a), R * 0.62 * Math.sin(a), 0); })) }, g);
  mk("path", { class: "dash nf lo", d: open([P(0, 0, 0), P(0, 0, CZ - R - 2)]) }, g);
  const body = line("sil"), reeds = line("nf lo"), rim = line("nf"), crease = line("nf lo"), glyph = line("nf hi");

  const az = spring(AZ0), el = spring(EL0);
  let drawn = "";

  function draw() {
    const key = az.x.toFixed(3) + "," + el.x.toFixed(3);
    if (key === drawn) return;
    drawn = key;
    const a = rad(az.x), e = rad(el.x);
    let n = [Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)];
    let u = [-Math.sin(a), Math.cos(a), 0];
    // show the face that looks at the camera; flip u with it so the mark never reads mirrored
    if (dot(n, VIEW) < 0) { n = n.map((c) => -c); u = u.map((c) => -c); }
    // (u, v) as the face is read: v up the mark, u to its right
    const v = cross(n, u), ur = u.map((c) => -c);
    const at = (r, ang, off) => P(...add(add(add(C0, n, off), u, r * Math.cos(ang)), v, r * Math.sin(ang)));
    const ring = (r, off) => Array.from({ length: N }, (_, k) => at(r, (k / N) * 6.2832, off));
    // the body: the hull of four rings, the rim's edges rounded by a bevel
    body.setAttribute("d", poly(hull([...ring(R - BEV, T / 2), ...ring(R, T / 2 - BEV), ...ring(R, -T / 2 + BEV), ...ring(R - BEV, -T / 2)])));
    // reeding: short ridges across the rim wherever the rim turns toward the camera
    let rd = "";
    for (let k = 0; k < 120; k++) {
      const ang = (k / 120) * 6.2832, radial = add([0, 0, 0], add(u.map((c) => c * Math.cos(ang)), v, Math.sin(ang)));
      if (dot(radial, VIEW) < 0.18) continue;
      rd += open([at(R, ang, T / 2 - BEV - 0.6), at(R, ang, -T / 2 + BEV + 0.6)]);
    }
    reeds.setAttribute("d", rd);
    rim.setAttribute("d", poly(ring(R - BEV, T / 2)));
    crease.setAttribute("d", poly(ring(R - 6.5, T / 2)));
    const S = R * 0.52;
    glyph.setAttribute("d", MARKS[coin].map(([pts, closed]) => {
      // turned a little on the face so the mark stands nearer upright on screen
      const q = pts.map(([pu, pv]) => {
        const gu = pu * TURN_C - pv * TURN_S, gv = pu * TURN_S + pv * TURN_C;
        return P(...add(add(add(C0, n, T / 2), ur, gu * S), v, gv * S));
      });
      return closed ? poly(q) : open(q);
    }).join(""));
  }

  const B = register(stage, (dt) => {
    const m1 = stepS(az, dt), m2 = stepS(el, dt);
    draw();
    return m1 || m2;
  });
  bag.add(B.unregister);

  let over = null;
  function retarget() {
    if (over) {
      const dx = clamp((over[0] - 200) / 150, -1, 1), dy = clamp((over[1] - 160) / 120, -1, 1);
      az.t = AZ0 + dx * lean;
      el.t = EL0 - dy * lean * 0.7;
      read.textContent = `lean ${Math.round(Math.hypot(dx, dy * 0.7) * lean)}°`;
    } else {
      az.t = AZ0; el.t = EL0;
      read.textContent = "rest";
    }
    glyph.classList.toggle("hi", !over);
    rim.classList.toggle("hi", !!over);
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = p; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  draw();
  retarget();

  return {
    set: (v) => { lean = v; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "mint",
  means: "A coin hangs at an angle, its asset's mark in relief on the face; it leans toward the pointer.",
  rules: [3, 4, 5, 10],
  range: [12, 26, 42],
  tour: [[300, 120], [110, 210], [210, 260], null],
  mount,
});
