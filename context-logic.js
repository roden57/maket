(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_CTX = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Urban context: neighbouring buildings as `context` blocks (they cast shadows but never count toward
  // the project's coverage / FAR / GFA). Two sources:
  //   1. quick neighbours placed along a side of the plot (quickBlocks)
  //   2. OpenStreetMap buildings around the site's lat/lon (overpassQuery → parseOSM → toBlocks)
  // Scene frame: the site is centred at (0,0); with north = 0, true north is -z and east is +x.
  // The site's `north` angle rotates true north in the scene the same way the sun does in the app.

  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
  const r2 = v => Math.round(v * 100) / 100;
  const M_LAT = 110574;          // metres per degree of latitude
  const M_LON = 111320;          // metres per degree of longitude at the equator

  // ---------- quick neighbours ----------
  const SIDE = {
    n: { ax: 'x', nz: -1 }, s: { ax: 'x', nz: 1 },
    e: { ax: 'z', nx: 1 }, w: { ax: 'z', nx: -1 }
  };

  function aabb(b) {
    const w = num(b.w, 1), d = num(b.d, 1), a = (num(b.rot, 0) + ((b.shape || 'box') === 'box' ? 0 : num(b.ry, 0))) * Math.PI / 180;
    const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    const hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2;
    return { x0: num(b.x, 0) - hw, x1: num(b.x, 0) + hw, z0: num(b.z, 0) - hd, z1: num(b.z, 0) + hd };
  }
  const hit = (A, B) => A.x0 < B.x1 - 1e-6 && A.x1 > B.x0 + 1e-6 && A.z0 < B.z1 - 1e-6 && A.z1 > B.z0 + 1e-6;

  /**
   * Neighbour blocks along one side of the plot, just outside it (across the street when that side has one).
   * opts: {site, side:'n'|'s'|'e'|'w', front (m along the side), depth (m), floors, gap?, fill?, blocks (existing)}
   * fill: repeat along the whole side; otherwise one block in the first free slot.
   */
  function quickBlocks(opts) {
    const site = opts.site || {}, side = SIDE[opts.side] ? opts.side : 's';
    const W = num(site.w, 100), D = num(site.d, 100);
    const front = Math.max(2, num(opts.front, 12)), depth = Math.max(2, num(opts.depth, 15));
    const floors = Math.max(1, Math.round(num(opts.floors, 3)));
    const street = site.streets && site.streets[side];
    const gap = opts.gap !== undefined ? Math.max(0, num(opts.gap, 0)) : (street ? Math.max(0, num(site.roadW, 12)) : 0);
    const S = SIDE[side], along = S.ax === 'x';
    const len = along ? W : D;
    // block centre across the side line
    const off = (along ? D : W) / 2 + gap + depth / 2;
    const taken = (opts.blocks || []).filter(b => b && !b.hidden).map(aabb);
    const out = [];
    const mk = t => {
      const b = { shape: 'box', mat: 'context', fn: '', f: floors, y0: 0, ry: 0, rot: 0, ctx: 'quick' };
      if (along) Object.assign(b, { w: front, d: depth, x: r2(t), z: r2(S.nz * off) });
      else Object.assign(b, { w: depth, d: front, x: r2(S.nx * off), z: r2(t) });
      return b;
    };
    const step = 0.5;
    const t0 = -len / 2 + front / 2, tEnd = len / 2 - front / 2;
    if (opts.fill) {
      for (let t = t0; t <= tEnd + 1e-6;) {
        const b = mk(t);
        if (taken.some(A => hit(A, aabb(b)))) { t += step; continue; }
        out.push(b); taken.push(aabb(b)); t += front;
      }
      return out;
    }
    // single block: first free slot from the middle outward, then beyond the corners
    const lim = len / 2 + front * 4;
    for (let k = 0; k * step <= lim; k++) {
      for (const sg of k ? [1, -1] : [1]) {
        const b = mk(sg * k * step);
        if (!taken.some(A => hit(A, aabb(b)))) return [b];
      }
    }
    return [];
  }

  // ---------- OpenStreetMap ----------
  function overpassQuery(lat, lon, radius) {
    const R = Math.round(Math.max(20, Math.min(400, num(radius, 150))));
    const p = `(around:${R},${num(lat, 0).toFixed(6)},${num(lon, 0).toFixed(6)})`;
    return `[out:json][timeout:30];(way["building"]["building"!="no"]${p};relation["building"]["type"="multipolygon"]${p};);out geom tags;`;
  }

  /** lat/lon → scene (x,z) metres around the site centre, respecting the site's north angle */
  function projector(lat0, lon0, northDeg) {
    const k = Math.cos(num(lat0, 0) * Math.PI / 180) * M_LON, N = num(northDeg, 0) * Math.PI / 180;
    const c = Math.cos(N), s = Math.sin(N);
    return (lat, lon) => {
      const e = (lon - lon0) * k, n = (lat - lat0) * M_LAT;
      return [e * c + n * s, e * s - n * c];
    };
  }

  /** "33.3567, 44.3833" / "33.3567 44.3833" (as copied from Google Maps) → {lat, lon} or null */
  function parseLatLon(text) {
    const m = String(text || '').match(/(-?\d+(?:\.\d+)?)\s*[,،\s]\s*(-?\d+(?:\.\d+)?)/);
    if (!m) return null;
    const lat = +m[1], lon = +m[2];
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return { lat, lon };
  }

  function parseHeight(tags) {
    const t = tags || {};
    const h = parseFloat(String(t.height || t['building:height'] || '').replace(',', '.'));
    if (h > 0) return { h, src: 'height' };
    const lv = parseFloat(t['building:levels'] || t.levels || '');
    if (lv > 0) return { lv: lv + (parseFloat(t['roof:levels']) > 0 ? parseFloat(t['roof:levels']) * 0.5 : 0), src: 'levels' };
    return null;
  }

  function ringArea(P) {
    let a = 0;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]);
    return a / 2;
  }

  /** drop duplicate / near-collinear points of a closed ring */
  function cleanRing(P) {
    let Q = P.slice();
    if (Q.length > 1 && Math.hypot(Q[0][0] - Q[Q.length - 1][0], Q[0][1] - Q[Q.length - 1][1]) < 1e-6) Q.pop();
    Q = Q.filter((p, i) => i === 0 || Math.hypot(p[0] - Q[i - 1][0], p[1] - Q[i - 1][1]) > 0.3);
    if (Q.length > 3 && Math.hypot(Q[0][0] - Q[Q.length - 1][0], Q[0][1] - Q[Q.length - 1][1]) <= 0.3) Q.pop();
    let changed = true;
    while (changed && Q.length > 3) {
      changed = false;
      for (let i = 0; i < Q.length; i++) {
        const a = Q[(i + Q.length - 1) % Q.length], b = Q[i], c = Q[(i + 1) % Q.length];
        const tri = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
        if (tri < 0.05 * Math.max(1, Math.hypot(c[0] - a[0], c[1] - a[1]))) { Q.splice(i, 1); changed = true; break; }
      }
    }
    return Q;
  }

  /** join open way segments (multipolygon outers) into closed rings */
  function joinRings(segs) {
    const key = p => p.lat.toFixed(7) + ',' + p.lon.toFixed(7);
    const left = segs.filter(s => s && s.length > 1).map(s => s.slice());
    const out = [];
    while (left.length) {
      let ring = left.shift();
      let guard = 0;
      while (key(ring[0]) !== key(ring[ring.length - 1]) && guard++ < 200) {
        const end = key(ring[ring.length - 1]);
        const i = left.findIndex(s => key(s[0]) === end || key(s[s.length - 1]) === end);
        if (i < 0) break;
        const s = left.splice(i, 1)[0];
        ring = ring.concat((key(s[0]) === end ? s : s.slice().reverse()).slice(1));
      }
      if (ring.length >= 4 && key(ring[0]) === key(ring[ring.length - 1])) out.push(ring);
    }
    return out;
  }

  /**
   * Overpass JSON → buildings in scene metres: [{id, name, ring:[[x,z]...], area, h?, lv?, src}]
   * opts: {lat, lon, north}
   */
  function parseOSM(json, opts) {
    const o = opts || {}, P = projector(num(o.lat, 0), num(o.lon, 0), num(o.north, 0));
    const els = (json && Array.isArray(json.elements)) ? json.elements : [];
    const out = [];
    els.forEach(el => {
      let rings = [];
      if (el.type === 'way' && Array.isArray(el.geometry)) rings = joinRings([el.geometry]);
      else if (el.type === 'relation' && Array.isArray(el.members)) {
        rings = joinRings(el.members.filter(m => m.type === 'way' && (m.role === 'outer' || m.role === '') && Array.isArray(m.geometry)).map(m => m.geometry));
      }
      rings.forEach((g, k) => {
        const ring = cleanRing(g.map(p => P(p.lat, p.lon)));
        if (ring.length < 3) return;
        const area = Math.abs(ringArea(ring));
        const ht = parseHeight(el.tags);
        out.push(Object.assign({ id: el.type[0] + el.id + (k ? '_' + k : ''), name: (el.tags && (el.tags.name || el.tags['name:ar'])) || '', ring, area, src: ht ? ht.src : 'estimate' }, ht || {}));
      });
    });
    return out;
  }

  /**
   * buildings → context blocks (shape 'poly', mat 'context', rot 0).
   * opts: {fh, defFloors, site, skipSite (drop buildings whose centre is on the plot), minArea}
   * returns {blocks, skipped:{site, small}}
   */
  function toBlocks(buildings, opts) {
    const o = opts || {}, fh = num(o.fh, 4) > 0 ? num(o.fh, 4) : 4, def = Math.max(1, Math.round(num(o.defFloors, 2)));
    const site = o.site || {}, W = num(site.w, 0) / 2, D = num(site.d, 0) / 2, minA = Math.max(0, num(o.minArea, 15));
    const blocks = [], skipped = { site: 0, small: 0 };
    (buildings || []).forEach(bd => {
      if (bd.area < minA) { skipped.small++; return; }
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, cx = 0, cz = 0;
      bd.ring.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); cx += x / bd.ring.length; cz += z / bd.ring.length; });
      if (o.skipSite && W > 0 && Math.abs(cx) < W && Math.abs(cz) < D) { skipped.site++; return; }
      const floors = bd.h ? Math.max(1, Math.round(bd.h / fh)) : bd.lv ? Math.max(1, Math.round(bd.lv)) : def;
      const b = {
        name: (bd.name ? bd.name : 'مجاور') + ' · OSM', shape: 'poly', mat: 'context', fn: '', f: floors, y0: 0, ry: 0, rot: 0,
        x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: Math.max(1, r2(x1 - x0)), d: Math.max(1, r2(z1 - z0)),
        pts: bd.ring.map(([x, z]) => [r2(x), r2(z)]), ctx: 'osm', osm: bd.id, est: bd.src === 'estimate'
      };
      blocks.push(b);
    });
    return { blocks, skipped };
  }

  /** summary for the panel: how many neighbours, how many have estimated heights */
  function summary(blocks) {
    const ctx = (blocks || []).filter(b => b && b.mat === 'context');
    return { total: ctx.length, osm: ctx.filter(b => b.ctx === 'osm').length, estimated: ctx.filter(b => b.est).length, hidden: ctx.filter(b => b.hidden).length };
  }

  /** half-size of a square around the origin that holds every block (for the sun's shadow box) */
  function extent(blocks, minHalf) {
    let m = num(minHalf, 0);
    (blocks || []).forEach(b => { if (!b || b.hidden) return; const A = aabb(b); m = Math.max(m, Math.abs(A.x0), Math.abs(A.x1), Math.abs(A.z0), Math.abs(A.z1)); });
    return m;
  }

  return { quickBlocks, overpassQuery, projector, parseLatLon, parseHeight, parseOSM, toBlocks, summary, extent, cleanRing, joinRings, aabb };
});
