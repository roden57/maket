(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_SECTION = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const FLAT_MATS = { green: true, paving: true, asphalt: true, water: true };
  const PROP_SHAPES = { tree: [5, 5], person: [0.6, 0.6], car: [4.5, 1.9] };

  function isBlockFlat(b) {
    return !!(b && FLAT_MATS[b.mat]);
  }

  function isBlockProp(b) {
    return !!(b && PROP_SHAPES[b.shape]);
  }

  function countsAsBuilding(b) {
    return !!(b && !isBlockProp(b) && !isBlockFlat(b) && b.shape !== 'riwaq' && b.mat !== 'context');
  }

  function blockHeight(b, fh) {
    const floorH = Number(fh) > 0 ? Number(fh) : 4;
    if (!b) return 0;
    if (b.shape === 'tree') return (b.w || 5) * 1.3;
    if (b.shape === 'person') return 1.75;
    if (b.shape === 'car') return 1.55;
    if (isBlockFlat(b)) return b.mat === 'asphalt' ? 0.1 : 0.3;
    if (b.shape === 'riwaq') return Math.max(3, (b.f || 1) * floorH - 0.5);
    const rh = (b.shape === 'gable' || b.shape === 'shed')
      ? Math.max(0.5, b.rh === undefined ? 3 : b.rh)
      : 0;
    return (b.f || 1) * floorH + rh;
  }

  function blockLocSize(b) {
    const ry = (b.shape === 'box' || b.shape === 'riwaq') ? 0 : (b.ry || 0);
    return (Math.abs(ry) % 180 === 0) ? [b.w, b.d] : [b.d, b.w];
  }

  function blockRotDeg(b) {
    const ry = (b.shape === 'box' || b.shape === 'riwaq') ? 0 : (b.ry || 0);
    return ry + (b.rot || 0);
  }

  function normalizedPolyPts(b, w, d) {
    if (!Array.isArray(b.pts) || b.pts.length < 3) return null;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < b.pts.length; i++) {
      const p = b.pts[i];
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < z0) z0 = p[1];
      if (p[1] > z1) z1 = p[1];
    }
    const pw = (x1 - x0) || 1;
    const pd = (z1 - z0) || 1;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    return b.pts.map(p => [(p[0] - cx) * w / pw, (p[1] - cz) * d / pd]);
  }

  function blockFootprintRings(b) {
    const [w, d] = b.shape === 'riwaq' ? [b.w, b.d] : blockLocSize(b);
    const W = w / 2;
    const D = d / 2;
    let rings = [];
    const ell = (rx, rz) => Array.from({ length: 32 }, (_, k) => {
      const a = (k / 32) * Math.PI * 2;
      return [Math.cos(a) * rx, Math.sin(a) * rz];
    });
    switch (b.shape) {
      case 'cyl':
      case 'person':
      case 'tree':
        rings = [ell(W, D)];
        break;
      case 'ring':
        rings = [ell(W, D), ell(W * 0.6, D * 0.6)];
        break;
      case 'tri':
        rings = [[[-W, -D], [W, -D], [-W, D]]];
        break;
      case 'L': {
        const t = Math.min(w, d) * 0.45;
        rings = [[[-W, -D], [W, -D], [W, -D + t], [-W + t, -D + t], [-W + t, D], [-W, D]]];
        break;
      }
      case 'U': {
        const t = Math.min(w, d) * 0.3;
        rings = [[[-W, -D], [W, -D], [W, D], [W - t, D], [W - t, -D + t], [-W + t, -D + t], [-W + t, D], [-W, D]]];
        break;
      }
      case 'poly': {
        const P = normalizedPolyPts(b, w, d);
        rings = [P || [[-W, -D], [W, -D], [W, D], [-W, D]]];
        break;
      }
      case 'court': {
        const t = Math.max(1, Math.min(b.t || 8, Math.min(w, d) / 2 - 1));
        rings = [
          [[-W, -D], [W, -D], [W, D], [-W, D]],
          [[-W + t, -D + t], [W - t, -D + t], [W - t, D - t], [-W + t, D - t]]
        ];
        break;
      }
      default:
        rings = [[[-W, -D], [W, -D], [W, D], [-W, D]]];
    }

    const th = -blockRotDeg(b) * Math.PI / 180;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const bx = b.x || 0;
    const bz = b.z || 0;
    return rings.map(ring => ring.map(([lx, lz]) => [bx + lx * c + lz * s, bz - lx * s + lz * c]));
  }

  function ringArea(pts) {
    let a = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
    }
    return Math.abs(a * 0.5);
  }

  function blockPlanArea(b) {
    const rings = blockFootprintRings(b);
    if (!rings.length) return 0;
    let total = ringArea(rings[0]);
    for (let i = 1; i < rings.length; i++) total -= ringArea(rings[i]);
    return Math.max(0, total);
  }

  /**
   * Computes primary & optional secondary slice-band plane parameters.
   * Convention matches Three.js clipping: points with (n · P + constant) >= 0 are kept.
   */
  function buildSectionPlaneParams(opts) {
    const cfg = opts || {};
    const axis = cfg.axis === 'y' ? 'y' : (cfg.axis === 'z' ? 'z' : 'x');
    const pos = Number.isFinite(Number(cfg.pos)) ? Number(cfg.pos) : 0;
    const flip = !!cfg.flip;
    const angleDeg = axis === 'y' ? 0 : (Number(cfg.angleDeg) || 0);
    const sliceOn = !!cfg.sliceOn;
    const thickness = Math.max(1, Number(cfg.thickness) || 10);

    let nx, ny, nz;
    let px, py, pz;

    if (axis === 'y') {
      nx = 0;
      ny = flip ? 1 : -1;
      nz = 0;
      px = 0;
      py = pos;
      pz = 0;
    } else {
      const a = angleDeg * Math.PI / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // Base outward normal when flip=true: (1,0,0) for X, (0,0,1) for Z
      let bx = axis === 'x' ? 1 : 0;
      let bz = axis === 'z' ? 1 : 0;
      // Rotate in XZ around Y
      const rx = bx * ca + bz * sa;
      const rz = -bx * sa + bz * ca;
      px = rx * pos;
      py = 0;
      pz = rz * pos;
      nx = flip ? rx : -rx;
      ny = 0;
      nz = flip ? rz : -rz;
    }

    const znorm = v => (Math.abs(v) < 1e-12 ? 0 : v);
    nx = znorm(nx);
    ny = znorm(ny);
    nz = znorm(nz);
    const constant = znorm(-(nx * px + ny * py + nz * pz));
    // Tangent along horizontal cut line (pointing right when viewing opposite normal)
    const tx = znorm(axis === 'y' ? 1 : -nz);
    const tz = znorm(axis === 'y' ? 0 : nx);

    let second = null;
    if (sliceOn) {
      // Second plane sits `thickness` meters behind primary plane into the kept half-space
      const nx2 = znorm(-nx);
      const ny2 = znorm(-ny);
      const nz2 = znorm(-nz);
      const p2x = px + nx * thickness;
      const p2y = py + ny * thickness;
      const p2z = pz + nz * thickness;
      const constant2 = znorm(-(nx2 * p2x + ny2 * p2y + nz2 * p2z));
      second = {
        normal: { x: nx2, y: ny2, z: nz2 },
        constant: constant2,
        point: { x: p2x, y: p2y, z: p2z }
      };
    }

    return {
      axis,
      pos,
      flip,
      angleDeg,
      sliceOn,
      thickness,
      normal: { x: nx, y: ny, z: nz },
      constant,
      point: { x: znorm(px), y: znorm(py), z: znorm(pz) },
      tangent: { x: tx, y: 0, z: tz },
      second
    };
  }

  /**
   * Intersects a vertical cut line P(u) = P0 + u * tangent with a block's footprint rings.
   * Uses even-odd crossing rule so courtyards & rings naturally split into wall segments.
   */
  function intersectVerticalCutWithRings(rings, P0, normal, tangent) {
    const crossings = [];
    for (let ri = 0; ri < rings.length; ri++) {
      const ring = rings[ri];
      if (!ring || ring.length < 3) continue;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const ax = ring[j][0], az = ring[j][1];
        const bx = ring[i][0], bz = ring[i][1];
        const sa = (ax - P0.x) * normal.x + (az - P0.z) * normal.z;
        const sb = (bx - P0.x) * normal.x + (bz - P0.z) * normal.z;
        if ((sa <= 0 && sb > 0) || (sb <= 0 && sa > 0)) {
          const frac = -sa / (sb - sa);
          const cx = ax + frac * (bx - ax);
          const cz = az + frac * (bz - az);
          const u = (cx - P0.x) * tangent.x + (cz - P0.z) * tangent.z;
          crossings.push(u);
        }
      }
    }
    crossings.sort((a, b) => a - b);
    const intervals = [];
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const u0 = crossings[k];
      const u1 = crossings[k + 1];
      if (u1 - u0 > 0.05) intervals.push([u0, u1]);
    }
    return intervals;
  }

  /**
   * Computes exact section-cut summary, intersected blocks, 3D cap segments, and 2D diagram data.
   */
  function analyzeSectionCut(input) {
    const opts = input || {};
    const fh = Number(opts.fh) > 0 ? Number(opts.fh) : 4;
    const blocks = Array.isArray(opts.blocks) ? opts.blocks : [];
    const params = buildSectionPlaneParams(opts);
    const { axis, pos, normal, constant, point, tangent, second } = params;

    const cutItems = [];
    const capSegments = [];
    const capSegments2 = [];
    const cutItems2 = [];
    let visibleCount = 0;
    let clippedCount = 0;
    let totalCutArea = 0;
    let maxCutHeight = 0;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!b || b.hidden || isBlockProp(b)) continue;
      const h = blockHeight(b, fh);
      const y0 = Number(b.y0) || 0;
      const y1 = y0 + h;
      const rings = blockFootprintRings(b);

      if (axis === 'y') {
        const minY = y0;
        const maxY = y1;
        const isCut = minY <= pos + 1e-4 && maxY >= pos - 1e-4;
        if (second && !isBlockFlat(b) && minY <= second.point.y + 1e-4 && maxY >= second.point.y - 1e-4) {
          cutItems2.push({ index: i, y0, y1, rings });
        }
        if (isCut) {
          const area = isBlockFlat(b) ? 0 : blockPlanArea(b);
          if (!isBlockFlat(b)) {
            cutItems.push({
              index: i,
              id: b.id || ('b' + i),
              name: b.name || '',
              fn: b.fn || '',
              mat: b.mat || 'brick',
              shape: b.shape || 'box',
              y0,
              y1,
              height: y1,
              floors: b.f || 1,
              cutArea: area,
              rings
            });
            totalCutArea += area;
            if (y1 > maxCutHeight) maxCutHeight = y1;
          }
          visibleCount++;
        } else {
          // Check against clipping half-space
          const s0 = normal.y * minY + constant;
          const s1 = normal.y * maxY + constant;
          const keepPrimary = Math.max(s0, s1) > -1e-4;
          const keepSecond = !second || Math.max(second.normal.y * minY + second.constant, second.normal.y * maxY + second.constant) > -1e-4;
          if (keepPrimary && keepSecond) visibleCount++;
          else clippedCount++;
        }
        continue;
      }

      // Vertical cut (X or Z, optionally angled)
      if (second && !isBlockFlat(b)) {
        const intervals2 = intersectVerticalCutWithRings(rings, second.point, second.normal, tangent);
        for (let k = 0; k < intervals2.length; k++) {
          capSegments2.push({ index: i, u0: intervals2[k][0], u1: intervals2[k][1], y0, y1 });
        }
      }
      const intervals = intersectVerticalCutWithRings(rings, point, normal, tangent);
      if (intervals.length && !isBlockFlat(b)) {
        let blockCutArea = 0;
        let cutSpanWidth = 0;
        for (let k = 0; k < intervals.length; k++) {
          const [u0, u1] = intervals[k];
          const wSpan = u1 - u0;
          cutSpanWidth += wSpan;
          blockCutArea += wSpan * h;
          capSegments.push({
            index: i,
            id: b.id || ('b' + i),
            name: b.name || '',
            fn: b.fn || '',
            mat: b.mat || 'brick',
            shape: b.shape || 'box',
            u0,
            u1,
            y0,
            y1
          });
        }
        cutItems.push({
          index: i,
          id: b.id || ('b' + i),
          name: b.name || '',
          fn: b.fn || '',
          mat: b.mat || 'brick',
          shape: b.shape || 'box',
          y0,
          y1,
          height: y1,
          floors: b.f || 1,
          cutSpanWidth,
          cutArea: blockCutArea,
          intervals
        });
        totalCutArea += blockCutArea;
        if (y1 > maxCutHeight) maxCutHeight = y1;
        visibleCount++;
      } else {
        // Check whether block lies on kept or clipped side
        let sMin = Infinity, sMax = -Infinity;
        for (let ri = 0; ri < rings.length; ri++) {
          for (let vi = 0; vi < rings[ri].length; vi++) {
            const [vx, vz] = rings[ri][vi];
            const s = normal.x * vx + normal.z * vz + constant;
            if (s < sMin) sMin = s;
            if (s > sMax) sMax = s;
          }
        }
        if (sMax <= 1e-4) {
          clippedCount++;
        } else if (second) {
          let s2Max = -Infinity;
          for (let ri = 0; ri < rings.length; ri++) {
            for (let vi = 0; vi < rings[ri].length; vi++) {
              const [vx, vz] = rings[ri][vi];
              const s2 = second.normal.x * vx + second.normal.z * vz + second.constant;
              if (s2 > s2Max) s2Max = s2;
            }
          }
          if (s2Max <= 1e-4) clippedCount++;
          else visibleCount++;
        } else {
          visibleCount++;
        }
      }
    }

    return {
      params,
      cutItems,
      cutItems2,
      capSegments,
      capSegments2,
      cutCount: cutItems.length,
      visibleCount,
      clippedCount,
      totalCutArea,
      maxCutHeight,
      buildingFloorCount: Math.max(1, ...blocks.filter(countsAsBuilding).map(b => Math.round(((b.y0 || 0) + blockHeight(b, fh)) / fh)))
    };
  }

  return {
    blockHeight,
    blockFootprintRings,
    blockPlanArea,
    buildSectionPlaneParams,
    intersectVerticalCutWithRings,
    analyzeSectionCut
  };
});
