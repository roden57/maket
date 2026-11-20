(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_PLAN2D = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Dimensioned 2D site plan, written as SVG (to scale, Arabic labels) and as DXF entities (ASCII labels).
  // Scene frame: x to the right, z toward the viewer (south when north = 0). The drawing keeps the scene frame:
  // SVG y = z (north up when the site north is 0); DXF y = -z (the same picture in CAD's y-up frame).
  // Input items: {code:'B01', label, kind:'own'|'ctx'|'flat'|'prop', rings:[outer, holes...] (world x,z),
  //               frame:{x,z,w,d,rot} (local box of the mass, rot in degrees like the app), floors, top}

  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
  const f2 = v => (Math.round(v * 100) / 100).toFixed(2);
  const fmt = v => { const r = Math.round(v * 100) / 100; return Number.isInteger(r) ? r.toFixed(1) : String(r); };

  function corners(fr) {
    const th = -num(fr.rot, 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), W = fr.w / 2, D = fr.d / 2;
    const P = ([x, z]) => [fr.x + x * c + z * s, fr.z - x * s + z * c];
    return { bl: P([-W, -D]), br: P([W, -D]), fr: P([W, D]), fl: P([-W, D]), ax: [c, -s], az: [s, c] };
  }
  const isRect = R => R.length === 4 && R.every((p, i) => {
    const a = R[(i + 3) % 4], b = R[(i + 1) % 4];
    const u = [a[0] - p[0], a[1] - p[1]], v = [b[0] - p[0], b[1] - p[1]];
    return Math.abs(u[0] * v[0] + u[1] * v[1]) < 1e-3 * Math.hypot(...u) * Math.hypot(...v);
  });

  /** {prims:[poly|text|dim], bounds} — dims are {t:'dim', a, b, n (unit offset normal), off, text} */
  function build(input) {
    const o = input || {}, site = o.site || {}, W = num(site.w, 100) / 2, D = num(site.d, 100) / 2;
    const prims = [];
    let cur = -1; // item index, so each mass is filled on its own (holes = its own courtyards only)
    const poly = (pts, layer, closed = true, dash) => prims.push({ t: 'poly', pts, layer, closed, dash: !!dash, item: cur });
    const text = (x, z, s, h, layer, rot) => prims.push({ t: 'text', x, z, s, h, layer, rot: rot || 0 });
    const dim = (a, b, n, off, layer) => prims.push({ t: 'dim', a, b, n, off, layer: layer || 'DIMS', text: fmt(Math.hypot(b[0] - a[0], b[1] - a[1])) });

    // site boundary + overall dimensions + setback
    poly([[-W, -D], [W, -D], [W, D], [-W, D]], 'SITE');
    dim([-W, -D], [W, -D], [0, -1], 6);
    dim([W, -D], [W, D], [1, 0], 6);
    const sb = num(site.sb, 0);
    if (sb > 0 && sb < Math.min(W, D)) poly([[-W + sb, -D + sb], [W - sb, -D + sb], [W - sb, D - sb], [-W + sb, D - sb]], 'SETBACK', true, true);

    (o.items || []).forEach((it, idx) => {
      if (!it || !it.rings || !it.rings.length) return;
      cur = idx;
      const layer = it.kind === 'own' ? 'MASS' : it.kind === 'ctx' ? 'CONTEXT' : it.kind === 'flat' ? 'OPEN_SPACE' : 'PROPS';
      it.rings.forEach((r, k) => poly(r, k ? (it.kind === 'own' ? 'COURTYARD' : layer) : layer));
      cur = -1;
      if (it.kind !== 'own') return;
      const fr = it.frame;
      if (fr && fr.w > 0 && fr.d > 0) {
        const c = corners(fr);
        // width along the back edge (local -z), depth along the right edge (local +x), both offset outward
        dim(c.bl, c.br, [-c.az[0], -c.az[1]], 3);
        dim(c.br, c.fr, [c.ax[0], c.ax[1]], 3);
      }
      // rectangular courtyard: its two sides, offset into the void
      it.rings.slice(1).filter(isRect).forEach(R => {
        const cx = R.reduce((s, p) => s + p[0] / 4, 0), cz = R.reduce((s, p) => s + p[1] / 4, 0);
        [[R[0], R[1]], [R[1], R[2]]].forEach(([a, b]) => {
          const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, L = Math.hypot(cx - mx, cz - mz) || 1;
          dim(a, b, [(cx - mx) / L, (cz - mz) / L], 1.5);
        });
      });
      const [lx, lz] = fr ? [fr.x, fr.z] : it.rings[0].reduce((a, p) => [a[0] + p[0] / it.rings[0].length, a[1] + p[1] / it.rings[0].length], [0, 0]);
      text(lx, lz, `${it.label || it.code}`, 1.6, 'TEXT');
      text(lx, lz + 2.4, `${it.code} · ${it.floors}F · +${fmt(it.top)}`, 1.1, 'TEXT');
    });

    // bounds (with room for dimensions and the north arrow)
    let x0 = -W, x1 = W, z0 = -D, z1 = D;
    prims.forEach(p => {
      const pts = p.t === 'poly' ? p.pts : p.t === 'dim' ? [p.a, p.b] : [[p.x, p.z]];
      pts.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); });
    });
    const m = 12;
    return { prims, bounds: { x0: x0 - m, x1: x1 + m, z0: z0 - m, z1: z1 + m }, north: num(site.north, 0) };
  }

  /** geometry of one dimension: extension lines, dimension line, ticks, text position/angle */
  function dimGeom(p) {
    const [ax, az] = p.a, [bx, bz] = p.b, [nx, nz] = p.n, off = p.off;
    const A = [ax + nx * off, az + nz * off], B = [bx + nx * off, bz + nz * off];
    const ext = 0.8, gap = 0.4;
    const lines = [
      [[ax + nx * gap, az + nz * gap], [A[0] + nx * ext, A[1] + nz * ext]],
      [[bx + nx * gap, bz + nz * gap], [B[0] + nx * ext, B[1] + nz * ext]],
      [A, B]
    ];
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L, t = 0.6;
    // architectural ticks (45° slashes)
    [A, B].forEach(P => lines.push([[P[0] - (ux + nx) * t, P[1] - (uz + nz) * t], [P[0] + (ux + nx) * t, P[1] + (uz + nz) * t]]));
    let ang = Math.atan2(uz, ux) * 180 / Math.PI;
    if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
    return { lines, tx: (A[0] + B[0]) / 2 + nx * 0.9, tz: (A[1] + B[1]) / 2 + nz * 0.9, ang };
  }

  const COL = { SITE: '#0f172a', SETBACK: '#dc2626', MASS: '#111827', COURTYARD: '#15803d', CONTEXT: '#9ca3af', OPEN_SPACE: '#16a34a', PROPS: '#a3a3a3', DIMS: '#1d4ed8', TEXT: '#111827' };
  const FILL = { MASS: '#e5e7eb', CONTEXT: '#f3f4f6', OPEN_SPACE: '#dcfce7' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /** SVG to scale: opts {scale (1:n), title} — 1 m on paper = 1000/scale mm */
  function toSVG(plan, opts) {
    const o = opts || {}, n = Math.max(50, num(o.scale, 500)), b = plan.bounds;
    const Wm = b.x1 - b.x0, Hm = b.z1 - b.z0, mm = 1000 / n; // paper mm per model metre
    const pen = w => f2(w * n / 1000);                       // pen width in mm → model metres
    const out = [];
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${f2(Wm * mm)}mm" height="${f2(Hm * mm + 14)}mm" viewBox="${f2(b.x0)} ${f2(b.z0)} ${f2(Wm)} ${f2(Hm + 14 * n / 1000)}" font-family="IBM Plex Sans Arabic, Tajawal, Arial, sans-serif">`);
    out.push(`<rect x="${f2(b.x0)}" y="${f2(b.z0)}" width="${f2(Wm)}" height="${f2(Hm + 14 * n / 1000)}" fill="#ffffff"/>`);
    // fills first, then outlines (holes cut with evenodd)
    const byItem = {};
    plan.prims.filter(p => p.t === 'poly' && p.item >= 0).forEach(p => { (byItem[p.item] = byItem[p.item] || []).push(p); });
    ['CONTEXT', 'OPEN_SPACE', 'MASS'].forEach(L => {
      Object.values(byItem).filter(ps => ps[0].layer === L).forEach(ps => {
        const d = ps.map(p => 'M' + p.pts.map(q => f2(q[0]) + ',' + f2(q[1])).join('L') + 'Z').join('');
        out.push(`<path d="${d}" fill="${FILL[L]}" fill-rule="evenodd" stroke="none"/>`);
      });
    });
    plan.prims.filter(p => p.t === 'poly').forEach(p => {
      const w = p.layer === 'MASS' || p.layer === 'SITE' ? 0.5 : p.layer === 'COURTYARD' ? 0.35 : 0.18;
      out.push(`<path d="M${p.pts.map(q => f2(q[0]) + ',' + f2(q[1])).join('L')}${p.closed ? 'Z' : ''}" fill="none" stroke="${COL[p.layer] || '#000'}" stroke-width="${pen(w)}"${p.dash ? ` stroke-dasharray="${pen(3)} ${pen(1.5)}"` : ''} stroke-linejoin="round"/>`);
    });
    plan.prims.filter(p => p.t === 'dim').forEach(p => {
      const g = dimGeom(p);
      out.push(`<g stroke="${COL.DIMS}" stroke-width="${pen(0.18)}">${g.lines.map(([a, c]) => `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(c[0])}" y2="${f2(c[1])}"/>`).join('')}</g>`);
      out.push(`<text x="${f2(g.tx)}" y="${f2(g.tz)}" font-size="${f2(2.2 * n / 1000)}" fill="${COL.DIMS}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${f2(g.ang)} ${f2(g.tx)} ${f2(g.tz)})">${esc(p.text)}</text>`);
    });
    plan.prims.filter(p => p.t === 'text').forEach(p => {
      out.push(`<text x="${f2(p.x)}" y="${f2(p.z)}" font-size="${f2(p.h * n / 500)}" fill="${COL.TEXT}" text-anchor="middle" dominant-baseline="middle" direction="rtl">${esc(p.s)}</text>`);
    });
    // north arrow (top-left) and scale bar + title (bottom)
    const ar = 6 * n / 1000 * 2, nx0 = b.x0 + ar * 1.6, nz0 = b.z0 + ar * 1.6;
    out.push(`<g transform="translate(${f2(nx0)} ${f2(nz0)}) rotate(${f2(plan.north)})"><circle r="${f2(ar)}" fill="none" stroke="#0f172a" stroke-width="${pen(0.25)}"/><path d="M0,${f2(-ar)} L${f2(ar * 0.35)},${f2(ar * 0.4)} L0,${f2(ar * 0.15)} L${f2(-ar * 0.35)},${f2(ar * 0.4)}Z" fill="#0f172a"/><text y="${f2(-ar * 1.25)}" font-size="${f2(3 * n / 1000)}" text-anchor="middle">N</text></g>`);
    const nice = [5, 10, 20, 25, 50, 100].find(v => v * mm >= 30) || 100, sy = b.z1 + 5 * n / 1000, sx = b.x0 + 4 * n / 1000;
    for (let i = 0; i < 4; i++) out.push(`<rect x="${f2(sx + i * nice / 4)}" y="${f2(sy)}" width="${f2(nice / 4)}" height="${f2(1.6 * n / 1000)}" fill="${i % 2 ? '#ffffff' : '#0f172a'}" stroke="#0f172a" stroke-width="${pen(0.15)}"/>`);
    out.push(`<text x="${f2(sx)}" y="${f2(sy + 5 * n / 1000)}" font-size="${f2(2.4 * n / 1000)}">0</text><text x="${f2(sx + nice)}" y="${f2(sy + 5 * n / 1000)}" font-size="${f2(2.4 * n / 1000)}" text-anchor="middle">${nice} m</text>`);
    out.push(`<text x="${f2(b.x1 - 4 * n / 1000)}" y="${f2(sy + 3 * n / 1000)}" font-size="${f2(3 * n / 1000)}" text-anchor="end" direction="rtl">${esc((o.title || '') + ' — 1:' + n)}</text>`);
    out.push('</svg>');
    return out.join('\n');
  }

  /** DXF R12 entities for the dimensions (lines + ASCII text on layer DIMS), to append to an ENTITIES section */
  function dimsToDXF(plan) {
    const g6 = v => (+v).toFixed(4);
    let e = '';
    plan.prims.filter(p => p.t === 'dim').forEach(p => {
      const g = dimGeom(p);
      g.lines.forEach(([a, b]) => { e += `0\nLINE\n8\nDIMS\n10\n${g6(a[0])}\n20\n${g6(-a[1])}\n30\n0\n11\n${g6(b[0])}\n21\n${g6(-b[1])}\n31\n0\n`; });
      // DXF y = -z flips angles
      e += `0\nTEXT\n8\nDIMS\n10\n${g6(g.tx)}\n20\n${g6(-g.tz)}\n30\n0\n40\n1.2\n1\n${p.text}\n50\n${g6(-g.ang)}\n72\n1\n73\n2\n11\n${g6(g.tx)}\n21\n${g6(-g.tz)}\n31\n0\n`;
    });
    return e;
  }

  /** a sensible paper scale so the plan fits on A3 landscape (400 × 270 mm drawing area) */
  function fitScale(plan) {
    const b = plan.bounds, need = Math.max((b.x1 - b.x0) / 0.4, (b.z1 - b.z0) / 0.27);
    return [100, 200, 250, 500, 1000, 2000, 2500, 5000].find(s => s >= need) || 5000;
  }

  return { build, dimGeom, toSVG, dimsToDXF, fitScale, corners };
});
