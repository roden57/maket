(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_SHADOW_HEATMAP = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const MONTH_OFFSETS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const FLAT_MATS = { green: true, paving: true, asphalt: true, water: true };
  const PROP_SHAPES = { tree: [5, 5], person: [0.6, 0.6], car: [4.5, 1.9] };

  const COLOR_RAMPS = {
    thermal: {
      id: 'thermal',
      ar: 'حراري',
      en: 'Thermal',
      stops: [
        [0.00, [224, 242, 254, 105]], // pale sunlit sky
        [0.18, [56, 189, 248, 150]],  // light cool cyan
        [0.40, [250, 204, 21, 182]],  // warm yellow
        [0.65, [249, 115, 22, 206]],  // orange
        [0.85, [220, 38, 38, 222]],   // crimson
        [1.00, [88, 28, 135, 232]]    // deep violet (extreme shadow)
      ]
    },
    cool: {
      id: 'cool',
      ar: 'طيف الظل',
      en: 'Cool Shade',
      stops: [
        [0.00, [254, 249, 195, 95]],  // sunny cream
        [0.22, [167, 243, 208, 145]], // soft mint
        [0.48, [56, 189, 248, 180]],  // sky blue
        [0.74, [37, 99, 235, 208]],   // cobalt
        [1.00, [30, 27, 75, 232]]     // deep indigo
      ]
    }
  };

  function dayOfYear(month, day) {
    const m = Math.max(1, Math.min(12, Math.floor(month || 1)));
    const d = Math.max(1, Math.min(31, Math.floor(day || 1)));
    return MONTH_OFFSETS[m - 1] + d;
  }

  function sunPosition(lat, lon, tz, month, day, hour) {
    const N = dayOfYear(month, day);
    const g = (2 * Math.PI / 365) * (N - 1 + (hour - 12) / 24);
    const eqt = 229.18 * (
      0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g)
    );
    const dec =
      0.006918 -
      0.399912 * Math.cos(g) +
      0.070257 * Math.sin(g) -
      0.006758 * Math.cos(2 * g) +
      0.000907 * Math.sin(2 * g) -
      0.002697 * Math.cos(3 * g) +
      0.00148 * Math.sin(3 * g);

    const ha = ((hour * 60 + eqt + 4 * lon - 60 * tz) / 4 - 180) * Math.PI / 180;
    const la = lat * Math.PI / 180;
    const sinAlt = Math.max(-1, Math.min(1, Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha)));
    const alt = Math.asin(sinAlt);
    const azS = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(la) - Math.tan(dec) * Math.cos(la));
    const az = (azS + Math.PI + 2 * Math.PI) % (2 * Math.PI);
    return { alt, az };
  }

  function sunDirectionVector(alt, az, northDeg) {
    const th = az + ((northDeg || 0) * Math.PI / 180);
    const ca = Math.cos(alt);
    return {
      x: Math.sin(th) * ca,
      y: Math.sin(alt),
      z: -Math.cos(th) * ca
    };
  }

  function getAnnualSunSamples(opts) {
    const cfg = opts || {};
    const lat = Number.isFinite(Number(cfg.lat)) ? Number(cfg.lat) : 33.31;
    const lon = Number.isFinite(Number(cfg.lon)) ? Number(cfg.lon) : 44.36;
    const tz = Number.isFinite(Number(cfg.tz)) ? Number(cfg.tz) : 3;
    const north = Number.isFinite(Number(cfg.north)) ? Number(cfg.north) : 0;
    const stepHours = Number(cfg.stepHours) > 0 ? Number(cfg.stepHours) : 0.5;
    const minAlt = Number.isFinite(Number(cfg.minAlt)) ? Number(cfg.minAlt) : 0.03; // ~1.7 deg above horizon
    const daysPerMonth = cfg.daysPerMonth === 2 ? 2 : 1;

    const dayList = daysPerMonth === 2 ? [7, 21] : [21];
    const samples = [];
    const weightHours = (365 / (12 * dayList.length)) * stepHours;
    let totalDaylightHours = 0;

    for (let m = 1; m <= 12; m++) {
      for (let di = 0; di < dayList.length; di++) {
        const day = dayList[di];
        for (let h = 4.5; h <= 19.75 + 1e-6; h += stepHours) {
          const p = sunPosition(lat, lon, tz, m, day, h);
          if (p.alt > minAlt) {
            const dir = sunDirectionVector(p.alt, p.az, north);
            samples.push({
              month: m,
              day,
              hour: h,
              alt: p.alt,
              az: p.az,
              dir,
              weightHours
            });
            totalDaylightHours += weightHours;
          }
        }
      }
    }

    return { samples, totalDaylightHours };
  }

  function isBlockFlat(b) {
    return !!(b && FLAT_MATS[b.mat]);
  }

  function isBlockProp(b) {
    return !!(b && PROP_SHAPES[b.shape]);
  }

  function blockHeight(b, fh) {
    const floorH = Number(fh) > 0 ? Number(fh) : 4;
    if (!b) return 0;
    if (b.shape === 'tree') return (b.w || 5) * 1.3;
    if (b.shape === 'person') return 1.75;
    if (b.shape === 'car') return 1.55;
    if (isBlockFlat(b)) return b.mat === 'asphalt' ? 0.1 : 0.3;
    if (b.shape === 'riwaq') return Math.max(3, (b.f || 1) * floorH - 0.5);
    const rh = (b.shape === 'gable' || b.shape === 'shed') ? Math.max(0.5, b.rh === undefined ? 3 : b.rh) : 0;
    return (b.f || 1) * floorH + rh;
  }

  function blockRotDeg(b) {
    const ry = b.shape === 'box' || b.shape === 'riwaq' ? 0 : (b.ry || 0);
    return ry + (b.rot || 0);
  }

  function blockLocSize(b) {
    const ry = (b.shape === 'box' || b.shape === 'riwaq') ? 0 : (b.ry || 0);
    return (Math.abs(ry) % 180 === 0) ? [b.w, b.d] : [b.d, b.w];
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

  function pointInPoly(pts, x, z) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], zi = pts[i][1];
      const xj = pts[j][0], zj = pts[j][1];
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  function prepareBlock(b, fh) {
    if (!b || b.hidden || isBlockFlat(b) || b.mat === 'glass') return null;
    const h = blockHeight(b, fh);
    if (!(h > 0)) return null;
    const y0 = Number(b.y0) || 0;
    const y1 = y0 + h;
    const [w, d] = blockLocSize(b);
    if (!(w > 0 && d > 0)) return null;
    const rotRad = blockRotDeg(b) * Math.PI / 180;
    const cosA = Math.cos(rotRad);
    const sinA = Math.sin(rotRad);
    const W = w / 2;
    const D = d / 2;
    const poly = b.shape === 'poly' ? normalizedPolyPts(b, w, d) : null;
    const rHoriz = Math.hypot(W, D);

    const roofH = (b.shape === 'gable' || b.shape === 'shed')
      ? Math.max(0.5, b.rh === undefined ? 3 : b.rh)
      : 0;
    const courtThick = b.shape === 'court'
      ? Math.max(1, Math.min(b.t || 8, Math.min(w, d) / 2 - 1))
      : 0;
    const gateW = b.shape === 'gate' ? Math.max(1, Math.min(b.gw || 6, w - 2)) : 0;
    const gateH = b.shape === 'gate' ? Math.max(1, Math.min((b.gf || 1) * (fh || 4), h - 1)) : 0;

    const isAxisBox = (
      (b.shape === 'box' || !b.shape || b.shape === 'car' || b.shape === 'person') &&
      Math.abs(sinA) < 1e-6
    );
    const isOBB = (b.shape === 'box' || !b.shape || b.shape === 'car' || b.shape === 'person');
    const isVerticalPrism = (
      b.shape === 'box' || !b.shape || b.shape === 'cyl' || b.shape === 'tri' ||
      b.shape === 'L' || b.shape === 'U' || b.shape === 'ring' || b.shape === 'court' ||
      b.shape === 'poly'
    );

    const groundedSolid = (
      y0 < 0.5 &&
      !isBlockProp(b) &&
      b.shape !== 'riwaq' &&
      b.mat !== 'context'
    );

    return {
      b,
      shape: b.shape || 'box',
      x: b.x || 0,
      z: b.z || 0,
      w, d, W, D,
      y0, y1, h,
      cosA, sinA,
      rHoriz,
      poly,
      roofH,
      courtThick,
      gateW,
      gateH,
      isAxisBox,
      isOBB,
      isVerticalPrism,
      groundedSolid
    };
  }

  function insidePlanLocal(pb, lx, lz) {
    const W = pb.W, D = pb.D;
    if (Math.abs(lx) > W || Math.abs(lz) > D) return false;
    switch (pb.shape) {
      case 'cyl':
        return (lx / W) * (lx / W) + (lz / D) * (lz / D) <= 1;
      case 'ring': {
        const r = (lx / W) * (lx / W) + (lz / D) * (lz / D);
        return r <= 1 && r >= 0.36;
      }
      case 'poly':
        return pb.poly ? pointInPoly(pb.poly, lx, lz) : true;
      case 'tri':
        return (lx + W) / (2 * W) + (lz + D) / (2 * D) <= 1;
      case 'L': {
        const t = Math.min(pb.w, pb.d) * 0.45;
        return !(lx > -W + t && lz > -D + t);
      }
      case 'U': {
        const t = Math.min(pb.w, pb.d) * 0.3;
        return !(lx > -W + t && lx < W - t && lz > -D + t);
      }
      case 'court': {
        const t = pb.courtThick;
        return !(Math.abs(lx) < W - t && Math.abs(lz) < D - t);
      }
      default:
        return true;
    }
  }

  function insideBlock3D(pb, wx, wy, wz) {
    if (wy < pb.y0 || wy > pb.y1) return false;
    const u = wx - pb.x;
    const v = wz - pb.z;
    const lx = u * pb.cosA + v * pb.sinA;
    const lz = -u * pb.sinA + v * pb.cosA;
    const W = pb.W, D = pb.D;
    if (Math.abs(lx) > W || Math.abs(lz) > D) return false;
    const ly = wy - pb.y0;

    switch (pb.shape) {
      case 'gate':
        if (Math.abs(lx) < pb.gateW * 0.5 && ly < pb.gateH) return false;
        return true;
      case 'pyr': {
        const s = Math.max(0, 1 - ly / pb.h);
        return Math.abs(lx) <= W * s && Math.abs(lz) <= D * s;
      }
      case 'gable': {
        const wallH = pb.h - pb.roofH;
        if (ly <= wallH) return true;
        const frac = Math.max(0, 1 - (ly - wallH) / pb.roofH);
        return Math.abs(lx) <= W * frac;
      }
      case 'shed': {
        const wallH = pb.h - pb.roofH;
        const roofAtX = wallH + pb.roofH * ((W - lx) / (2 * W));
        return ly <= roofAtX;
      }
      case 'vault': {
        const ry = ly / pb.h;
        return (lx / W) * (lx / W) + ry * ry <= 1;
      }
      case 'riwaq': {
        if (ly >= pb.h - 0.5) {
          return Math.abs(lx) >= W - 0.5 || Math.abs(lz) >= D - 0.5;
        }
        return Math.abs(lx) >= W - 0.45 || Math.abs(lz) >= D - 0.45;
      }
      case 'tree': {
        const trunkTop = pb.h * 0.4;
        if (ly <= trunkTop) return (lx * lx + lz * lz) <= 0.25 * 0.25;
        const crR = W;
        const cy = pb.h - crR;
        const dy = (ly - cy) / 0.9;
        return (lx * lx + lz * lz + dy * dy) <= crR * crR;
      }
      default:
        return insidePlanLocal(pb, lx, lz);
    }
  }

  // Exact analytical ray-OBB intersection for rectangular blocks
  function rayHitsOBB(pb, gx, yGround, gz, sx, sy, sz) {
    const du = gx - pb.x;
    const dv = gz - pb.z;
    const ox = du * pb.cosA + dv * pb.sinA;
    const oz = -du * pb.sinA + dv * pb.cosA;
    const oy = yGround;

    const dx = sx * pb.cosA + sz * pb.sinA;
    const dz = -sx * pb.sinA + sz * pb.cosA;
    const dy = sy;

    let tMin = 0.05;
    let tMax = Infinity;

    // Y slab
    const ty1 = (pb.y0 - oy) / dy;
    const ty2 = (pb.y1 - oy) / dy;
    tMin = Math.max(tMin, Math.min(ty1, ty2));
    tMax = Math.min(tMax, Math.max(ty1, ty2));
    if (tMax < tMin) return false;

    // X slab
    if (Math.abs(dx) < 1e-8) {
      if (ox < -pb.W || ox > pb.W) return false;
    } else {
      const tx1 = (-pb.W - ox) / dx;
      const tx2 = (pb.W - ox) / dx;
      tMin = Math.max(tMin, Math.min(tx1, tx2));
      tMax = Math.min(tMax, Math.max(tx1, tx2));
      if (tMax < tMin) return false;
    }

    // Z slab
    if (Math.abs(dz) < 1e-8) {
      if (oz < -pb.D || oz > pb.D) return false;
    } else {
      const tz1 = (-pb.D - oz) / dz;
      const tz2 = (pb.D - oz) / dz;
      tMin = Math.max(tMin, Math.min(tz1, tz2));
      tMax = Math.min(tMax, Math.max(tz1, tz2));
      if (tMax < tMin) return false;
    }

    return tMax >= tMin;
  }

  // Exact ray intersection with elliptical cylinder
  function rayHitsEllipticCyl(pb, gx, yGround, gz, sx, sy, sz) {
    const tY0 = Math.max(0.05, (pb.y0 - yGround) / sy);
    const tY1 = (pb.y1 - yGround) / sy;
    if (tY1 < tY0) return false;

    const du = gx - pb.x;
    const dv = gz - pb.z;
    const ox = (du * pb.cosA + dv * pb.sinA) / pb.W;
    const oz = (-du * pb.sinA + dv * pb.cosA) / pb.D;
    const dx = (sx * pb.cosA + sz * pb.sinA) / pb.W;
    const dz = (-sx * pb.sinA + sz * pb.cosA) / pb.D;

    const A = dx * dx + dz * dz;
    if (A < 1e-10) {
      return (ox * ox + oz * oz) <= 1;
    }
    const B = 2 * (ox * dx + oz * dz);
    const C = ox * ox + oz * oz - 1;
    const disc = B * B - 4 * A * C;
    if (disc < 0) return false;
    const sq = Math.sqrt(disc);
    const t0 = (-B - sq) / (2 * A);
    const t1 = (-B + sq) / (2 * A);
    return Math.max(t0, tY0) <= Math.min(t1, tY1);
  }

  function rayHitsBlock(pb, gx, yGround, gz, sx, sy, sz) {
    if (pb.isOBB) return rayHitsOBB(pb, gx, yGround, gz, sx, sy, sz);
    if (pb.shape === 'cyl') return rayHitsEllipticCyl(pb, gx, yGround, gz, sx, sy, sz);

    const tLo = Math.max(0.05, (pb.y0 - yGround) / sy);
    const tHi = (pb.y1 - yGround) / sy;
    if (tHi <= tLo) return false;

    const yLo = yGround + tLo * sy;
    const yHi = yGround + tHi * sy;
    const span = yHi - yLo;
    const rx = sx / sy;
    const rz = sz / sy;

    if (pb.isVerticalPrism) {
      const steps = Math.max(3, Math.min(18, Math.ceil(span / 1.1)));
      for (let k = 0; k <= steps; k++) {
        const y = yLo + (span * k) / steps;
        const dy = y - yGround;
        const wx = gx + dy * rx;
        const wz = gz + dy * rz;
        const u = wx - pb.x;
        const v = wz - pb.z;
        const lx = u * pb.cosA + v * pb.sinA;
        const lz = -u * pb.sinA + v * pb.cosA;
        if (insidePlanLocal(pb, lx, lz)) return true;
      }
      return false;
    }

    const steps = Math.max(4, Math.min(20, Math.ceil(span / 0.85)));
    for (let k = 0; k <= steps; k++) {
      const y = yLo + (span * k) / steps;
      const dy = y - yGround;
      if (insideBlock3D(pb, gx + dy * rx, y, gz + dy * rz)) return true;
    }
    return false;
  }

  /**
   * Computes annual shadow accumulation across the site ground.
   * @param {Object} input
   * @returns {Object} grid metrics, cell ratios, hours, footprint mask, and summary stats
   */
  function computeAnnualShadowHeatmap(input) {
    const opts = input || {};
    const site = opts.site || {};
    const W = Math.max(10, Number(site.w) || 100);
    const D = Math.max(10, Number(site.d) || 100);
    const fh = Number(opts.fh) > 0 ? Number(opts.fh) : 4;
    const yGround = Number.isFinite(Number(opts.yGround)) ? Number(opts.yGround) : 0.05;

    const quality = opts.quality === 'high' ? 'high' : 'std';
    const maxDim = quality === 'high' ? 88 : 58;
    const minDim = 24;
    const scale = Math.max(W, D) / maxDim;
    const cols = Math.max(minDim, Math.min(maxDim, Math.round(W / scale)));
    const rows = Math.max(minDim, Math.min(maxDim, Math.round(D / scale)));
    const cellW = W / cols;
    const cellD = D / rows;
    const cellArea = cellW * cellD;
    const totalCells = cols * rows;

    const blocks = Array.isArray(opts.blocks) ? opts.blocks : [];
    const prepared = [];
    for (let i = 0; i < blocks.length; i++) {
      const pb = prepareBlock(blocks[i], fh);
      if (pb) prepared.push(pb);
    }

    const { samples, totalDaylightHours } = getAnnualSunSamples({
      lat: site.lat,
      lon: site.lon,
      tz: site.tz,
      north: site.north,
      stepHours: opts.stepHours || (quality === 'high' ? 0.5 : 0.5),
      daysPerMonth: opts.daysPerMonth || 1
    });

    const shadowHours = new Float32Array(totalCells);
    const shadowRatio = new Float32Array(totalCells);
    const footprintMask = new Uint8Array(totalCells);

    // Precompute cell coordinates & grounded solid footprints
    const xs = new Float32Array(cols);
    const zs = new Float32Array(rows);
    for (let ix = 0; ix < cols; ix++) xs[ix] = -W / 2 + (ix + 0.5) * cellW;
    for (let iz = 0; iz < rows; iz++) zs[iz] = -D / 2 + (iz + 0.5) * cellD;

    const solidBlocks = prepared.filter(pb => pb.groundedSolid);
    if (solidBlocks.length) {
      for (let iz = 0; iz < rows; iz++) {
        const gz = zs[iz];
        for (let ix = 0; ix < cols; ix++) {
          const gx = xs[ix];
          for (let bi = 0; bi < solidBlocks.length; bi++) {
            const pb = solidBlocks[bi];
            if (Math.abs(gx - pb.x) > pb.rHoriz || Math.abs(gz - pb.z) > pb.rHoriz) continue;
            const u = gx - pb.x;
            const v = gz - pb.z;
            const lx = u * pb.cosA + v * pb.sinA;
            const lz = -u * pb.sinA + v * pb.cosA;
            if (insidePlanLocal(pb, lx, lz)) {
              footprintMask[iz * cols + ix] = 1;
              break;
            }
          }
        }
      }
    }

    if (prepared.length && totalDaylightHours > 0) {
      const shadedThisSample = new Uint8Array(totalCells);

      for (let si = 0; si < samples.length; si++) {
        const smp = samples[si];
        const sx = smp.dir.x;
        const sy = smp.dir.y;
        const sz = smp.dir.z;
        const rx = sx / sy;
        const rz = sz / sy;
        shadedThisSample.fill(0);

        for (let bi = 0; bi < prepared.length; bi++) {
          const pb = prepared[bi];
          const dy0 = Math.max(0, pb.y0 - yGround);
          const dy1 = Math.max(0, pb.y1 - yGround);
          if (dy1 <= dy0) continue;

          const shiftX0 = dy0 * rx;
          const shiftX1 = dy1 * rx;
          const shiftZ0 = dy0 * rz;
          const shiftZ1 = dy1 * rz;

          const sMinX = pb.x - pb.rHoriz - Math.max(shiftX0, shiftX1);
          const sMaxX = pb.x + pb.rHoriz - Math.min(shiftX0, shiftX1);
          const sMinZ = pb.z - pb.rHoriz - Math.max(shiftZ0, shiftZ1);
          const sMaxZ = pb.z + pb.rHoriz - Math.min(shiftZ0, shiftZ1);

          const ix0 = Math.max(0, Math.floor((sMinX + W / 2) / cellW));
          const ix1 = Math.min(cols - 1, Math.floor((sMaxX + W / 2) / cellW));
          const iz0 = Math.max(0, Math.floor((sMinZ + D / 2) / cellD));
          const iz1 = Math.min(rows - 1, Math.floor((sMaxZ + D / 2) / cellD));

          if (ix1 < ix0 || iz1 < iz0) continue;

          for (let iz = iz0; iz <= iz1; iz++) {
            const gz = zs[iz];
            const rowOff = iz * cols;
            for (let ix = ix0; ix <= ix1; ix++) {
              const idx = rowOff + ix;
              if (shadedThisSample[idx]) continue;
              if (rayHitsBlock(pb, xs[ix], yGround, gz, sx, sy, sz)) {
                shadedThisSample[idx] = 1;
              }
            }
          }
        }

        const wh = smp.weightHours;
        for (let idx = 0; idx < totalCells; idx++) {
          if (shadedThisSample[idx]) shadowHours[idx] += wh;
        }
      }
    }

    let openCount = 0;
    let sumRatio = 0;
    let maxRatio = 0;
    let maxHours = 0;
    let heavyCells = 0;
    let moderateCells = 0;

    for (let idx = 0; idx < totalCells; idx++) {
      const r = totalDaylightHours > 0 ? Math.min(1, shadowHours[idx] / totalDaylightHours) : 0;
      shadowRatio[idx] = r;
      if (!footprintMask[idx]) {
        openCount++;
        sumRatio += r;
        if (r > maxRatio) {
          maxRatio = r;
          maxHours = shadowHours[idx];
        }
        if (r >= 0.5) heavyCells++;
        if (r >= 0.25) moderateCells++;
      }
    }

    const avgRatio = openCount > 0 ? sumRatio / openCount : 0;
    const avgHours = avgRatio * totalDaylightHours;
    const openArea = openCount * cellArea;
    const heavyArea = heavyCells * cellArea;
    const heavyShare = openCount > 0 ? heavyCells / openCount : 0;
    const moderateShare = openCount > 0 ? moderateCells / openCount : 0;

    return {
      siteW: W,
      siteD: D,
      cols,
      rows,
      cellW,
      cellD,
      quality,
      sampleCount: samples.length,
      totalDaylightHours,
      shadowHours,
      shadowRatio,
      footprintMask,
      stats: {
        avgRatio,
        avgHours,
        maxRatio,
        maxHours,
        openArea,
        heavyArea,
        heavyShare,
        moderateShare,
        openCells: openCount
      }
    };
  }

  function sampleColorRamp(t, rampId) {
    const ramp = COLOR_RAMPS[rampId] || COLOR_RAMPS.thermal;
    const stops = ramp.stops;
    const clamped = Math.max(0, Math.min(1, Number(t) || 0));
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, c0] = stops[i];
      const [t1, c1] = stops[i + 1];
      if (clamped >= t0 && clamped <= t1) {
        const u = t1 > t0 ? (clamped - t0) / (t1 - t0) : 0;
        return [
          Math.round(c0[0] + (c1[0] - c0[0]) * u),
          Math.round(c0[1] + (c1[1] - c0[1]) * u),
          Math.round(c0[2] + (c1[2] - c0[2]) * u),
          Math.round(c0[3] + (c1[3] - c0[3]) * u)
        ];
      }
    }
    const last = stops[stops.length - 1][1];
    return [last[0], last[1], last[2], last[3]];
  }

  function probeHeatmapAt(result, worldX, worldZ) {
    if (!result || !result.cols || !result.rows) return null;
    const u = (worldX + result.siteW / 2) / result.siteW;
    const v = (worldZ + result.siteD / 2) / result.siteD;
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    const ix = Math.min(result.cols - 1, Math.max(0, Math.floor(u * result.cols)));
    const iz = Math.min(result.rows - 1, Math.max(0, Math.floor(v * result.rows)));
    const idx = iz * result.cols + ix;
    return {
      ix,
      iz,
      inBuilding: !!result.footprintMask[idx],
      ratio: result.shadowRatio[idx],
      hours: result.shadowHours[idx],
      totalDaylightHours: result.totalDaylightHours
    };
  }

  function rampCssGradient(rampId) {
    const ramp = COLOR_RAMPS[rampId] || COLOR_RAMPS.thermal;
    const parts = ramp.stops.map(([t, c]) => {
      const a = Math.max(0.55, (c[3] / 255)).toFixed(2);
      return `rgba(${c[0]},${c[1]},${c[2]},${a}) ${Math.round(t * 100)}%`;
    });
    return `linear-gradient(to right, ${parts.join(', ')})`;
  }

  return {
    COLOR_RAMPS,
    dayOfYear,
    sunPosition,
    sunDirectionVector,
    getAnnualSunSamples,
    computeAnnualShadowHeatmap,
    sampleColorRamp,
    probeHeatmapAt,
    rampCssGradient
  };
});
