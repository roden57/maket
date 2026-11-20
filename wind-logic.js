(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_WIND = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Wind layer for the 3D scene: a schematic wind rose, the prevailing-wind arrow, and APPROXIMATE ground zones
  // (rule-of-thumb, not CFD):
  //   wake    — wind shadow behind a mass, length ≈ 2–3 × its height (longer for wide fronts), tapering
  //   channel — speed-up in a gap between two masses that overlap along the flow (Venturi-like), when the gap
  //             is narrow compared with their heights
  //   corner  — corner streams beside the windward corners of tall masses (≥ 12 m)
  // Directions: windDeg is where the wind blows FROM, clockwise from true north. The site north angle rotates true
  // north in the scene exactly as the app does for the sun / existing wind arrows: flow = (-sin, cos)(wind+north).

  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
  const r2 = v => Math.round(v * 100) / 100;
  const NAMES_AR = ['شمالية', 'شمالية شرقية', 'شرقية', 'جنوبية شرقية', 'جنوبية', 'جنوبية غربية', 'غربية', 'شمالية غربية'];
  const NAMES_EN = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];

  function frame(windDeg, northDeg) {
    const a = (num(windDeg, 315) + num(northDeg, 0)) * Math.PI / 180;
    const flow = { x: -Math.sin(a), z: Math.cos(a) };   // direction the air travels
    const perp = { x: flow.z, z: -flow.x };
    const S = (x, z) => x * flow.x + z * flow.z;
    const T = (x, z) => x * perp.x + z * perp.z;
    const W = (s, t) => [s * flow.x + t * perp.x, s * flow.z + t * perp.z];
    return { flow, perp, S, T, W, from: { x: -flow.x, z: -flow.z } };
  }

  function dirName(deg, en) {
    const d = ((num(deg, 0) % 360) + 360) % 360;
    return (en ? NAMES_EN : NAMES_AR)[Math.round(d / 45) % 8];
  }

  /**
   * Schematic rose from the prevailing direction only (no station data): 16 petals, a main lobe on the
   * prevailing direction and a smaller opposite lobe. Values are relative (max = 1).
   */
  function rose(windDeg, opts) {
    const o = opts || {}, bins = Math.max(8, Math.round(num(o.bins, 16))), spread = Math.max(10, num(o.spread, 38));
    const second = Math.max(0, Math.min(1, num(o.secondary, 0.3))), wd = num(windDeg, 315);
    const out = [];
    for (let i = 0; i < bins; i++) {
      const deg = i * 360 / bins;
      const d1 = Math.abs(((deg - wd + 540) % 360) - 180), d2 = Math.abs(((deg - wd - 180 + 540) % 360) - 180);
      const f = Math.exp(-(d1 * d1) / (2 * spread * spread)) + second * Math.exp(-(d2 * d2) / (2 * spread * spread)) + 0.06;
      out.push({ deg, f });
    }
    const m = Math.max(...out.map(p => p.f));
    out.forEach(p => { p.f = +(p.f / m).toFixed(3); });
    return out;
  }

  /**
   * obstacles: [{id, name, rings:[[[x,z]...], ...] (world, outer first), h (top height above ground), y0, ctx?}]
   * returns {wakes:[{id, poly, len, h}], channels:[{a, b, poly, gap, factor, cx, cz}], corners:[{id, poly}]}
   */
  function zones(obstacles, opts) {
    const o = opts || {}, F = frame(o.windDeg, o.north);
    const items = [];
    (obstacles || []).forEach(ob => {
      if (!ob || !ob.rings || !ob.rings.length || !ob.rings[0].length) return;
      if (num(ob.y0, 0) > 4) return;          // raised masses: the wind passes underneath
      const h = num(ob.h, 0);
      if (h < 1.5) return;
      let sMin = Infinity, sMax = -Infinity, tMin = Infinity, tMax = -Infinity;
      const V = ob.rings[0].map(([x, z]) => [F.S(x, z), F.T(x, z)]);
      V.forEach(([s, t]) => { sMin = Math.min(sMin, s); sMax = Math.max(sMax, s); tMin = Math.min(tMin, t); tMax = Math.max(tMax, t); });
      // real corners: the side-most vertices (windward-most and leeward-most of each) and the leeward-most vertex
      const pick = (tv, better) => V.filter(v => Math.abs(v[1] - tv) < 0.05).reduce((a, v) => (better(v, a) ? v : a));
      items.push({
        ob, h, sMin, sMax, tMin, tMax, w: tMax - tMin,
        hiW: pick(tMax, (v, a) => v[0] < a[0]), loW: pick(tMin, (v, a) => v[0] < a[0]),
        hiL: pick(tMax, (v, a) => v[0] > a[0]), loL: pick(tMin, (v, a) => v[0] > a[0]),
        back: V.reduce((a, v) => (v[0] > a[0] ? v : a))
      });
    });
    const poly = P => P.map(([s, t]) => F.W(s, t).map(r2));
    // does any other mass occupy this (s,t) box? (a third building standing in a gap blocks the stream)
    const blocked = (s0, s1, t0, t1, skip, minS) => items.some(it => !skip.includes(it) &&
      Math.min(s1, it.sMax) - Math.max(s0, it.sMin) > (minS === undefined ? 1 : minS) && Math.min(t1, it.tMax) - Math.max(t0, it.tMin) > 0.5);

    const wakes = items.map(it => {
      // cavity + near wake: ~2H for a narrow mass, up to ~3.5H for a wide front; kept within 8–90 m
      const len = Math.max(8, Math.min(90, it.h * Math.min(3.5, 2 + 0.25 * it.w / Math.max(1, it.h))));
      const tm = (it.tMin + it.tMax) / 2, hw = it.w / 2;
      // from the leeward silhouette (side corners → back corner) downstream
      const P = [
        it.loL, it.back, it.hiL,
        [it.sMax + len * 0.55, tm + hw * 0.92], [it.sMax + len, tm + hw * 0.45],
        [it.sMax + len, tm - hw * 0.45], [it.sMax + len * 0.55, tm - hw * 0.92]
      ];
      return { id: it.ob.id, name: it.ob.name || '', ctx: !!it.ob.ctx, poly: poly(P), len: r2(len), h: r2(it.h) };
    });

    const channels = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const A = items[i], B = items[j];
        const s0 = Math.max(A.sMin, B.sMin), s1 = Math.min(A.sMax, B.sMax);
        if (s1 - s0 < 2) continue;                       // they must stand side by side along the flow
        const [L, R] = A.tMax <= B.tMin ? [A, B] : B.tMax <= A.tMin ? [B, A] : [null, null];
        if (!L) continue;                                // overlapping across the flow: no gap
        const gap = R.tMin - L.tMax;
        const hMin = Math.min(A.h, B.h);
        if (gap < 1.5 || gap > Math.max(15, hMin * 1.2)) continue;
        if (blocked(s0, s1, L.tMax, R.tMin, [A, B])) continue;
        const factor = +(1 + Math.min(0.6, 0.35 * hMin / gap + 0.05)).toFixed(2);
        let exit = Math.min(25, gap * 2 + 4);
        while (exit > 0.5 && blocked(s1, s1 + exit, L.tMax - gap * 0.25, R.tMin + gap * 0.25, [A, B], 0)) exit /= 2; // stop before the next mass
        if (exit <= 0.5) exit = 0;
        const P = [[s0, L.tMax], [s0, R.tMin], [s1 + exit, R.tMin + gap * 0.25], [s1 + exit, L.tMax - gap * 0.25]];
        const [cx, cz] = F.W((s0 + s1) / 2, (L.tMax + R.tMin) / 2);
        channels.push({ a: A.ob.id, b: B.ob.id, ctx: !!(A.ob.ctx && B.ob.ctx), poly: poly(P), gap: r2(gap), factor, cx: r2(cx), cz: r2(cz) });
      }
    }

    const corners = [];
    items.filter(it => it.h >= 12).forEach(it => {
      const wd = Math.min(12, Math.max(3, it.h * 0.25));
      [[it.hiW, 1], [it.loW, -1]].forEach(([v, sg]) => {
        const s0 = v[0], te = v[1], ln = Math.min(30, (it.sMax - s0) + it.h * 0.5);
        if (blocked(s0, s0 + ln, Math.min(te, te + sg * wd), Math.max(te, te + sg * wd), [it])) return;
        const P = [[s0, te], [s0 + ln, te], [s0 + ln * 0.85, te + sg * wd], [s0 + ln * 0.1, te + sg * wd * 0.7]];
        corners.push({ id: it.ob.id, ctx: !!it.ob.ctx, poly: poly(P) });
      });
    });

    return { flow: F.flow, wakes, channels, corners };
  }

  return { frame, dirName, rose, zones };
});
