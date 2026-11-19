(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_CODE = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Rough planning checks for a massing model (not a substitute for the building code):
  // parking, escape travel distance to a vertical core, lifts and escape stairs.
  const DEFAULT_OPTS = {
    parkM2: 50,      // gross floor area per required parking space
    spaceM2: 25,     // asphalt area per provided space (bay + share of aisle)
    escapeMax: 45,   // max travel distance to an escape stair / core (m)
    liftM2: 2500,    // upper-floor gross area served by one passenger lift
    serviceLift: 1   // extra stretcher / service lift for a medical training building
  };

  const PROPS = ['tree', 'person', 'car'];
  const FLAT = ['green', 'paving', 'asphalt', 'water'];

  function opts(o) {
    const src = o && typeof o === 'object' ? o : {};
    const out = {};
    Object.keys(DEFAULT_OPTS).forEach(k => {
      const v = Number(src[k]);
      out[k] = Number.isFinite(v) && v >= 0 ? v : DEFAULT_OPTS[k];
    });
    out.parkM2 = Math.max(5, out.parkM2);
    out.spaceM2 = Math.max(5, out.spaceM2);
    out.escapeMax = Math.max(5, out.escapeMax);
    out.liftM2 = Math.max(100, out.liftM2);
    return out;
  }

  function defaultCounts(b) {
    return !!b && !b.hidden && !PROPS.includes(b.shape) && !FLAT.includes(b.mat) && b.shape !== 'riwaq' && b.mat !== 'context';
  }

  function isCore(b) {
    return b.mat === 'joint' || (b.fn || '') === 'circ';
  }

  // same footprint frame as the 3D model: local x/z axes rotated by (ry for non-box shapes) + rot
  function frame(b) {
    const rotDeg = ((b.shape === 'box' || b.shape === 'riwaq') ? 0 : (Number(b.ry) || 0)) + (Number(b.rot) || 0);
    const swap = Math.abs((b.shape === 'box' || b.shape === 'riwaq') ? 0 : (Number(b.ry) || 0)) % 180 !== 0;
    const w = Math.max(0.5, Number(swap ? b.d : b.w) || 10);
    const d = Math.max(0.5, Number(swap ? b.w : b.d) || 10);
    const rad = (-rotDeg * Math.PI) / 180;
    return { cx: Number(b.x) || 0, cz: Number(b.z) || 0, hw: w / 2, hd: d / 2, ux: [Math.cos(rad), -Math.sin(rad)], uz: [Math.sin(rad), Math.cos(rad)] };
  }

  function toLocal(f, x, z) {
    const dx = x - f.cx, dz = z - f.cz;
    return [dx * f.ux[0] + dz * f.ux[1], dx * f.uz[0] + dz * f.uz[1]];
  }

  function toWorld(f, lx, lz) {
    return [f.cx + f.ux[0] * lx + f.uz[0] * lz, f.cz + f.ux[1] * lx + f.uz[1] * lz];
  }

  // corridor-like (rectilinear) distance from a point to a core footprint; 0 when inside
  function distToCore(core, x, z) {
    const [lx, lz] = toLocal(core, x, z);
    return Math.max(0, Math.abs(lx) - core.hw) + Math.max(0, Math.abs(lz) - core.hd);
  }

  // corners, edge midpoints and centre of a footprint
  function samplePoints(f) {
    const pts = [];
    [-1, 0, 1].forEach(i => [-1, 0, 1].forEach(j => pts.push(toWorld(f, i * f.hw, j * f.hd))));
    return pts;
  }

  // Parking-lot layout inside a w×d rectangle (local coords, centred): bays 2.5 m wide × 5 m deep,
  // two rows facing a 6 m aisle per 16 m strip; a leftover strip ≥ 11 m gets one row + aisle.
  const BAY_W = 2.5, BAY_D = 5, STRIP = 16, SINGLE = 11;
  function parkLayout(w, d) {
    const W = Math.max(0, Number(w) || 0), D = Math.max(0, Number(d) || 0);
    const longX = W >= D, L = longX ? W : D, S = longX ? D : W;
    const n = Math.floor(L / BAY_W), lines = [];
    const rows = [];
    let s = 0;
    while (S - s >= STRIP - 1e-6) { rows.push([s, 1]); rows.push([s + STRIP, -1]); s += STRIP; }
    if (S - s >= SINGLE - 1e-6) rows.push([s, 1]);
    const t0 = -L / 2 + (L - n * BAY_W) / 2;
    rows.forEach(([o, dir]) => {
      const a = -S / 2 + o, b = a + dir * BAY_D;
      for (let k = 0; k <= n; k++) {
        const t = t0 + k * BAY_W;
        lines.push(longX ? [t, a, t, b] : [a, t, b, t]);
      }
    });
    return { count: n * rows.length, rows: rows.length, lines };
  }

  function computeCodeChecks(input) {
    const src = input || {};
    const blocks = Array.isArray(src.blocks) ? src.blocks : [];
    const o = opts(src.opts);
    const counts = typeof src.counts === 'function' ? src.counts : defaultCounts;
    const area = typeof src.area === 'function' ? src.area : (b => (Number(b.w) || 0) * (Number(b.d) || 0));

    let gfa = 0, upperGfa = 0, asphalt = 0, lotSpaces = 0, maxFloors = 0;
    const arch = [], cores = [];
    blocks.forEach((b, idx) => {
      if (!b || b.hidden) return;
      if (b.mat === 'asphalt' && !PROPS.includes(b.shape)) {
        if (b.park) lotSpaces += parkLayout(b.w, b.d).count; // a drawn parking lot: count its real bays
        else asphalt += (Number(b.w) || 0) * (Number(b.d) || 0);
      }
      if (!counts(b)) return;
      const f = Math.max(1, Math.round(Number(b.f) || 1));
      const a = area(b);
      gfa += a * f;
      upperGfa += a * Math.max(0, f - 1);
      maxFloors = Math.max(maxFloors, f);
      const item = { idx, b, f, fr: frame(b) };
      if (isCore(b)) { if (f >= 2) cores.push(item); } else arch.push(item);
    });

    // parking
    const required = gfa > 0 ? Math.ceil(gfa / o.parkM2) : 0;
    const provided = lotSpaces + Math.floor(asphalt / o.spaceM2);
    const parking = { required, provided, lotSpaces, asphaltArea: Math.round(asphalt), ok: provided >= required };

    // escape distance: only multi-storey blocks need a stair; ground floors exit straight outside
    const escItems = arch.filter(a => a.f >= 2).map(a => {
      let worst = 0;
      samplePoints(a.fr).forEach(([x, z]) => {
        let best = Infinity;
        cores.forEach(c => { best = Math.min(best, distToCore(c.fr, x, z)); });
        worst = Math.max(worst, best);
      });
      const reach = cores.filter(c => distToCore(c.fr, a.fr.cx, a.fr.cz) <= o.escapeMax).length;
      return {
        idx: a.idx,
        name: a.b.name || ('Block ' + (a.idx + 1)),
        floors: a.f,
        worst: Number.isFinite(worst) ? +worst.toFixed(1) : null,
        coresInReach: reach,
        ok: Number.isFinite(worst) && worst <= o.escapeMax
      };
    }).sort((p, q) => (q.worst === null ? 1e9 : q.worst) - (p.worst === null ? 1e9 : p.worst));
    const worstAll = escItems.reduce((m, it) => Math.max(m, it.worst === null ? Infinity : it.worst), 0);
    const escape = {
      limit: o.escapeMax,
      items: escItems,
      failCount: escItems.filter(it => !it.ok).length,
      worst: escItems.length ? (Number.isFinite(worstAll) ? +worstAll.toFixed(1) : null) : 0,
      ok: escItems.every(it => it.ok)
    };

    // lifts: only needed when there are upper floors
    const needLifts = maxFloors >= 2;
    const liftsReq = needLifts ? Math.max(1, Math.ceil(upperGfa / o.liftM2)) + o.serviceLift : 0;
    const liftsCap = cores.length * 2; // a core can usually take two lift shafts
    const lifts = { required: liftsReq, cores: cores.length, capacity: liftsCap, ok: !needLifts || liftsCap >= liftsReq };

    // escape stairs: at least two separate stair cores when any floor is above ground
    const stairs = { required: needLifts ? 2 : 0, cores: cores.length, ok: !needLifts || cores.length >= 2 };

    return {
      opts: o,
      gfa: Math.round(gfa),
      upperGfa: Math.round(upperGfa),
      maxFloors,
      coreIdx: cores.map(c => c.idx),
      parking,
      escape,
      lifts,
      stairs,
      okCount: [parking.ok, escape.ok, lifts.ok, stairs.ok].filter(Boolean).length
    };
  }

  // ---- suggest stair / lift cores so every multi-storey block is within the escape distance ----
  // Cores (6 m along the wall × 7 m deep) are placed against the long sides or the ends of multi-storey wings,
  // inside the site and clear of other blocks; greedy set cover over sample points, then at least two cores
  // (two escape stairs) and enough lift shafts (two per core).
  const CORE_W = 6, CORE_D = 7;
  function aabb(f) {
    const xs = [], zs = [];
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([i, j]) => { const p = toWorld(f, i * f.hw, j * f.hd); xs.push(p[0]); zs.push(p[1]); });
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  }
  function suggestCores(input) {
    const src = input || {};
    const blocks = Array.isArray(src.blocks) ? src.blocks : [];
    const o = opts(src.opts);
    const counts = typeof src.counts === 'function' ? src.counts : defaultCounts;
    const area = typeof src.area === 'function' ? src.area : (b => (Number(b.w) || 0) * (Number(b.d) || 0));
    const site = src.site || {}, SW = Math.max(10, Number(site.w) || 100), SD = Math.max(10, Number(site.d) || 100);
    const reach = o.escapeMax * 0.9; // keep a margin under the limit

    const cores = [], hosts = [], others = [];
    let upperGfa = 0;
    blocks.forEach((b, idx) => {
      if (!b || b.hidden || PROPS.includes(b.shape)) return;
      const fr = frame(b);
      others.push({ idx, box: aabb(fr) });
      if (!counts(b)) return;
      const f = Math.max(1, Math.round(Number(b.f) || 1));
      upperGfa += area(b) * Math.max(0, f - 1);
      if (isCore(b)) { if (f >= 2) cores.push(fr); } else if (f >= 2) hosts.push({ idx, b, f, fr });
    });
    if (!hosts.length) return { cores: [], uncovered: 0, before: 0 };

    // sample points every ~6 m inside each multi-storey footprint
    const pts = [];
    hosts.forEach(h => {
      const nx = Math.max(1, Math.ceil(2 * h.fr.hw / 6)), nz = Math.max(1, Math.ceil(2 * h.fr.hd / 6));
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
        const p = toWorld(h.fr, -h.fr.hw + 2 * h.fr.hw * i / nx, -h.fr.hd + 2 * h.fr.hd * j / nz);
        pts.push({ x: p[0], z: p[1] });
      }
    });
    const covered = (p, list) => list.some(c => distToCore(c, p.x, p.z) <= reach);
    let open = pts.filter(p => !covered(p, cores));
    const before = open.length;

    // candidate core footprints around every host
    const cands = [];
    hosts.forEach(h => {
      const fr = h.fr, longX = fr.hw >= fr.hd, hl = longX ? fr.hw : fr.hd, hs = longX ? fr.hd : fr.hw;
      const rotDeg = ((h.b.shape === 'box' || h.b.shape === 'riwaq') ? 0 : (Number(h.b.ry) || 0)) + (Number(h.b.rot) || 0);
      const put = (al, ac, alongW) => { // al: along long axis, ac: across; alongW: core long side follows the wall
        const lx = longX ? al : ac, lz = longX ? ac : al;
        const w = (longX === alongW) ? CORE_W : CORE_D, d = (longX === alongW) ? CORE_D : CORE_W;
        const [x, z] = toWorld(fr, lx, lz);
        cands.push({ x, z, w, d, rot: rotDeg, f: h.f, host: h.idx, fr: Object.assign({}, fr, { cx: x, cz: z, hw: w / 2, hd: d / 2 }) });
      };
      [-0.33, 0, 0.33].forEach(t => [-1, 1].forEach(s => put(t * 2 * hl, s * (hs + CORE_D / 2), true)));
      [-1, 1].forEach(s => put(s * (hl + CORE_D / 2), 0, false));
    });
    const blocked = others.map(o2 => o2.box);
    const fits = c => {
      const bx = aabb(c.fr);
      if (bx.minX < -SW / 2 || bx.maxX > SW / 2 || bx.minZ < -SD / 2 || bx.maxZ > SD / 2) return false;
      return blocked.every(q => bx.maxX <= q.minX + 0.3 || bx.minX >= q.maxX - 0.3 || bx.maxZ <= q.minZ + 0.3 || bx.minZ >= q.maxZ - 0.3);
    };
    const chosen = [];
    const take = c => { chosen.push(c); blocked.push(aabb(c.fr)); };

    while (open.length) {
      let best = null, bestN = 0;
      cands.forEach(c => { if (!fits(c)) return; const n = open.filter(p => distToCore(c.fr, p.x, p.z) <= reach).length; if (n > bestN) { bestN = n; best = c; } });
      if (!best) break;
      take(best);
      open = open.filter(p => distToCore(best.fr, p.x, p.z) > reach);
    }
    // farthest fitting candidate from all cores so far (a second, separate escape route / more lifts)
    const farthest = () => {
      const all = cores.concat(chosen.map(c => c.fr));
      let best = null, bestD = -1;
      cands.forEach(c => { if (!fits(c)) return; const dmin = all.length ? Math.min(...all.map(a => Math.hypot(a.cx - c.x, a.cz - c.z))) : 1e9; if (dmin > bestD) { bestD = dmin; best = c; } });
      return best;
    };
    while (cores.length + chosen.length < 2) { const c = farthest(); if (!c) break; take(c); }
    const liftsReq = Math.max(1, Math.ceil(upperGfa / o.liftM2)) + o.serviceLift;
    while ((cores.length + chosen.length) * 2 < liftsReq) { const c = farthest(); if (!c) break; take(c); }

    return {
      cores: chosen.map(c => ({ x: +c.x.toFixed(2), z: +c.z.toFixed(2), w: c.w, d: c.d, rot: c.rot, f: c.f, host: c.host })),
      uncovered: open.length,
      before
    };
  }

  return { DEFAULT_OPTS, BAY_W, STRIP, CORE_W, CORE_D, computeCodeChecks, parkLayout, suggestCores, isCore, distToCore: (b, x, z) => distToCore(frame(b), x, z) };
});
