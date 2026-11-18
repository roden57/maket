(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_MASS = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FLAT_MATS = ['green', 'paving', 'asphalt', 'water'];
  const PROP_SHAPES = ['tree', 'person', 'car'];
  const DAYLIGHT_DEPTH_M = 7.5;
  const TIGHT_GAP_MAX_M = 3.0;
  const CLASH_MIN_PENETRATION_M = 0.15;
  const GAP_MIN_SEPARATION_M = 0.08;

  function isMassAnalyzable(b) {
    if (!b || typeof b !== 'object' || b.hidden) return false;
    if (PROP_SHAPES.includes(b.shape)) return false;
    if (FLAT_MATS.includes(b.mat)) return false;
    if (b.shape === 'riwaq' || b.mat === 'context') return false;
    return true;
  }

  function getRotOf(b) {
    return b.shape === 'box' ? 0 : (Number(b.ry) || 0);
  }

  function getLocalDims(b) {
    const w = Math.max(0.5, Number(b.w) || 10);
    const d = Math.max(0.5, Number(b.d) || 10);
    return Math.abs(getRotOf(b)) % 180 === 0 ? [w, d] : [d, w];
  }

  function getRoofHeight(b) {
    if (b.shape !== 'gable' && b.shape !== 'shed') return 0;
    return Math.max(0.5, b.rh === undefined ? 3 : (Number(b.rh) || 0));
  }

  function getBlockHeight(b, fh) {
    const floorH = Math.max(1, Number(fh) || 4);
    const floors = Math.max(1, Number(b.f) || 1);
    return floors * floorH + getRoofHeight(b);
  }

  function polyPtsScaled(b, w, d) {
    if (!Array.isArray(b.pts) || b.pts.length < 3) return null;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const p of b.pts) {
      if (!Array.isArray(p) || p.length < 2) continue;
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < z0) z0 = p[1];
      if (p[1] > z1) z1 = p[1];
    }
    if (!Number.isFinite(x0)) return null;
    const pw = (x1 - x0) || 1;
    const pd = (z1 - z0) || 1;
    return b.pts.map(([x, z]) => [(x - (x0 + x1) / 2) * w / pw, (z - (z0 + z1) / 2) * d / pd]);
  }

  function polyAreaAndPerim(pts) {
    let a = 0;
    let perim = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
      perim += Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    }
    return { area: Math.abs(a / 2), perim };
  }

  function ellipsePerimeter(rx, rz) {
    const a = Math.max(0.25, rx);
    const b = Math.max(0.25, rz);
    return Math.PI * (3 * (a + b) - Math.sqrt(Math.max(0, (3 * a + b) * (a + 3 * b))));
  }

  function analyzeBlockMass(b, idx, fh) {
    const floorH = Math.max(1, Number(fh) || 4);
    const floors = Math.max(1, Number(b.f) || 1);
    const [w, d] = getLocalDims(b);
    const roofH = getRoofHeight(b);
    const wallH = floors * floorH;
    const h = wallH + roofH;
    const y0 = Number(b.y0) || 0;
    const shape = b.shape || 'box';

    let footprint = w * d;
    let perimeter = 2 * (w + d);
    let volume = footprint * h;
    let envelopeArea = perimeter * h + footprint;
    let daylightPct = 100;

    if (shape === 'cyl') {
      footprint = Math.PI * (w / 2) * (d / 2);
      perimeter = ellipsePerimeter(w / 2, d / 2);
      volume = footprint * h;
      envelopeArea = perimeter * h + footprint;
      const rEff = Math.sqrt(w * d) / 2;
      const darkR = Math.max(0, rEff - DAYLIGHT_DEPTH_M);
      daylightPct = rEff > 0 ? (1 - Math.pow(darkR / rEff, 2)) * 100 : 100;
    } else if (shape === 'ring') {
      footprint = Math.PI * (w / 2) * (d / 2) * 0.64;
      perimeter = ellipsePerimeter(w / 2, d / 2) + ellipsePerimeter(w * 0.3, d * 0.3);
      volume = footprint * h;
      envelopeArea = perimeter * h + footprint;
      const wingT = Math.min(w, d) * 0.2;
      daylightPct = Math.min(100, ((2 * DAYLIGHT_DEPTH_M) / Math.max(0.5, wingT)) * 100);
    } else if (shape === 'tri') {
      footprint = 0.5 * w * d;
      perimeter = w + d + Math.hypot(w, d);
      volume = footprint * h;
      envelopeArea = perimeter * h + footprint;
      const inRadius = (2 * footprint) / Math.max(1, perimeter);
      const darkRatio = Math.max(0, (inRadius - DAYLIGHT_DEPTH_M) / Math.max(0.25, inRadius));
      daylightPct = (1 - darkRatio * darkRatio) * 100;
    } else if (shape === 'L') {
      const t = Math.min(w, d) * 0.45;
      footprint = Math.max(1, w * d - (w - t) * (d - t));
      perimeter = 2 * (w + d);
      volume = footprint * h;
      envelopeArea = perimeter * h + footprint;
      daylightPct = Math.min(100, ((2 * DAYLIGHT_DEPTH_M) / Math.max(0.5, t)) * 100);
    } else if (shape === 'U') {
      const t = Math.min(w, d) * 0.3;
      footprint = Math.max(1, w * d - Math.max(0, w - 2 * t) * Math.max(0, d - t));
      perimeter = 2 * (w + d) + 2 * Math.max(0, d - t);
      volume = footprint * h;
      envelopeArea = perimeter * h + footprint;
      daylightPct = Math.min(100, ((2 * DAYLIGHT_DEPTH_M) / Math.max(0.5, t)) * 100);
    } else if (shape === 'court') {
      const t = Math.max(1, Math.min(Number(b.t) || 8, Math.min(w, d) / 2 - 1));
      const innerW = Math.max(0.5, w - 2 * t);
      const innerD = Math.max(0.5, d - 2 * t);
      footprint = Math.max(1, w * d - innerW * innerD);
      perimeter = 2 * (w + d) + 2 * (innerW + innerD);
      volume = footprint * h;
      envelopeArea = perimeter * h + footprint;
      daylightPct = Math.min(100, ((2 * DAYLIGHT_DEPTH_M) / Math.max(0.5, t)) * 100);
    } else if (shape === 'poly') {
      const pts = polyPtsScaled(b, w, d);
      if (pts) {
        const res = polyAreaAndPerim(pts);
        footprint = Math.max(1, res.area);
        perimeter = Math.max(2, res.perim);
      }
      volume = footprint * h;
      envelopeArea = perimeter * h + footprint;
      daylightPct = Math.min(100, ((perimeter * DAYLIGHT_DEPTH_M) / Math.max(1, footprint)) * 82);
    } else if (shape === 'pyr') {
      volume = (footprint * h) / 3;
      const slantW = Math.hypot(w / 2, h);
      const slantD = Math.hypot(d / 2, h);
      envelopeArea = w * slantD + d * slantW;
      const darkW = Math.max(0, w - 2 * DAYLIGHT_DEPTH_M);
      const darkD = Math.max(0, d - 2 * DAYLIGHT_DEPTH_M);
      daylightPct = (1 - (darkW * darkD) / Math.max(1, footprint)) * 100;
    } else if (shape === 'vault') {
      volume = (Math.PI / 4) * w * d * h;
      const archLen = ellipsePerimeter(w / 2, h) / 2;
      const endWallArea = (Math.PI / 4) * w * h;
      envelopeArea = archLen * d + 2 * endWallArea;
      const darkW = Math.max(0, w - 2 * DAYLIGHT_DEPTH_M);
      const darkD = Math.max(0, d - 2 * DAYLIGHT_DEPTH_M);
      daylightPct = (1 - (darkW * darkD) / Math.max(1, footprint)) * 100;
    } else if (shape === 'gable') {
      volume = footprint * wallH + 0.5 * footprint * roofH;
      const slopeLen = Math.hypot(w / 2, roofH);
      envelopeArea = perimeter * wallH + 2 * slopeLen * d + w * roofH;
      const darkW = Math.max(0, w - 2 * DAYLIGHT_DEPTH_M);
      const darkD = Math.max(0, d - 2 * DAYLIGHT_DEPTH_M);
      daylightPct = (1 - (darkW * darkD) / Math.max(1, footprint)) * 100;
    } else if (shape === 'shed') {
      volume = footprint * wallH + 0.5 * footprint * roofH;
      const slopeLen = Math.hypot(w, roofH);
      envelopeArea = perimeter * wallH + slopeLen * d + w * roofH + d * roofH;
      const darkW = Math.max(0, w - 2 * DAYLIGHT_DEPTH_M);
      const darkD = Math.max(0, d - 2 * DAYLIGHT_DEPTH_M);
      daylightPct = (1 - (darkW * darkD) / Math.max(1, footprint)) * 100;
    } else if (shape === 'gate') {
      const gw = Math.max(1, Math.min(Number(b.gw) || 6, w - 2));
      const gh = Math.max(1, Math.min((Number(b.gf) || 1) * floorH, wallH - 1));
      volume = Math.max(1, footprint * h - gw * gh * d);
      envelopeArea = perimeter * h + footprint - 2 * gw * gh + 2 * gh * d + gw * d;
      const darkW = Math.max(0, w - 2 * DAYLIGHT_DEPTH_M);
      const darkD = Math.max(0, d - 2 * DAYLIGHT_DEPTH_M);
      daylightPct = (1 - (darkW * darkD) / Math.max(1, footprint)) * 100;
    } else {
      // box or default
      volume = footprint * h;
      envelopeArea = perimeter * h + footprint;
      const darkW = Math.max(0, w - 2 * DAYLIGHT_DEPTH_M);
      const darkD = Math.max(0, d - 2 * DAYLIGHT_DEPTH_M);
      daylightPct = (1 - (darkW * darkD) / Math.max(1, footprint)) * 100;
    }

    const gfa = footprint * floors;
    const svr = volume > 0 ? envelopeArea / volume : 0;
    // Optimal 5-exposed-face ground-coupled rectangular prism envelope = 3 * (2 * V)^(2/3)
    const idealEnvelope = volume > 0 ? 3 * Math.pow(2 * volume, 2 / 3) : 0;
    const compactnessPct = envelopeArea > 0 ? Math.min(100, (idealEnvelope / envelopeArea) * 100) : 0;
    const slenderness = h / Math.max(0.5, Math.min(w, d));

    return {
      idx,
      id: b.id || ('idx_' + idx),
      name: b.name || ('Block ' + (idx + 1)),
      shape,
      fn: b.fn || '',
      mat: b.mat || 'brick',
      x: Number(b.x) || 0,
      z: Number(b.z) || 0,
      w: +w.toFixed(2),
      d: +d.toFixed(2),
      floors,
      y0: +y0.toFixed(2),
      height: +h.toFixed(2),
      topElev: +(y0 + h).toFixed(2),
      footprint: +footprint.toFixed(1),
      gfa: +gfa.toFixed(1),
      perimeter: +perimeter.toFixed(1),
      volume: +volume.toFixed(1),
      envelopeArea: +envelopeArea.toFixed(1),
      svr: +svr.toFixed(3),
      compactnessPct: +Math.max(0, Math.min(100, compactnessPct)).toFixed(1),
      slenderness: +slenderness.toFixed(2),
      daylightPct: +Math.max(0, Math.min(100, daylightPct)).toFixed(1)
    };
  }

  function getObb(b, w, d) {
    const rotDeg = getRotOf(b) + (Number(b.rot) || 0);
    const rad = (-rotDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // Local +X rotated by -rotDeg in XZ plane (Three.js rotation.y = rad)
    const ux = [cos, -sin];
    const uz = [sin, cos];
    const hw = w / 2;
    const hd = d / 2;
    const cx = Number(b.x) || 0;
    const cz = Number(b.z) || 0;
    const corners = [
      [cx + ux[0] * hw + uz[0] * hd, cz + ux[1] * hw + uz[1] * hd],
      [cx - ux[0] * hw + uz[0] * hd, cz - ux[1] * hw + uz[1] * hd],
      [cx - ux[0] * hw - uz[0] * hd, cz - ux[1] * hw - uz[1] * hd],
      [cx + ux[0] * hw - uz[0] * hd, cz + ux[1] * hw - uz[1] * hd]
    ];
    return { cx, cz, hw, hd, ux, uz, corners };
  }

  function pointToSegDist2D(px, pz, ax, az, bx, bz) {
    const vx = bx - ax;
    const vz = bz - az;
    const l2 = vx * vx + vz * vz;
    if (l2 <= 1e-12) return Math.hypot(px - ax, pz - az);
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / l2));
    return Math.hypot(px - (ax + t * vx), pz - (az + t * vz));
  }

  function obbOverlapOrDist2D(a, b) {
    const axes = [a.ux, a.uz, b.ux, b.uz];
    let minOverlap = Infinity;
    for (const axis of axes) {
      let minA = Infinity, maxA = -Infinity;
      for (const p of a.corners) {
        const proj = p[0] * axis[0] + p[1] * axis[1];
        if (proj < minA) minA = proj;
        if (proj > maxA) maxA = proj;
      }
      let minB = Infinity, maxB = -Infinity;
      for (const p of b.corners) {
        const proj = p[0] * axis[0] + p[1] * axis[1];
        if (proj < minB) minB = proj;
        if (proj > maxB) maxB = proj;
      }
      const overlap = Math.min(maxA, maxB) - Math.max(minA, minB);
      if (overlap <= 0) {
        // Separated: compute exact Euclidean distance between the two polygons
        let minDist = Infinity;
        for (const p of a.corners) {
          for (let k = 0; k < 4; k++) {
            const c1 = b.corners[k];
            const c2 = b.corners[(k + 1) % 4];
            const dist = pointToSegDist2D(p[0], p[1], c1[0], c1[1], c2[0], c2[1]);
            if (dist < minDist) minDist = dist;
          }
        }
        for (const p of b.corners) {
          for (let k = 0; k < 4; k++) {
            const c1 = a.corners[k];
            const c2 = a.corners[(k + 1) % 4];
            const dist = pointToSegDist2D(p[0], p[1], c1[0], c1[1], c2[0], c2[1]);
            if (dist < minDist) minDist = dist;
          }
        }
        return { overlap: 0, distance: minDist };
      }
      if (overlap < minOverlap) minOverlap = overlap;
    }
    return { overlap: minOverlap, distance: 0 };
  }

  function detectMassIssues(blocks, fh) {
    const floorH = Math.max(1, Number(fh) || 4);
    const list = Array.isArray(blocks) ? blocks : [];
    const active = [];
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!isMassAnalyzable(b)) continue;
      const [w, d] = getLocalDims(b);
      const h = getBlockHeight(b, floorH);
      const y0 = Number(b.y0) || 0;
      active.push({
        idx: i,
        id: b.id || ('idx_' + i),
        name: b.name || ('Block ' + (i + 1)),
        shape: b.shape || 'box',
        y0,
        top: y0 + h,
        obb: getObb(b, w, d)
      });
    }

    const collisions = [];
    const tightGaps = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const A = active[i];
        const B = active[j];
        const vOverlap = Math.min(A.top, B.top) - Math.max(A.y0, B.y0);
        if (vOverlap <= 0.1) continue;

        const rel = obbOverlapOrDist2D(A.obb, B.obb);
        if (rel.overlap > CLASH_MIN_PENETRATION_M) {
          collisions.push({
            aIdx: A.idx,
            bIdx: B.idx,
            aId: A.id,
            bId: B.id,
            aName: A.name,
            bName: B.name,
            penetration: +rel.overlap.toFixed(2),
            vOverlap: +vOverlap.toFixed(2)
          });
        } else if (rel.overlap === 0 && rel.distance > GAP_MIN_SEPARATION_M && rel.distance < TIGHT_GAP_MAX_M) {
          tightGaps.push({
            aIdx: A.idx,
            bIdx: B.idx,
            aId: A.id,
            bId: B.id,
            aName: A.name,
            bName: B.name,
            gap: +rel.distance.toFixed(2),
            vOverlap: +vOverlap.toFixed(2)
          });
        }
      }
    }
    return { collisions, tightGaps };
  }

  function analyzeProjectMasses(blocks, fh) {
    const list = Array.isArray(blocks) ? blocks : [];
    const items = [];
    const byIndex = {};

    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!isMassAnalyzable(b)) continue;
      const item = analyzeBlockMass(b, i, fh);
      items.push(item);
      byIndex[i] = item;
    }

    const { collisions, tightGaps } = detectMassIssues(list, fh);
    const issueIdxSet = new Set();
    const gapIdxSet = new Set();
    collisions.forEach(c => { issueIdxSet.add(c.aIdx); issueIdxSet.add(c.bIdx); });
    tightGaps.forEach(g => { gapIdxSet.add(g.aIdx); gapIdxSet.add(g.bIdx); });

    let totalVolume = 0;
    let totalEnvelope = 0;
    let totalGfa = 0;
    let totalFootprint = 0;
    let maxHeight = 0;
    let tallestName = '';
    let weightedCompactness = 0;
    let weightedDaylight = 0;

    items.forEach(it => {
      totalVolume += it.volume;
      totalEnvelope += it.envelopeArea;
      totalGfa += it.gfa;
      totalFootprint += it.footprint;
      weightedCompactness += it.compactnessPct * it.volume;
      weightedDaylight += it.daylightPct * it.gfa;
      if (it.topElev > maxHeight) {
        maxHeight = it.topElev;
        tallestName = it.name;
      }
    });

    const avgSvr = totalVolume > 0 ? totalEnvelope / totalVolume : 0;
    const avgCompactness = totalVolume > 0 ? weightedCompactness / totalVolume : 0;
    const avgDaylightPct = totalGfa > 0 ? weightedDaylight / totalGfa : 0;

    return {
      items,
      byIndex,
      collisions,
      tightGaps,
      issueIdxSet,
      gapIdxSet,
      summary: {
        count: items.length,
        totalVolume: +totalVolume.toFixed(1),
        totalEnvelope: +totalEnvelope.toFixed(1),
        totalGfa: +totalGfa.toFixed(1),
        totalFootprint: +totalFootprint.toFixed(1),
        avgSvr: +avgSvr.toFixed(3),
        avgCompactness: +avgCompactness.toFixed(1),
        avgDaylightPct: +avgDaylightPct.toFixed(1),
        maxHeight: +maxHeight.toFixed(1),
        tallestName,
        collisionCount: collisions.length,
        gapCount: tightGaps.length
      }
    };
  }

  function lerpHex(hexA, hexB, t) {
    const k = Math.max(0, Math.min(1, t));
    const pa = parseInt(hexA.slice(1), 16);
    const pb = parseInt(hexB.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k);
    const g = Math.round(((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k);
    const b = Math.round((pa & 255) * (1 - k) + (pb & 255) * k);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function ramp3(c1, c2, c3, t) {
    const k = Math.max(0, Math.min(1, t));
    return k < 0.5 ? lerpHex(c1, c2, k * 2) : lerpHex(c2, c3, (k - 0.5) * 2);
  }

  function getMassOverlayColor(item, mode, analysis) {
    if (!item || !mode || mode === 'none') return null;
    if (mode === 'height') {
      const maxH = Math.max(8, (analysis && analysis.summary && analysis.summary.maxHeight) || 40);
      const t = Math.max(0, Math.min(1, item.topElev / maxH));
      return ramp3('#38bdf8', '#f59e0b', '#be123c', t);
    }
    if (mode === 'svr') {
      // Lower S/V (~0.12) = compact thermal emerald; higher (~0.40) = exposed coral red
      const t = Math.max(0, Math.min(1, (item.svr - 0.12) / (0.40 - 0.12)));
      return ramp3('#10b981', '#f59e0b', '#e11d48', t);
    }
    if (mode === 'daylight') {
      // Lower daylight % (~45%) = deep indigo; higher (>=95%) = bright sunlit gold-green
      const t = Math.max(0, Math.min(1, (item.daylightPct - 45) / (98 - 45)));
      return ramp3('#4338ca', '#0ea5e9', '#10b981', t);
    }
    if (mode === 'issues') {
      if (analysis && analysis.issueIdxSet && analysis.issueIdxSet.has(item.idx)) return '#dc2626';
      if (analysis && analysis.gapIdxSet && analysis.gapIdxSet.has(item.idx)) return '#f59e0b';
      return '#10b981';
    }
    return null;
  }

  return {
    FLAT_MATS,
    PROP_SHAPES,
    DAYLIGHT_DEPTH_M,
    TIGHT_GAP_MAX_M,
    isMassAnalyzable,
    analyzeBlockMass,
    detectMassIssues,
    analyzeProjectMasses,
    getMassOverlayColor
  };
});
