(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_SITE = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const FLAT_MATS = { green: true, paving: true, asphalt: true, water: true };
  const PROP_SHAPES = { tree: [5, 5], person: [0.6, 0.6], car: [4.5, 1.9] };

  function isBlockBuilding(b) {
    return !!(b && !b.hidden && !PROP_SHAPES[b.shape] && !FLAT_MATS[b.mat] && b.shape !== 'riwaq' && b.mat !== 'context');
  }

  function clampNum(v, min, max, fallback) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function normalizeSiteConfig(raw) {
    const s = raw || {};
    const w = clampNum(s.w, 10, 1000, 100);
    const d = clampNum(s.d, 10, 1000, 100);
    const sb = clampNum(s.sb, 0, 200, 0);
    const sbMode = s.sbMode === 'custom' ? 'custom' : 'uniform';
    const sbN = sbMode === 'custom' ? clampNum(s.sbN, 0, 200, sb) : sb;
    const sbS = sbMode === 'custom' ? clampNum(s.sbS, 0, 200, sb) : sb;
    const sbE = sbMode === 'custom' ? clampNum(s.sbE, 0, 200, sb) : sb;
    const sbW = sbMode === 'custom' ? clampNum(s.sbW, 0, 200, sb) : sb;

    const rawStreets = s.streets || {};
    const streets = {
      n: !!rawStreets.n,
      s: rawStreets.s === undefined ? true : !!rawStreets.s,
      e: !!rawStreets.e,
      w: !!rawStreets.w
    };

    return {
      w,
      d,
      sb,
      sbMode,
      sbN,
      sbS,
      sbE,
      sbW,
      north: clampNum(s.north, -180, 180, 0),
      roadW: clampNum(s.roadW, 4, 50, 12),
      maxCovPct: clampNum(s.maxCovPct, 5, 100, 60),
      maxFar: clampNum(s.maxFar, 0.1, 25, 2.4),
      streets,
      city: s.city || 'baghdad',
      lat: Number.isFinite(Number(s.lat)) ? Number(s.lat) : 33.31,
      lon: Number.isFinite(Number(s.lon)) ? Number(s.lon) : 44.36,
      tz: Number.isFinite(Number(s.tz)) ? Number(s.tz) : 3,
      wind: Number.isFinite(Number(s.wind)) ? Number(s.wind) : 315
    };
  }

  function computeBuildableZone(rawSite) {
    const st = normalizeSiteConfig(rawSite);
    const halfW = st.w / 2;
    const halfD = st.d / 2;
    const minX = -halfW + st.sbW;
    const maxX = halfW - st.sbE;
    const minZ = -halfD + st.sbN;
    const maxZ = halfD - st.sbS;
    const width = Math.max(0, maxX - minX);
    const depth = Math.max(0, maxZ - minZ);
    const plotArea = st.w * st.d;
    const area = width * depth;

    return {
      plotArea,
      minX,
      maxX,
      minZ,
      maxZ,
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
      width,
      depth,
      area,
      buildableRatio: plotArea > 0 ? area / plotArea : 0,
      hasSetback: st.sbN > 0 || st.sbS > 0 || st.sbE > 0 || st.sbW > 0,
      valid: width > 0.01 && depth > 0.01
    };
  }

  function blockPlanCorners(b) {
    const ry = (b.shape === 'box' || b.shape === 'riwaq') ? 0 : (b.ry || 0);
    const [w, d] = (Math.abs(ry) % 180 === 0) ? [b.w || 0, b.d || 0] : [b.d || 0, b.w || 0];
    const W = w / 2;
    const D = d / 2;
    let pts;

    if (b.shape === 'tri') {
      pts = [[-W, -D], [W, -D], [-W, D]];
    } else if (b.shape === 'cyl' || b.shape === 'ring') {
      pts = Array.from({ length: 16 }, (_, k) => {
        const a = (k / 16) * Math.PI * 2;
        return [Math.cos(a) * W, Math.sin(a) * D];
      });
    } else if (b.shape === 'poly' && Array.isArray(b.pts) && b.pts.length >= 3) {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      b.pts.forEach(p => {
        if (p[0] < x0) x0 = p[0];
        if (p[0] > x1) x1 = p[0];
        if (p[1] < z0) z0 = p[1];
        if (p[1] > z1) z1 = p[1];
      });
      const pw = (x1 - x0) || 1;
      const pd = (z1 - z0) || 1;
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      pts = b.pts.map(p => [(p[0] - cx) * w / pw, (p[1] - cz) * d / pd]);
    } else {
      pts = [[-W, -D], [W, -D], [W, D], [-W, D]];
    }

    const deg = ry + (b.rot || 0);
    const th = -deg * Math.PI / 180;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const bx = b.x || 0;
    const bz = b.z || 0;
    return pts.map(([lx, lz]) => [bx + lx * c + lz * s, bz - lx * s + lz * c]);
  }

  function checkSetbackCompliance(input) {
    const cfg = input || {};
    const st = normalizeSiteConfig(cfg.site);
    const zone = computeBuildableZone(st);
    const blocks = Array.isArray(cfg.blocks) ? cfg.blocks : [];
    const eps = 0.05;

    let checkedCount = 0;
    let compliantCount = 0;
    const violations = [];
    const perBlock = [];

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!isBlockBuilding(b)) continue;
      checkedCount++;
      const corners = blockPlanCorners(b);
      let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
      for (let k = 0; k < corners.length; k++) {
        const [x, z] = corners[k];
        if (x < bx0) bx0 = x;
        if (x > bx1) bx1 = x;
        if (z < bz0) bz0 = z;
        if (z > bz1) bz1 = z;
      }

      const outOfPlot = (
        bx0 < -st.w / 2 - eps ||
        bx1 > st.w / 2 + eps ||
        bz0 < -st.d / 2 - eps ||
        bz1 > st.d / 2 + eps
      );
      const breachN = bz0 < zone.minZ - eps;
      const breachS = bz1 > zone.maxZ + eps;
      const breachW = bx0 < zone.minX - eps;
      const breachE = bx1 > zone.maxX + eps;
      const setbackBreach = !zone.valid || breachN || breachS || breachW || breachE;

      const entry = {
        index: i,
        id: b.id || ('b' + i),
        name: b.name || '',
        outOfPlot,
        setbackBreach,
        sides: { n: breachN, s: breachS, e: breachE, w: breachW },
        bbox: { minX: bx0, maxX: bx1, minZ: bz0, maxZ: bz1 }
      };
      perBlock.push(entry);

      if (outOfPlot || setbackBreach) {
        violations.push(entry);
      } else {
        compliantCount++;
      }
    }

    return {
      checkedCount,
      compliantCount,
      violationCount: violations.length,
      isFullyCompliant: violations.length === 0,
      violations,
      perBlock
    };
  }

  function computeSiteMetrics(input) {
    const cfg = input || {};
    const st = normalizeSiteConfig(cfg.site);
    const zone = computeBuildableZone(st);
    const compliance = checkSetbackCompliance({ site: st, blocks: cfg.blocks });
    const fp = Math.max(0, Number(cfg.footprintArea) || 0);
    const gfa = Math.max(0, Number(cfg.gfa) || 0);

    const coveragePct = zone.plotArea > 0 ? (fp * 100) / zone.plotArea : 0;
    const far = zone.plotArea > 0 ? gfa / zone.plotArea : 0;
    const allowableFootprint = zone.plotArea * (st.maxCovPct / 100);
    const allowableGfa = zone.plotArea * st.maxFar;
    const streetCount = ['n', 's', 'e', 'w'].filter(k => st.streets[k]).length;

    return {
      site: st,
      zone,
      compliance,
      plotArea: zone.plotArea,
      buildableArea: zone.area,
      footprintArea: fp,
      gfa,
      coveragePct,
      maxCovPct: st.maxCovPct,
      coverageOk: coveragePct <= st.maxCovPct + 0.05,
      allowableFootprint,
      far,
      maxFar: st.maxFar,
      farOk: far <= st.maxFar + 0.005,
      allowableGfa,
      streetCount
    };
  }

  return {
    normalizeSiteConfig,
    computeBuildableZone,
    blockPlanCorners,
    checkSetbackCompliance,
    computeSiteMetrics
  };
});
