(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_FORM = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Massing form operations on a rectangular block (shape 'box'), stored as b.form:
  //   court : {w, d, ox, oz, f0}          courtyard void w×d (m), centre offset ox/oz from the block centre,
  //                                        open from floor f0 upward (0 = from the ground, open to the sky)
  //   steps : [{at, f, b, r, l}]           step-backs: from floor `at` (1 = the 2nd floor) upward the outline is
  //                                        set back from the ORIGINAL edges by f/b/r/l metres (absolute, not cumulative)
  //   ch    : {r, c:{fr,fl,bl,br}}         plan chamfer of size r (m) on the chosen vertical corners
  //   slope : {a, dir}                     mono-pitch roof over the top floor at angle a (°), falling toward side dir
  // Local axes (before b.rot): +x = r(ight), -x = l(eft), +z = f(ront), -z = b(ack).
  // Everything (3D mesh, plans, sections, shadows, areas, exports) is derived from tiers() so they always agree.

  const SIDES = ['f', 'b', 'r', 'l'];
  const CORNERS = ['bl', 'br', 'fr', 'fl'];
  const MIN_W = 2;     // narrowest tier left after step-backs (m)
  const WALL = 1;      // thinnest wing kept around a courtyard (m)
  const MIN_VOID = 1;  // smallest courtyard side that is still a void (m)
  const MAX_RISE = 40; // cap for the sloped roof rise (m)

  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r3 = v => Math.round(v * 1000) / 1000;

  function supports(b) { return !!b && (b.shape || 'box') === 'box'; }

  function clampPair(o, a, b, span) {
    const room = Math.max(0, span - MIN_W);
    const s = o[a] + o[b];
    if (s > room) { const k = s > 0 ? room / s : 0; o[a] = r3(o[a] * k); o[b] = r3(o[b] * k); }
  }

  /** validated copy of b.form (or null when the block has no active operation) */
  function norm(b) {
    if (!supports(b) || !b.form || typeof b.form !== 'object') return null;
    const F = b.form, w = Math.max(.3, num(b.w, 1)), d = Math.max(.3, num(b.d, 1));
    const floors = Math.max(1, Math.round(num(b.f, 1)));
    const out = { court: null, steps: [], ch: null, slope: null };
    if (Array.isArray(F.steps)) {
      const byAt = new Map();
      F.steps.forEach(s => {
        if (!s) return;
        const at = Math.round(num(s.at, 0));
        if (at < 1 || at >= floors) return;
        const o = { at };
        SIDES.forEach(k => { o[k] = Math.max(0, num(s[k], 0)); });
        clampPair(o, 'l', 'r', w); clampPair(o, 'f', 'b', d);
        byAt.set(at, o);
      });
      out.steps = [...byAt.values()].sort((a, c) => a.at - c.at);
    }
    if (F.court && F.court.on !== false) {
      const cw = num(F.court.w, 0), cd = num(F.court.d, 0);
      if (cw >= MIN_VOID && cd >= MIN_VOID) {
        out.court = { w: cw, d: cd, ox: num(F.court.ox, 0), oz: num(F.court.oz, 0), f0: clamp(Math.round(num(F.court.f0, 0)), 0, floors - 1) };
      }
    }
    if (F.ch && num(F.ch.r, 0) > 0) {
      const c = F.ch.c || {}, cs = {};
      let any = false;
      CORNERS.forEach(k => { cs[k] = c[k] !== false; any = any || cs[k]; });
      if (any) out.ch = { r: num(F.ch.r, 0), c: cs };
    }
    if (F.slope && num(F.slope.a, 0) > 0) {
      out.slope = { a: clamp(num(F.slope.a, 0), 1, 75), dir: SIDES.includes(F.slope.dir) ? F.slope.dir : 'f' };
    }
    if (!out.court && !out.steps.length && !out.ch && !out.slope) return null;
    return out;
  }

  function has(b) { return !!norm(b); }
  /** does the form change the outer outline (so rectangular facade panels no longer fit)? */
  function changesOutline(b) { const n = norm(b); return !!(n && (n.steps.length || n.ch)); }

  function ringArea(P) {
    let a = 0;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]);
    return Math.abs(a / 2);
  }
  function ringPerim(P) {
    let s = 0;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) s += Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
    return s;
  }
  function pip(P, x, z) {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [xi, zi] = P[i], [xj, zj] = P[j];
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) c = !c;
    }
    return c;
  }

  function chamferSize(ch, rect) {
    if (!ch) return 0;
    return Math.max(0, Math.min(ch.r, Math.min(rect.x1 - rect.x0, rect.z1 - rect.z0) * 0.45));
  }

  /** outline of a (set-back) rectangle with its chamfered corners, counter-clockwise in (x,z) */
  function outline(rect, ch) {
    const r = chamferSize(ch, rect);
    const { x0, x1, z0, z1 } = rect;
    const corner = {
      bl: [[x0, z0 + r], [x0 + r, z0]],
      br: [[x1 - r, z0], [x1, z0 + r]],
      fr: [[x1, z1 - r], [x1 - r, z1]],
      fl: [[x0 + r, z1], [x0, z1 - r]]
    };
    const plain = { bl: [x0, z0], br: [x1, z0], fr: [x1, z1], fl: [x0, z1] };
    const P = [];
    CORNERS.forEach(k => {
      if (r > 0.01 && ch.c[k]) corner[k].forEach(p => P.push(p));
      else P.push(plain[k]);
    });
    return P;
  }

  /** the courtyard void that fits inside this tier (keeps WALL m of building on every side, clear of chamfers) */
  function fitHole(court, rect, ch) {
    let hx0 = Math.max(court.ox - court.w / 2, rect.x0 + WALL), hx1 = Math.min(court.ox + court.w / 2, rect.x1 - WALL);
    let hz0 = Math.max(court.oz - court.d / 2, rect.z0 + WALL), hz1 = Math.min(court.oz + court.d / 2, rect.z1 - WALL);
    const r = chamferSize(ch, rect);
    if (r > 0.01) {
      const need = r + WALL * Math.SQRT2;
      const fix = (k, gx, gz) => {
        if (!ch.c[k]) return;
        // gx/gz: distance from the tier corner to the nearest hole corner along x and z
        const g = gx() + gz();
        if (g >= need) return;
        const dlt = (need - g) / 2;
        if (k === 'bl') { hx0 += dlt; hz0 += dlt; }
        if (k === 'br') { hx1 -= dlt; hz0 += dlt; }
        if (k === 'fr') { hx1 -= dlt; hz1 -= dlt; }
        if (k === 'fl') { hx0 += dlt; hz1 -= dlt; }
      };
      fix('bl', () => hx0 - rect.x0, () => hz0 - rect.z0);
      fix('br', () => rect.x1 - hx1, () => hz0 - rect.z0);
      fix('fr', () => rect.x1 - hx1, () => rect.z1 - hz1);
      fix('fl', () => hx0 - rect.x0, () => rect.z1 - hz1);
    }
    if (hx1 - hx0 < MIN_VOID || hz1 - hz0 < MIN_VOID) return null;
    return { x0: hx0, x1: hx1, z0: hz0, z1: hz1 };
  }
  const rectRing = q => [[q.x0, q.z0], [q.x1, q.z0], [q.x1, q.z1], [q.x0, q.z1]];

  /**
   * Horizontal tiers of the block, bottom to top, in local coordinates (y measured from b.y0).
   * Each tier: {f0,f1 (floor range, f1 exclusive), y0,y1, rect, outer, hole|null, holeRect|null, area}
   */
  function tiers(b, fh) {
    fh = num(fh, 4) > 0 ? num(fh, 4) : 4;
    const n = norm(b) || { court: null, steps: [], ch: null, slope: null };
    const w = Math.max(.3, num(b.w, 1)), d = Math.max(.3, num(b.d, 1)), W = w / 2, D = d / 2;
    const floors = Math.max(1, Math.round(num(b.f, 1)));
    const cuts = new Set([0, floors]);
    n.steps.forEach(s => cuts.add(s.at));
    if (n.court && n.court.f0 > 0) cuts.add(n.court.f0);
    const at = [...cuts].sort((a, c) => a - c);
    const out = [];
    for (let i = 0; i < at.length - 1; i++) {
      const f0 = at[i], f1 = at[i + 1];
      let sb = { f: 0, b: 0, r: 0, l: 0 };
      n.steps.forEach(s => { if (s.at <= f0) sb = s; });
      const rect = { x0: -W + sb.l, x1: W - sb.r, z0: -D + sb.b, z1: D - sb.f };
      const outer = outline(rect, n.ch);
      const holeRect = n.court && f0 >= n.court.f0 ? fitHole(n.court, rect, n.ch) : null;
      const hole = holeRect ? rectRing(holeRect) : null;
      const area = ringArea(outer) - (hole ? ringArea(hole) : 0);
      const prev = out[out.length - 1];
      const same = prev && JSON.stringify([prev.rect, prev.holeRect]) === JSON.stringify([rect, holeRect]);
      if (same) { prev.f1 = f1; prev.y1 = f1 * fh; continue; }
      out.push({ f0, f1, y0: f0 * fh, y1: f1 * fh, rect, outer, hole, holeRect, area });
    }
    return out;
  }

  /** sloped roof on the top tier: {rise, a, dir, low, axis, span} — height above the top floor at local (x,z) = rise*t */
  function roof(b, fh) {
    const n = norm(b);
    if (!n || !n.slope) return null;
    const T = tiers(b, fh);
    const top = T[T.length - 1];
    const q = top.rect;
    const along = (n.slope.dir === 'f' || n.slope.dir === 'b') ? 'z' : 'x';
    const span = along === 'z' ? q.z1 - q.z0 : q.x1 - q.x0;
    const rise = Math.min(MAX_RISE, Math.tan(n.slope.a * Math.PI / 180) * span);
    return { rise, a: n.slope.a, dir: n.slope.dir, along, span, rect: q };
  }
  /** 0 on the low side (the side the roof falls toward), 1 on the high side */
  function roofT(rf, x, z) {
    const q = rf.rect;
    let t;
    switch (rf.dir) {
      case 'f': t = (q.z1 - z) / (q.z1 - q.z0); break;
      case 'b': t = (z - q.z0) / (q.z1 - q.z0); break;
      case 'r': t = (q.x1 - x) / (q.x1 - q.x0); break;
      default: t = (x - q.x0) / (q.x1 - q.x0);
    }
    return clamp(t, 0, 1);
  }
  function roofRise(b, fh) { const rf = roof(b, fh); return rf ? rf.rise : 0; }

  function tierOfFloor(T, k) { return T.find(t => k >= t.f0 && k < t.f1) || T[T.length - 1]; }

  function floorArea(b, fh, k) { return tierOfFloor(tiers(b, fh), k).area; }
  function footArea(b, fh) { return tiers(b, fh)[0].area; }
  function gfa(b, fh) { return tiers(b, fh).reduce((s, t) => s + t.area * (t.f1 - t.f0), 0); }

  /** point (local) inside the floor plate of floor k */
  function insideLocal(b, fh, lx, lz, k) {
    const t = tierOfFloor(tiers(b, fh), k || 0);
    if (!pip(t.outer, lx, lz)) return false;
    return !(t.hole && pip(t.hole, lx, lz));
  }

  function centroid(rings) {
    let A = 0, cx = 0, cz = 0;
    rings.forEach((P, idx) => {
      let a = 0, x = 0, z = 0;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        const c = P[j][0] * P[i][1] - P[i][0] * P[j][1];
        a += c; x += (P[j][0] + P[i][0]) * c; z += (P[j][1] + P[i][1]) * c;
      }
      a /= 2;
      if (Math.abs(a) < 1e-9) return;
      const sgn = (idx === 0 ? 1 : -1) * Math.sign(a);
      const ax = x / (6 * a), az = z / (6 * a);
      A += sgn * Math.abs(a); cx += sgn * Math.abs(a) * ax; cz += sgn * Math.abs(a) * az;
    });
    return A > 1e-9 ? [cx / A, cz / A] : [0, 0];
  }

  /** volume, envelope, perimeter, footprint and GFA — used by mass analysis (S/V) and the area schedule */
  function metrics(b, fh) {
    fh = num(fh, 4) > 0 ? num(fh, 4) : 4;
    const T = tiers(b, fh), rf = roof(b, fh);
    let volume = 0, walls = 0, terraces = 0;
    T.forEach((t, i) => {
      const h = t.y1 - t.y0;
      volume += t.area * h;
      walls += (ringPerim(t.outer) + (t.hole ? ringPerim(t.hole) : 0)) * h;
      const up = T[i + 1];
      terraces += Math.max(0, t.area - (up ? up.area : 0));
    });
    const top = T[T.length - 1];
    let roofArea = top.area;
    if (rf) {
      const rings = [top.outer].concat(top.hole ? [top.hole] : []);
      const [cx, cz] = centroid(rings);
      volume += top.area * rf.rise * roofT(rf, cx, cz);
      roofArea = top.area / Math.cos(rf.a * Math.PI / 180);
      // gable-end walls of the roof wedge (approximate: average rise over the outline)
      walls += (ringPerim(top.outer) + (top.hole ? ringPerim(top.hole) : 0)) * rf.rise * 0.5;
    }
    terraces = terraces - top.area + roofArea; // the top tier's exposed area is its (sloped) roof
    const footprint = T[0].area;
    return {
      footprint, gfa: gfa(b, fh), volume, perimeter: ringPerim(T[0].outer) + (T[0].hole ? ringPerim(T[0].hole) : 0),
      envelope: walls + terraces, roofArea, height: T[T.length - 1].y1 + (rf ? rf.rise : 0), tiers: T.length
    };
  }

  // ---- world-space helpers (rotation matches the app: group.rotation.y = -(rot)°) ----
  function toWorld(b) {
    const th = -num(b.rot, 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), bx = num(b.x, 0), bz = num(b.z, 0);
    return ([x, z]) => [bx + x * c + z * s, bz - x * s + z * c];
  }
  function toLocal(b) {
    const a = num(b.rot, 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), bx = num(b.x, 0), bz = num(b.z, 0);
    return (wx, wz) => { const u = wx - bx, v = wz - bz; return [u * c + v * s, -u * s + v * c]; };
  }
  /** rings (outer + hole) of floor k in world (x,z) */
  function worldRings(b, fh, k) {
    const t = tierOfFloor(tiers(b, fh), k || 0), W = toWorld(b);
    return [t.outer].concat(t.hole ? [t.hole] : []).map(r => r.map(W));
  }

  /**
   * Vertical prisms in world space for section cuts and shadow rays:
   * [{y0,y1 (absolute), rings (world), top?:fn(wx,wz)->absolute roof height}] — top only on the sloped top tier.
   */
  function prisms(b, fh) {
    const T = tiers(b, fh), W = toWorld(b), Lc = toLocal(b), y0 = num(b.y0, 0), rf = roof(b, fh);
    return T.map((t, i) => {
      const p = { y0: y0 + t.y0, y1: y0 + t.y1, yWall: y0 + t.y1, rings: [t.outer].concat(t.hole ? [t.hole] : []).map(r => r.map(W)), local: t };
      if (rf && i === T.length - 1) {
        const yTop = p.y1;
        p.y1 = yTop + rf.rise;
        p.top = (wx, wz) => { const [lx, lz] = Lc(wx, wz); return yTop + rf.rise * roofT(rf, lx, lz); };
      }
      return p;
    });
  }

  /** rings of a prism cut at height y (world); through a sloped top only the part still under the roof is kept */
  function cutRingsAt(p, y) {
    if (y < p.y0 - 1e-6 || y > p.y1 + 1e-6) return [];
    if (!p.top || y <= p.yWall) return p.rings.map(r => r.slice());
    const out = [];
    p.rings.forEach(R => {
      const g = R.map(([x, z]) => p.top(x, z) - y), Q = [];
      for (let i = 0; i < R.length; i++) {
        const j = (i + 1) % R.length, a = R[i], b = R[j], ga = g[i], gb = g[j];
        if (ga >= 0) Q.push(a);
        if ((ga >= 0) !== (gb >= 0)) { const t = ga / (ga - gb); Q.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      }
      if (Q.length >= 3 && ringArea(Q) > 1e-6) out.push(Q);
      else if (!out.length) out.push(null); // outer ring vanished: nothing is cut
    });
    if (!out.length || !out[0]) return [];
    return out.filter(Boolean);
  }

  /** precomputed point tests for ray marching (shadow-hours heat map): local plan test of floor 0 and a world 3D test */
  function solid(b, fh) {
    const T = tiers(b, fh), rf = roof(b, fh), Lc = toLocal(b), y0 = num(b.y0, 0), top = T[T.length - 1];
    const inT = (t, lx, lz) => pip(t.outer, lx, lz) && !(t.hole && pip(t.hole, lx, lz));
    return {
      height: top.y1 + (rf ? rf.rise : 0),
      insidePlan0: (lx, lz) => inT(T[0], lx, lz),
      inside3D: (wx, wy, wz) => {
        const ly = wy - y0;
        if (ly < 0) return false;
        const [lx, lz] = Lc(wx, wz);
        let t = T.find(q => ly >= q.y0 && ly <= q.y1);
        if (!t) {
          if (!rf || ly > top.y1 + rf.rise) return false;
          t = top;
          if (ly > top.y1 + rf.rise * roofT(rf, lx, lz)) return false;
        }
        return inT(t, lx, lz);
      }
    };
  }
  /** point inside the solid (world coords) */
  function insideWorld3D(b, fh, wx, wy, wz) { return solid(b, fh).inside3D(wx, wy, wz); }

  /** split a formed block into one block per floor (same look, the form carried over where it still applies) */
  function splitFloors(b, fh) {
    const n = norm(b);
    const floors = Math.max(1, Math.round(num(b.f, 1)));
    const T = tiers(b, fh), W = toWorld(b);
    const out = [];
    for (let k = 0; k < floors; k++) {
      const t = tierOfFloor(T, k), q = t.rect;
      const cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2;
      const [wx, wz] = W([cx, cz]);
      const form = {};
      if (n && n.ch) form.ch = { r: n.ch.r, c: Object.assign({}, n.ch.c) };
      if (t.holeRect) {
        const h = t.holeRect;
        form.court = { w: r3(h.x1 - h.x0), d: r3(h.z1 - h.z0), ox: r3((h.x0 + h.x1) / 2 - cx), oz: r3((h.z0 + h.z1) / 2 - cz), f0: 0 };
      }
      if (n && n.slope && k === floors - 1) form.slope = { a: n.slope.a, dir: n.slope.dir };
      out.push({ k, w: r3(q.x1 - q.x0), d: r3(q.z1 - q.z0), x: r3(wx), z: r3(wz), form: Object.keys(form).length ? form : null });
    }
    return out;
  }

  /** evenly spaced terraces: every `every` floors set back `dist` m more on the chosen sides (cumulative) */
  function autoSteps({ floors, every, dist, sides }) {
    floors = Math.max(1, Math.round(num(floors, 1)));
    every = Math.max(1, Math.round(num(every, 1)));
    dist = Math.max(0, num(dist, 0));
    const on = SIDES.filter(k => sides && sides[k]);
    const out = [];
    for (let at = every, i = 1; at < floors; at += every, i++) {
      const s = { at, f: 0, b: 0, r: 0, l: 0 };
      on.forEach(k => { s[k] = r3(dist * i); });
      out.push(s);
    }
    return out;
  }

  /** compass name of each local side, given the block rotation and the site north angle (degrees) */
  function sideCompass(rotDeg, northDeg) {
    const th = -num(rotDeg, 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    const N8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const v = { f: [0, 1], b: [0, -1], r: [1, 0], l: [-1, 0] }, out = {};
    SIDES.forEach(k => {
      const [x, z] = v[k];
      const wx = x * c + z * s, wz = -x * s + z * c;
      let br = Math.atan2(wx, -wz) * 180 / Math.PI - num(northDeg, 0);
      br = ((br % 360) + 360) % 360;
      out[k] = N8[Math.round(br / 45) % 8];
    });
    return out;
  }

  /**
   * the form after the app's 90° turn (w and d swap; new local (x,z) = (-z, x)):
   * right→front, front→left, left→back, back→right
   */
  function rotForm90(form) {
    if (!form || typeof form !== 'object') return form;
    const S = { r: 'f', f: 'l', l: 'b', b: 'r' }, C = { fr: 'fl', fl: 'bl', bl: 'br', br: 'fr' };
    const out = JSON.parse(JSON.stringify(form));
    if (out.court) { const c = out.court; [c.w, c.d] = [c.d, c.w]; [c.ox, c.oz] = [-num(c.oz, 0), num(c.ox, 0)]; }
    if (Array.isArray(out.steps)) out.steps = out.steps.map(s => { const o = { at: s.at }; SIDES.forEach(k => { o[S[k]] = s[k] || 0; }); return o; });
    if (out.ch && out.ch.c) { const c = {}; CORNERS.forEach(k => { c[C[k]] = out.ch.c[k]; }); out.ch.c = c; }
    if (out.slope && S[out.slope.dir]) out.slope.dir = S[out.slope.dir];
    return out;
  }

  /** summary for the UI: effective courtyard per tier, number of tiers, roof rise */
  function info(b, fh) {
    const T = tiers(b, fh), rf = roof(b, fh);
    const holes = T.filter(t => t.holeRect).map(t => ({ f0: t.f0, f1: t.f1, w: r3(t.holeRect.x1 - t.holeRect.x0), d: r3(t.holeRect.z1 - t.holeRect.z0), area: r3(ringArea(t.hole)) }));
    return { tiers: T.map(t => ({ f0: t.f0, f1: t.f1, w: r3(t.rect.x1 - t.rect.x0), d: r3(t.rect.z1 - t.rect.z0), area: r3(t.area) })), holes, rise: rf ? r3(rf.rise) : 0, gfa: r3(gfa(b, fh)), foot: r3(T[0].area) };
  }

  return {
    SIDES, CORNERS, MIN_W, WALL, supports, norm, has, changesOutline, tiers, roof, roofT, roofRise, floorArea, footArea, gfa,
    insideLocal, metrics, worldRings, prisms, cutRingsAt, solid, insideWorld3D, splitFloors, autoSteps, sideCompass, rotForm90, info, ringArea, pip
  };
});
