(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_ANALYSIS = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FLAT_MATS = ['green', 'paving', 'asphalt', 'water'];
  const PROP_SHAPES = ['tree', 'person', 'car'];
  const MONTH_OFFSETS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  function isAnalyzable(b) {
    if (!b || typeof b !== 'object' || b.hidden) return false;
    if (PROP_SHAPES.includes(b.shape)) return false;
    if (FLAT_MATS.includes(b.mat)) return false;
    if (b.shape === 'riwaq' || b.mat === 'context') return false;
    return true;
  }

  function getRotOf(b) {
    return (b.shape === 'box' || b.shape === 'riwaq') ? 0 : (Number(b.ry) || 0);
  }

  function getLocalDims(b) {
    const w = Math.max(0.5, Number(b && b.w) || 10);
    const d = Math.max(0.5, Number(b && b.d) || 10);
    return Math.abs(getRotOf(b)) % 180 === 0 ? [w, d] : [d, w];
  }

  function getRoofHeight(b) {
    if (!b || (b.shape !== 'gable' && b.shape !== 'shed')) return 0;
    return Math.max(0.5, b.rh === undefined ? 3 : (Number(b.rh) || 0));
  }

  function getBlockHeight(b, fh) {
    const floorH = Math.max(1, Number(fh) || 4);
    const floors = Math.max(1, Number(b && b.f) || 1);
    return floors * floorH + getRoofHeight(b);
  }

  function getObb(b) {
    const [w, d] = getLocalDims(b);
    const rotDeg = getRotOf(b) + (Number(b && b.rot) || 0);
    const rad = (-rotDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const ux = [cos, -sin];
    const uz = [sin, cos];
    const hw = w / 2;
    const hd = d / 2;
    const cx = Number(b && b.x) || 0;
    const cz = Number(b && b.z) || 0;
    const corners = [
      [cx + ux[0] * hw + uz[0] * hd, cz + ux[1] * hw + uz[1] * hd],
      [cx - ux[0] * hw + uz[0] * hd, cz - ux[1] * hw + uz[1] * hd],
      [cx - ux[0] * hw - uz[0] * hd, cz - ux[1] * hw - uz[1] * hd],
      [cx + ux[0] * hw - uz[0] * hd, cz + ux[1] * hw - uz[1] * hd]
    ];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of corners) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minZ) minZ = p[1];
      if (p[1] > maxZ) maxZ = p[1];
    }
    return { cx, cz, hw, hd, w, d, ux, uz, corners, minX, maxX, minZ, maxZ };
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

  function segIntersectsAabb2D(ax, az, bx, bz, minX, maxX, minZ, maxZ) {
    let t0 = 0;
    let t1 = 1;
    const dx = bx - ax;
    const dz = bz - az;
    const checks = [
      [-dx, ax - minX],
      [dx, maxX - ax],
      [-dz, az - minZ],
      [dz, maxZ - az]
    ];
    for (const [p, q] of checks) {
      if (Math.abs(p) < 1e-9) {
        if (q < 0) return false;
      } else {
        const r = q / p;
        if (p < 0) {
          if (r > t1) return false;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return false;
          if (r < t1) t1 = r;
        }
      }
    }
    return t0 <= t1;
  }

  // ---------- 1. Solar & Exposure Analysis ----------
  function sunPosition(lat, lon, tz, month, day, hour) {
    const N = MONTH_OFFSETS[Math.max(0, Math.min(11, (month || 1) - 1))] + (day || 21);
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

  function sunDirVec(alt, az, northDeg) {
    const th = az + ((northDeg || 0) * Math.PI / 180);
    const ca = Math.cos(alt);
    return { x: Math.sin(th) * ca, y: Math.sin(alt), z: -Math.cos(th) * ca };
  }

  function rayHitsObb3D(ox, oy, oz, dx, dy, dz, target) {
    const du = ox - target.obb.cx;
    const dv = oz - target.obb.cz;
    const ux = target.obb.ux;
    const uz = target.obb.uz;
    const lx = du * ux[0] + dv * ux[1];
    const lz = du * uz[0] + dv * uz[1];
    const rx = dx * ux[0] + dz * ux[1];
    const rz = dx * uz[0] + dz * uz[1];

    let tMin = 0.2;
    let tMax = Infinity;
    const slabs = [
      [oy, dy, target.y0, target.top],
      [lx, rx, -target.obb.hw, target.obb.hw],
      [lz, rz, -target.obb.hd, target.obb.hd]
    ];
    for (const [o, d, lo, hi] of slabs) {
      if (Math.abs(d) < 1e-8) {
        if (o < lo || o > hi) return false;
      } else {
        const a = (lo - o) / d;
        const b = (hi - o) / d;
        tMin = Math.max(tMin, Math.min(a, b));
        tMax = Math.min(tMax, Math.max(a, b));
        if (tMax < tMin) return false;
      }
    }
    return tMax >= tMin;
  }

  function computeSolarAnalysis({ blocks, site, fh }) {
    const list = Array.isArray(blocks) ? blocks : [];
    const st = site || {};
    const lat = Number.isFinite(Number(st.lat)) ? Number(st.lat) : 33.31;
    const lon = Number.isFinite(Number(st.lon)) ? Number(st.lon) : 44.36;
    const tz = Number.isFinite(Number(st.tz)) ? Number(st.tz) : 3;
    const north = Number(st.north) || 0;

    const active = [];
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!isAnalyzable(b)) continue;
      const obb = getObb(b);
      const h = getBlockHeight(b, fh);
      const y0 = Number(b.y0) || 0;
      active.push({ idx: i, b, obb, h, y0, top: y0 + h });
    }

    const dates = [
      { id: 'summer', month: 6, day: 21 },
      { id: 'equinox', month: 3, day: 21 },
      { id: 'winter', month: 12, day: 21 }
    ];
    const samplesByDate = { summer: [], equinox: [], winter: [] };
    let peakSunAltDeg = 0;
    let winterSunAltDeg = 0;

    dates.forEach(dt => {
      for (let hr = 7; hr <= 17; hr += 1) {
        const p = sunPosition(lat, lon, tz, dt.month, dt.day, hr);
        if (p.alt > 0.08) {
          const deg = p.alt * 180 / Math.PI;
          if (dt.id === 'summer' && deg > peakSunAltDeg) peakSunAltDeg = deg;
          if (dt.id === 'winter' && deg > winterSunAltDeg) winterSunAltDeg = deg;
          samplesByDate[dt.id].push({ hr, alt: p.alt, az: p.az, dir: sunDirVec(p.alt, p.az, north) });
        }
      }
    });

    const items = [];
    const byIndex = {};

    for (const item of active) {
      const { obb, h, y0, idx, b } = item;
      const faces = [
        { key: 'E', n: [obb.ux[0], 0, obb.ux[1]], p: [obb.cx + obb.ux[0] * (obb.hw + 0.15), y0 + h * 0.5, obb.cz + obb.ux[1] * (obb.hw + 0.15)], area: obb.d * h },
        { key: 'W', n: [-obb.ux[0], 0, -obb.ux[1]], p: [obb.cx - obb.ux[0] * (obb.hw + 0.15), y0 + h * 0.5, obb.cz - obb.ux[1] * (obb.hw + 0.15)], area: obb.d * h },
        { key: 'S', n: [obb.uz[0], 0, obb.uz[1]], p: [obb.cx + obb.uz[0] * (obb.hd + 0.15), y0 + h * 0.5, obb.cz + obb.uz[1] * (obb.hd + 0.15)], area: obb.w * h },
        { key: 'N', n: [-obb.uz[0], 0, -obb.uz[1]], p: [obb.cx - obb.uz[0] * (obb.hd + 0.15), y0 + h * 0.5, obb.cz - obb.uz[1] * (obb.hd + 0.15)], area: obb.w * h },
        { key: 'Roof', n: [0, 1, 0], p: [obb.cx, y0 + h + 0.15, obb.cz], area: obb.w * obb.d }
      ];

      let totalPossible = 0;
      let totalDirect = 0;
      let summerUnshaded = 0;
      let summerMax = 0;
      let winterUnshaded = 0;
      let winterMax = 0;
      let roofWestLoad = 0;
      const faceLoads = { N: 0, E: 0, S: 0, W: 0, Roof: 0 };

      for (const dtId of ['summer', 'equinox', 'winter']) {
        const listSmp = samplesByDate[dtId];
        for (const smp of listSmp) {
          const d = smp.dir;
          for (const fc of faces) {
            const cosInc = fc.n[0] * d.x + fc.n[1] * d.y + fc.n[2] * d.z;
            if (cosInc <= 0.02) continue;
            const weight = cosInc * (fc.key === 'Roof' ? Math.min(fc.area, 900) * 0.55 : fc.area);
            totalPossible += weight;
            if (dtId === 'summer') summerMax += weight;
            if (dtId === 'winter') winterMax += weight;

            let blocked = false;
            for (const other of active) {
              if (other.idx === idx) continue;
              if (other.top <= fc.p[1] && d.y > 0) continue;
              if (rayHitsObb3D(fc.p[0], fc.p[1], fc.p[2], d.x, d.y, d.z, other)) {
                blocked = true;
                break;
              }
            }
            if (!blocked) {
              totalDirect += weight;
              faceLoads[fc.key] += weight;
              if (dtId === 'summer') {
                summerUnshaded += weight;
                if (fc.key === 'W' || fc.key === 'Roof') roofWestLoad += weight;
              }
              if (dtId === 'winter') winterUnshaded += weight;
            }
          }
        }
      }

      const solarScore = totalPossible > 0 ? Math.round((totalDirect / totalPossible) * 100) : 0;
      const summerLoad = summerMax > 0 ? Math.round((summerUnshaded / summerMax) * 100) : 0;
      const winterGain = winterMax > 0 ? Math.round((winterUnshaded / winterMax) * 100) : 0;
      const shadedByNeighborsPct = Math.max(0, 100 - solarScore);

      // Find world-cardinal dominant exposed vertical facade
      let domFace = 'S';
      let domVal = -1;
      for (const k of ['S', 'W', 'E', 'N']) {
        if (faceLoads[k] > domVal) { domVal = faceLoads[k]; domFace = k; }
      }
      const riskLevel = summerLoad >= 68 ? 'high' : (summerLoad >= 45 ? 'moderate' : 'sheltered');

      const res = {
        idx,
        name: b.name || ('Block ' + (idx + 1)),
        fn: b.fn || '',
        solarScore,
        summerLoad,
        winterGain,
        shadedByNeighborsPct,
        dominantFace: domFace,
        riskLevel
      };
      items.push(res);
      byIndex[idx] = res;
    }

    const n = items.length;
    const avgSolarScore = n ? Math.round(items.reduce((s, x) => s + x.solarScore, 0) / n) : 0;
    const avgSummerLoad = n ? Math.round(items.reduce((s, x) => s + x.summerLoad, 0) / n) : 0;
    const avgWinterGain = n ? Math.round(items.reduce((s, x) => s + x.winterGain, 0) / n) : 0;

    // Seasonal sun ray descriptors for 3D arc visualization
    const arcSamples = ['summer', 'equinox', 'winter'].map(dtId => {
      const pts = samplesByDate[dtId].map(s => s.dir);
      const noon = samplesByDate[dtId].find(s => Math.abs(s.hr - 12) < 0.6) || samplesByDate[dtId][Math.floor(samplesByDate[dtId].length / 2)] || null;
      return { id: dtId, dirs: pts, noonDir: noon ? noon.dir : null };
    });

    return {
      items,
      byIndex,
      summary: {
        count: n,
        avgSolarScore,
        avgSummerLoad,
        avgWinterGain,
        peakSunAltDeg: +peakSunAltDeg.toFixed(1),
        winterSunAltDeg: +winterSunAltDeg.toFixed(1),
        northDeg: north
      },
      arcSamples
    };
  }

  // ---------- 2. Wind & Natural Ventilation Analysis ----------
  function computeWindAnalysis({ blocks, site, fh }) {
    const list = Array.isArray(blocks) ? blocks : [];
    const st = site || {};
    const sw = Math.max(10, Number(st.w) || 100);
    const sd = Math.max(10, Number(st.d) || 100);
    const wd = Number.isFinite(Number(st.wind)) ? Number(st.wind) : 315;
    const north = Number(st.north) || 0;
    const fromRad = ((wd + north) * Math.PI) / 180;
    // Matches buildWind() in app.js: flow travels from wind origin toward opposite quadrant
    const flowDir = { x: -Math.sin(fromRad), z: Math.cos(fromRad) };
    const perpDir = { x: flowDir.z, z: -flowDir.x };

    const active = [];
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!isAnalyzable(b)) continue;
      const obb = getObb(b);
      const h = getBlockHeight(b, fh);
      // Project corners onto flowDir (s) and perpDir (t)
      let sMin = Infinity, sMax = -Infinity, tMin = Infinity, tMax = -Infinity;
      for (const p of obb.corners) {
        const s = p[0] * flowDir.x + p[1] * flowDir.z;
        const t = p[0] * perpDir.x + p[1] * perpDir.z;
        if (s < sMin) sMin = s;
        if (s > sMax) sMax = s;
        if (t < tMin) tMin = t;
        if (t > tMax) tMax = t;
      }
      active.push({
        idx: i,
        b,
        obb,
        h,
        sMid: (sMin + sMax) / 2,
        sMin,
        sMax,
        tMin,
        tMax,
        tMid: (tMin + tMax) / 2,
        crossSpan: tMax - tMin
      });
    }

    // Detect Venturi / wind channeling corridors between adjacent blocks
    const corridors = [];
    const channelIdxSet = new Set();
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const A = active[i];
        const B = active[j];
        const streamOverlap = Math.min(A.sMax, B.sMax) - Math.max(A.sMin, B.sMin);
        if (streamOverlap < 2) continue;
        const lateralGap = Math.max(A.tMin, B.tMin) - Math.min(A.tMax, B.tMax);
        if (lateralGap >= 2 && lateralGap <= 15) {
          const boost = +(1 + Math.min(0.55, 5.5 / lateralGap)).toFixed(2);
          const midS = (Math.max(A.sMin, B.sMin) + Math.min(A.sMax, B.sMax)) / 2;
          const midT = (A.tMax < B.tMin) ? (A.tMax + B.tMin) / 2 : (B.tMax + A.tMin) / 2;
          corridors.push({
            aIdx: A.idx,
            bIdx: B.idx,
            aName: A.b.name || ('Block ' + (A.idx + 1)),
            bName: B.b.name || ('Block ' + (B.idx + 1)),
            gap: +lateralGap.toFixed(1),
            speedFactor: boost,
            cx: +(midS * flowDir.x + midT * perpDir.x).toFixed(2),
            cz: +(midS * flowDir.z + midT * perpDir.z).toFixed(2)
          });
          channelIdxSet.add(A.idx);
          channelIdxSet.add(B.idx);
        }
      }
    }

    const items = [];
    const byIndex = {};
    const wakeZones = [];

    for (const blk of active) {
      let maxShelter = 0;
      for (const up of active) {
        if (up.idx === blk.idx) continue;
        if (up.sMax >= blk.sMax) continue; // not upstream
        const downstreamGap = blk.sMin - up.sMax;
        const wakeLen = Math.max(12, up.h * 3.2);
        if (downstreamGap < -2 || downstreamGap > wakeLen) continue;
        const latOverlap = Math.min(blk.tMax, up.tMax) - Math.max(blk.tMin, up.tMin);
        if (latOverlap <= 0) continue;
        const coverFrac = Math.min(1, latOverlap / Math.max(1, blk.crossSpan));
        const distDecay = Math.max(0, 1 - Math.max(0, downstreamGap) / wakeLen);
        const heightRatio = Math.min(1.1, up.h / Math.max(2, blk.h));
        const sf = Math.min(1, coverFrac * distDecay * heightRatio);
        if (sf > maxShelter) maxShelter = sf;
      }

      const isChannel = channelIdxSet.has(blk.idx) && maxShelter < 0.65;
      const status = maxShelter >= 0.45 ? 'sheltered' : (isChannel ? 'channel' : 'windward');
      const exposurePct = Math.round((1 - maxShelter) * 100);
      const res = {
        idx: blk.idx,
        name: blk.b.name || ('Block ' + (blk.idx + 1)),
        status,
        exposurePct,
        shelterPct: Math.round(maxShelter * 100)
      };
      items.push(res);
      byIndex[blk.idx] = res;

      // Aerodynamic leeward wake rectangle behind each significant mass
      const wakeLength = Math.min(36, Math.max(8, blk.h * 2.1));
      wakeZones.push({
        cx: blk.obb.cx + flowDir.x * (blk.sMax - blk.sMid + wakeLength * 0.5),
        cz: blk.obb.cz + flowDir.z * (blk.sMax - blk.sMid + wakeLength * 0.5),
        width: blk.crossSpan * 0.9,
        length: wakeLength,
        angleRad: Math.atan2(flowDir.x, flowDir.z)
      });
    }

    // Generate 7 deflected 3D wind streamlines across the site
    const span = Math.max(sw, sd) * 0.92;
    const streamlines = [];
    for (let k = -3; k <= 3; k++) {
      const baseT = (k / 3) * (span * 0.42);
      const pts = [];
      const steps = 16;
      for (let sIdx = 0; sIdx <= steps; sIdx++) {
        const sVal = -span * 0.52 + (span * 1.04) * (sIdx / steps);
        let tShift = 0;
        let yLift = 0;
        for (const blk of active) {
          const ds = sVal - blk.sMid;
          const dt = baseT - blk.tMid;
          const halfS = (blk.sMax - blk.sMin) / 2 + 5;
          const halfT = blk.crossSpan / 2 + 4;
          if (Math.abs(ds) < halfS && Math.abs(dt) < halfT) {
            const proxS = 1 - Math.abs(ds) / halfS;
            const signT = dt >= 0 ? 1 : -1;
            const proxT = 1 - Math.abs(dt) / halfT;
            tShift += signT * proxS * proxT * 4.5;
            yLift = Math.max(yLift, proxS * Math.min(6, blk.h * 0.35));
          }
        }
        const tVal = baseT + tShift;
        pts.push([
          +(sVal * flowDir.x + tVal * perpDir.x).toFixed(2),
          +(2.2 + yLift).toFixed(2),
          +(sVal * flowDir.z + tVal * perpDir.z).toFixed(2)
        ]);
      }
      streamlines.push(pts);
    }

    const windwardCount = items.filter(x => x.status === 'windward').length;
    const shelteredCount = items.filter(x => x.status === 'sheltered').length;
    const channelCount = items.filter(x => x.status === 'channel').length;
    const ventilationScore = items.length
      ? Math.round(items.reduce((s, x) => s + Math.min(100, x.exposurePct + (x.status === 'channel' ? 15 : 0)), 0) / items.length)
      : 0;

    return {
      windDeg: wd,
      flowDir,
      items,
      byIndex,
      corridors,
      wakeZones,
      streamlines,
      summary: {
        count: items.length,
        windwardCount,
        shelteredCount,
        channelCount,
        corridorCount: corridors.length,
        ventilationScore
      }
    };
  }

  // ---------- 3. Noise & Acoustic Zoning Analysis ----------
  function computeNoiseAnalysis({ blocks, site, fh }) {
    const list = Array.isArray(blocks) ? blocks : [];
    const st = site || {};
    const W = Math.max(10, Number(st.w) || 100);
    const D = Math.max(10, Number(st.d) || 100);
    const roadW = Math.max(6, Math.min(45, Number(st.roadW) || 12));
    const streets = st.streets || { n: false, s: true, e: false, w: false };

    const sources = [];
    const streetBaseDb = +(62 + Math.min(16, (roadW - 6) * 0.48)).toFixed(1);
    if (streets.n) sources.push({ side: 'n', baseDb: streetBaseDb, lineCoord: -D / 2 - 4 });
    if (streets.s) sources.push({ side: 's', baseDb: streetBaseDb, lineCoord: D / 2 + 4 });
    if (streets.e) sources.push({ side: 'e', baseDb: streetBaseDb, lineCoord: W / 2 + 4 });
    if (streets.w) sources.push({ side: 'w', baseDb: streetBaseDb, lineCoord: -W / 2 - 4 });

    const barriers = [];
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!isAnalyzable(b)) continue;
      const h = getBlockHeight(b, fh);
      if (h < 2.5) continue;
      const obb = getObb(b);
      barriers.push({ idx: i, b, obb, h });
    }

    function evalPointDb(px, pz, selfIdx) {
      let energy = Math.pow(10, 44 / 10); // quiet ambient floor 44 dBA
      for (const src of sources) {
        let sx = px, sz = pz;
        if (src.side === 'n' || src.side === 's') sz = src.lineCoord;
        else sx = src.lineCoord;
        const dist = Math.max(4, Math.hypot(px - sx, pz - sz));
        // Line source spreading & urban air/ground attenuation (~13 dB per distance decade)
        let db = src.baseDb - 13 * Math.log10(dist / 6);

        // Acoustic barrier attenuation from buildings crossing segment (sx,sz) -> (px,pz)
        let barrierLoss = 0;
        for (const bar of barriers) {
          if (bar.idx === selfIdx) continue;
          if (segIntersectsAabb2D(sx, sz, px, pz, bar.obb.minX, bar.obb.maxX, bar.obb.minZ, bar.obb.maxZ)) {
            const loss = 6 + Math.min(8, bar.h * 0.42);
            if (loss > barrierLoss) barrierLoss = loss;
          }
        }
        db -= barrierLoss;
        energy += Math.pow(10, Math.max(35, db) / 10);
      }
      return Math.max(42, Math.min(82, 10 * Math.log10(energy)));
    }

    // 2D site acoustic grid for 3D ground contour plane
    const cols = 38;
    const rows = 38;
    const dbGrid = new Float32Array(cols * rows);
    let minDb = 999, maxDb = 0, sumDb = 0, quietCells = 0;
    for (let iz = 0; iz < rows; iz++) {
      const pz = -D / 2 + ((iz + 0.5) / rows) * D;
      for (let ix = 0; ix < cols; ix++) {
        const px = -W / 2 + ((ix + 0.5) / cols) * W;
        const db = evalPointDb(px, pz, -1);
        dbGrid[iz * cols + ix] = db;
        if (db < minDb) minDb = db;
        if (db > maxDb) maxDb = db;
        sumDb += db;
        if (db <= 55) quietCells++;
      }
    }

    // Per-block acoustic rating (sample 4 perimeter face centers + center)
    const items = [];
    const byIndex = {};
    const conflicts = [];

    for (const blk of barriers) {
      const o = blk.obb;
      const samples = [
        [o.cx, o.cz],
        [o.cx + o.ux[0] * (o.hw + 0.3), o.cz + o.ux[1] * (o.hw + 0.3)],
        [o.cx - o.ux[0] * (o.hw + 0.3), o.cz - o.ux[1] * (o.hw + 0.3)],
        [o.cx + o.uz[0] * (o.hd + 0.3), o.cz + o.uz[1] * (o.hd + 0.3)],
        [o.cx - o.uz[0] * (o.hd + 0.3), o.cz - o.uz[1] * (o.hd + 0.3)]
      ];
      let peakDb = 0;
      let totalDb = 0;
      for (const [qx, qz] of samples) {
        const val = evalPointDb(qx, qz, blk.idx);
        if (val > peakDb) peakDb = val;
        totalDb += val;
      }
      const avgBlockDb = totalDb / samples.length;
      const zone = peakDb >= 64 ? 'noisy' : (peakDb >= 56 ? 'moderate' : 'quiet');
      const fn = blk.b.fn || '';
      const sensitiveConflict = peakDb >= 64 && (fn === 'spec' || fn === 'main');
      if (sensitiveConflict) {
        conflicts.push({
          idx: blk.idx,
          name: blk.b.name || ('Block ' + (blk.idx + 1)),
          fn,
          peakDb: +peakDb.toFixed(1)
        });
      }
      const res = {
        idx: blk.idx,
        name: blk.b.name || ('Block ' + (blk.idx + 1)),
        fn,
        peakDb: +peakDb.toFixed(1),
        avgDb: +avgBlockDb.toFixed(1),
        zone,
        sensitiveConflict
      };
      items.push(res);
      byIndex[blk.idx] = res;
    }

    return {
      siteW: W,
      siteD: D,
      cols,
      rows,
      dbGrid,
      sources,
      items,
      byIndex,
      conflicts,
      summary: {
        streetCount: sources.length,
        streetBaseDb: sources.length ? streetBaseDb : 44,
        minDb: +(Number.isFinite(minDb) && minDb < 999 ? minDb : 44).toFixed(1),
        maxDb: +(maxDb || 44).toFixed(1),
        avgDb: +((cols * rows) ? sumDb / (cols * rows) : 44).toFixed(1),
        quietAreaPct: Math.round((quietCells / (cols * rows)) * 100),
        noisyCount: items.filter(x => x.zone === 'noisy').length,
        quietCount: items.filter(x => x.zone === 'quiet').length,
        conflictCount: conflicts.length
      }
    };
  }

  // ---------- 4. Zoning & Bubble Diagram Analysis ----------
  const PRIVACY_ORDER = {
    pub: 1,
    circ: 2,
    '': 2,
    main: 3,
    spec: 4,
    adm: 5
  };

  function computeZoningAndBubbles({ blocks, fh }) {
    const list = Array.isArray(blocks) ? blocks : [];
    const floorH = Math.max(1, Number(fh) || 4);

    // Include architectural blocks AND outdoor hubs (courtyard green / entrance paving / court)
    const nodes = [];
    const zoneBuckets = {};

    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!b || b.hidden || PROP_SHAPES.includes(b.shape) || b.mat === 'context' || b.mat === 'asphalt' || b.shape === 'riwaq') continue;
      const isOutdoor = FLAT_MATS.includes(b.mat);
      const obb = getObb(b);
      const area = obb.w * obb.d * (isOutdoor ? 1 : Math.max(1, Number(b.f) || 1));
      const fn = isOutdoor ? 'outdoor' : (b.fn || '');
      const h = isOutdoor ? 0.3 : getBlockHeight(b, floorH);
      const y0 = Number(b.y0) || 0;
      const node = {
        idx: i,
        name: b.name || ('Block ' + (i + 1)),
        fn,
        isOutdoor,
        x: obb.cx,
        z: obb.cz,
        yMid: y0 + h * 0.5,
        y0,
        top: y0 + h,
        area: Math.round(area),
        obb,
        privacy: isOutdoor ? 1 : (PRIVACY_ORDER[fn] || 2)
      };
      nodes.push(node);

      if (!zoneBuckets[fn]) {
        zoneBuckets[fn] = { fn, area: 0, count: 0, sx: 0, sz: 0, sy: 0, indices: [] };
      }
      zoneBuckets[fn].area += area;
      zoneBuckets[fn].count += 1;
      zoneBuckets[fn].sx += obb.cx * area;
      zoneBuckets[fn].sz += obb.cz * area;
      zoneBuckets[fn].sy += (y0 + h * 0.5) * area;
      zoneBuckets[fn].indices.push(i);
    }

    // Spatial adjacency links between nodes
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i];
        const B = nodes[j];
        const rel = obbOverlapOrDist2D(A.obb, B.obb);
        const dist2D = rel.overlap > 0 ? 0 : rel.distance;
        const vGap = Math.max(0, Math.max(A.y0 - B.top, B.y0 - A.top));
        const hasCirc = A.fn === 'circ' || B.fn === 'circ';
        const effectiveDist = dist2D + vGap;
        if (effectiveDist <= 3.5 || (hasCirc && effectiveDist <= 10)) {
          links.push({ a: A.idx, b: B.idx, strength: 'strong', dist: +effectiveDist.toFixed(1) });
        } else if (effectiveDist <= 16) {
          links.push({ a: A.idx, b: B.idx, strength: 'medium', dist: +effectiveDist.toFixed(1) });
        }
      }
    }

    // Zone-level links aggregated from block links
    const zoneLinkMap = new Map();
    const nodeByIdx = {};
    nodes.forEach(n => { nodeByIdx[n.idx] = n; });
    links.forEach(l => {
      const aFn = nodeByIdx[l.a].fn;
      const bFn = nodeByIdx[l.b].fn;
      if (aFn === bFn) return;
      const pair = aFn < bFn ? [aFn, bFn] : [bFn, aFn];
      const key = pair[0] + '|' + pair[1];
      const cur = zoneLinkMap.get(key);
      if (!cur || (l.strength === 'strong' && cur.strength !== 'strong')) {
        zoneLinkMap.set(key, { fnA: pair[0], fnB: pair[1], strength: l.strength, count: (cur ? cur.count : 0) + 1 });
      } else {
        cur.count += 1;
      }
    });

    // Layout 2D SVG bubble positions (preserving plan orientation + non-overlap relaxation)
    function layoutBubbles(rawBubbles, viewW, viewH) {
      if (!rawBubbles.length) return [];
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      rawBubbles.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.z < minZ) minZ = n.z;
        if (n.z > maxZ) maxZ = n.z;
      });
      const spanX = Math.max(20, maxX - minX);
      const spanZ = Math.max(20, maxZ - minZ);
      const pad = 34;
      const maxArea = Math.max(1, ...rawBubbles.map(n => n.area));

      const placed = rawBubbles.map((n, k) => {
        const r = Math.max(12, Math.min(27, 11 + Math.sqrt(n.area / maxArea) * 16));
        const nx = rawBubbles.length === 1 ? viewW / 2 : pad + ((n.x - minX) / spanX) * (viewW - pad * 2);
        const nz = rawBubbles.length === 1 ? viewH / 2 : pad + ((n.z - minZ) / spanZ) * (viewH - pad * 2);
        return Object.assign({}, n, { bx: nx + (k % 2 ? 0.5 : -0.5), by: nz, br: r });
      });

      // Deterministic circle repulsion keeping inside viewport bounds
      for (let iter = 0; iter < 36; iter++) {
        for (let i = 0; i < placed.length; i++) {
          for (let j = i + 1; j < placed.length; j++) {
            const a = placed[i];
            const b = placed[j];
            const dx = b.bx - a.bx;
            const dy = b.by - a.by;
            const d = Math.hypot(dx, dy) || 0.01;
            const minD = a.br + b.br + 10;
            if (d < minD) {
              const push = (minD - d) * 0.45;
              const ux = dx / d;
              const uy = dy / d;
              a.bx -= ux * push;
              a.by -= uy * push;
              b.bx += ux * push;
              b.by += uy * push;
            }
          }
        }
        placed.forEach(p => {
          p.bx = Math.max(p.br + 12, Math.min(viewW - p.br - 12, p.bx));
          p.by = Math.max(p.br + 14, Math.min(viewH - p.br - 14, p.by));
        });
      }
      return placed;
    }

    const totalArchArea = nodes.filter(n => !n.isOutdoor).reduce((s, n) => s + n.area, 0);
    const zones = Object.values(zoneBuckets).map(zb => ({
      fn: zb.fn,
      isOutdoor: zb.fn === 'outdoor',
      area: Math.round(zb.area),
      sharePct: zb.fn === 'outdoor' ? 0 : (totalArchArea > 0 ? Math.round((zb.area / totalArchArea) * 100) : 0),
      count: zb.count,
      x: zb.area > 0 ? zb.sx / zb.area : 0,
      z: zb.area > 0 ? zb.sz / zb.area : 0,
      yMid: zb.area > 0 ? zb.sy / zb.area : 2,
      indices: zb.indices,
      privacy: zb.fn === 'outdoor' ? 1 : (PRIVACY_ORDER[zb.fn] || 2)
    })).sort((a, b) => a.privacy - b.privacy || b.area - a.area);

    const bubblesByMass = layoutBubbles(nodes, 264, 194);
    const bubblesByZone = layoutBubbles(zones, 264, 194);

    return {
      nodes,
      zones,
      links,
      zoneLinks: [...zoneLinkMap.values()],
      bubblesByMass,
      bubblesByZone,
      totalArchArea: Math.round(totalArchArea),
      strongLinkCount: links.filter(l => l.strength === 'strong').length,
      mediumLinkCount: links.filter(l => l.strength === 'medium').length
    };
  }

  // ---------- 5. Massing Evolution / Morphology ("How it became this form") ----------
  function computeMorphologyEvolution({ blocks, site, fh }) {
    const list = Array.isArray(blocks) ? blocks : [];
    const st = site || {};
    const sw = Math.max(10, Number(st.w) || 100);
    const sd = Math.max(10, Number(st.d) || 100);
    const floorH = Math.max(1, Number(fh) || 4);

    const arch = [];
    const voids = [];
    const joints = [];
    const context = [];

    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!b || b.hidden || PROP_SHAPES.includes(b.shape)) continue;
      if (b.mat === 'context') { context.push(i); continue; }
      if (b.mat === 'green' || b.mat === 'water' || b.mat === 'paving') {
        voids.push({ idx: i, b });
        continue;
      }
      if (b.shape === 'riwaq' || b.fn === 'circ' || b.mat === 'joint') {
        joints.push({ idx: i, b });
      }
      if (isAnalyzable(b)) {
        const obb = getObb(b);
        const h = getBlockHeight(b, floorH);
        const y0 = Number(b.y0) || 0;
        const f = Math.max(1, Number(b.f) || 1);
        arch.push({ idx: i, b, obb, h, y0, f, fp: obb.w * obb.d, vol: obb.w * obb.d * h });
      }
    }

    const groundArch = arch.filter(a => a.y0 < 0.8 && a.b.fn !== 'circ' && a.b.mat !== 'joint');
    const elevatedArch = arch.filter(a => a.y0 >= 0.8);
    const hasCarvedShape = arch.some(a => ['court', 'L', 'U', 'ring', 'gate'].includes(a.b.shape));
    const hasGreenVoid = voids.some(v => v.b.mat === 'green' || v.b.mat === 'water');
    const hasCourtVoid = hasCarvedShape || hasGreenVoid;

    // Detect Parti Archetype from real spatial geometry
    let partiId = 'monolith';
    let partiAr = 'كتلة موحدة مدمجة';
    let partiEn = 'Compact Monolith';
    let partiReasonAr = 'تنظيم الكتلة في حجم رئيسي متماسك يقلل سطح التلامس الحراري ويحافظ على محيط الموقع.';
    let partiReasonEn = 'Consolidated into a cohesive primary mass minimizing thermal envelope exposure.';

    if (arch.length === 0) {
      partiId = 'empty';
      partiAr = 'موقع قيد التشكيل';
      partiEn = 'Unbuilt Parcel';
      partiReasonAr = 'لم تُضف كتل معمارية بعد لتحليل مراحل تكوّنها.';
      partiReasonEn = 'Add architectural masses to analyze the form evolution sequence.';
    } else if (elevatedArch.length > 0 && groundArch.length > 0 && arch.some(a => a.f >= 5)) {
      partiId = 'tower-podium';
      partiAr = 'منصة أفقية + برج عمودي';
      partiEn = 'Tower & Podium';
      partiReasonAr = 'فصل الوظائف العامة في منصة عريضة على الشارع، ثم رفع الكتلة الرئيسية عمودياً لتحرير السطح وتقليل البصمة.';
      partiReasonEn = 'Grounds public functions in a street-level podium while lifting towers vertically for daylight, views, and open roof terraces.';
    } else if (hasCourtVoid && groundArch.length >= 2) {
      partiId = 'courtyard';
      partiAr = 'تكوين فناء وسطي محيطي';
      partiEn = 'Perimeter Courtyard Parti';
      partiReasonAr = 'تفريغ قلب الكتلة لفناء داخلي يحقق التبريد الموضعي والخصوصية ويدخل الإضاءة الطبيعية لجميع الأجنحة.';
      partiReasonEn = 'Carves an internal courtyard void to shelter microclimate, ensure privacy, and bring perimeter daylight deep into surrounding wings.';
    } else if (groundArch.length >= 3) {
      partiId = 'cluster';
      partiAr = 'مجمع أجنحة مترابطة';
      partiEn = 'Articulated Mass Cluster';
      partiReasonAr = 'تفتيت الكتلة الواحدة إلى أجنحة وظيفية متدرجة تربطها مفاصل حركة وفراغات بينية لمرونة التوجيه.';
      partiReasonEn = 'Subdivides bulk into distinct functional wings stitched by circulation knuckles and open interstices.';
    } else if (hasCarvedShape || arch.some(a => a.f !== arch[0].f)) {
      partiId = 'carved';
      partiAr = 'كتلة منحوتة متدرجة';
      partiEn = 'Carved & Stepped Form';
      partiReasonAr = 'تشكيل الكتلة عبر الطرح والتدرج لتوجيه الفتحات نحو المناخ الملائم وتكوين شرفات متدرجة.';
      partiReasonEn = 'Sculpts the primary volume through subtraction and stepping to tune solar access and scale.';
    }

    const allArchIndices = arch.map(a => a.idx);
    const primaryIndices = (groundArch.length ? groundArch : arch)
      .slice()
      .sort((a, b) => b.vol - a.vol)
      .slice(0, Math.max(1, Math.min(2, groundArch.length || arch.length)))
      .map(a => a.idx);
    const wingIndices = groundArch.map(a => a.idx);
    const stackIndices = (elevatedArch.length
      ? elevatedArch
      : arch.filter(a => a.f >= Math.max(...arch.map(x => x.f), 1))
    ).map(a => a.idx);
    const jointIndices = joints.map(j => j.idx);
    const voidIndices = voids.map(v => v.idx);

    const maxF = arch.length ? Math.max(...arch.map(a => a.f)) : 0;
    const minF = arch.length ? Math.min(...arch.map(a => a.f)) : 0;
    const steps = [];

    // Step 1: Regulatory Envelope
    const customSb = st.sbMode === 'custom';
    const sbVal = customSb
      ? Math.round(((Number(st.sbN) || 0) + (Number(st.sbS) || 0) + (Number(st.sbE) || 0) + (Number(st.sbW) || 0)) / 4)
      : (Number(st.sb) || 0);
    steps.push({
      id: 'envelope',
      stepNum: 1,
      op: 'envelope',
      titleAr: 'المحيط التنظيمي والارتدادات',
      titleEn: 'Site & Setback Envelope',
      descAr: `تحديد حدود القطعة (${sw}×${sd}م) واستقطاع الارتدادات التنظيمية لاستخراج نطاق البناء المسموح.`,
      descEn: `Defines the ${sw}×${sd}m parcel and regulatory setbacks to establish the maximum buildable envelope.`,
      metricBadge: `${sw}×${sd}m · ${sbVal}m`,
      highlightIndices: [],
      showEnvelope: true,
      showCourtyardVoid: false,
      showEnvVectors: false
    });

    if (arch.length > 0) {
      // Step 2: Primary Datum / Base Volume
      steps.push({
        id: 'datum',
        stepNum: steps.length + 1,
        op: 'extrude',
        titleAr: elevatedArch.length ? 'تأسيس المنصة والحجم الرئيسي' : 'بثق الحجم الأساسي الأولي',
        titleEn: elevatedArch.length ? 'Establish Podium & Primary Datum' : 'Extrude Primary Volume',
        descAr: 'إنشاء الكتلة المرجعية الأرضية التي تثبت خط الشارع وتستوعب النواة الرئيسية للمشروع.',
        descEn: 'Extrudes the grounded anchor volume defining street presence and core footprint.',
        metricBadge: `${primaryIndices.length} ${primaryIndices.length > 1 ? 'كتل' : 'كتلة'}`,
        highlightIndices: primaryIndices,
        showEnvelope: true,
        showCourtyardVoid: false,
        showEnvVectors: false
      });

      // Step 3: Courtyard / Void Subtraction
      if (hasCourtVoid || voidIndices.length > 0) {
        steps.push({
          id: 'carve',
          stepNum: steps.length + 1,
          op: 'carve',
          titleAr: 'التفريغ والنحت لفناء وساحة',
          titleEn: 'Carve Courtyard & Outdoor Voids',
          descAr: 'تفريغ القلب الوسطي أو فتح بوابات بصرية لإدخال الضوء الطبيعي وتكوين مناخ داخلي محمي.',
          descEn: 'Subtracts central/plaza voids to bring daylight deep inside and establish a sheltered microclimate.',
          metricBadge: `${voidIndices.length || 1} فراغ`,
          highlightIndices: [...primaryIndices, ...voidIndices],
          showEnvelope: false,
          showCourtyardVoid: true,
          showEnvVectors: false
        });
      }

      // Step 4: Wing Splitting & Functional Articulation
      if (wingIndices.length >= 2) {
        steps.push({
          id: 'split',
          stepNum: steps.length + 1,
          op: 'split',
          titleAr: 'تجزئة الكتلة إلى أجنحة وظيفية',
          titleEn: 'Subdivide into Functional Wings',
          descAr: `فصل التكوين إلى ${wingIndices.length} أجنحة واضحة (عام، رئيسي، تخصصي، خدمات) لتقليل الضخامة وزيادة الواجهات.`,
          descEn: `Articulates bulk into ${wingIndices.length} legible programmatic wings, increasing facade perimeter and spatial clarity.`,
          metricBadge: `${wingIndices.length} أجنحة`,
          highlightIndices: [...wingIndices, ...voidIndices],
          showEnvelope: false,
          showCourtyardVoid: true,
          showEnvVectors: false
        });
      }

      // Step 5: Vertical Stacking / Skyline Stepping
      if (elevatedArch.length > 0 || (maxF - minF >= 2)) {
        steps.push({
          id: 'stack',
          stepNum: steps.length + 1,
          op: 'stack',
          titleAr: elevatedArch.length ? 'الرفع العمودي وإزاحة الطوابق' : 'التدرج الارتفاعي وخط السماء',
          titleEn: elevatedArch.length ? 'Vertical Stacking & Tower Shift' : 'Height Stepping & Skyline',
          descAr: elevatedArch.length
            ? `رفع ${elevatedArch.length} كتلة فوق المنصة لخلق تدرج كتلي وتراسات علوية.`
            : `تنويع الارتفاعات من ${minF} إلى ${maxF} طوابق لتمييز الأهمية الوظيفية وتدرج خط السماء.`,
          descEn: elevatedArch.length
            ? `Elevates ${elevatedArch.length} upper mass(es) onto podium roofs for hierarchy and terraces.`
            : `Steps massing between ${minF} and ${maxF} floors to express hierarchy and sculpt the skyline.`,
          metricBadge: `${maxF} طوابق`,
          highlightIndices: [...wingIndices, ...stackIndices],
          showEnvelope: false,
          showCourtyardVoid: false,
          showEnvVectors: false
        });
      }

      // Step 6: Circulation Joints & Connectors
      if (jointIndices.length > 0) {
        steps.push({
          id: 'joints',
          stepNum: steps.length + 1,
          op: 'join',
          titleAr: 'ربط الأجنحة بمفاصل الحركة والأروقة',
          titleEn: 'Connect via Circulation Joints & Arcades',
          descAr: `إضافة ${jointIndices.length} عنصر حركة وربط (مفاصل/جسور/رواق) لتوحيد المسارات بين الكتل.`,
          descEn: `Inserts ${jointIndices.length} vertical cores, bridges, or arcades stitching wings into one circulation loop.`,
          metricBadge: `${jointIndices.length} وصلات`,
          highlightIndices: [...allArchIndices, ...jointIndices, ...voidIndices],
          showEnvelope: false,
          showCourtyardVoid: false,
          showEnvVectors: false
        });
      }

      // Step 7: Environmental & Acoustic Tuning (Final Synthesized Form)
      steps.push({
        id: 'climate',
        stepNum: steps.length + 1,
        op: 'climate',
        titleAr: 'التوجيه النهائي للشمس والرياح والضوضاء',
        titleEn: 'Environmental & Acoustic Synthesis',
        descAr: 'الشكل النهائي الناتج بعد موازنة التظليل الذاتي مع اتجاه الرياح السائدة وعزل الفراغات الهادئة عن الشارع.',
        descEn: 'Final massing tuned for self-shading, prevailing wind capture, and acoustic street buffering.',
        metricBadge: `${allArchIndices.length} كتل`,
        highlightIndices: [...allArchIndices, ...jointIndices, ...voidIndices],
        showEnvelope: true,
        showCourtyardVoid: false,
        showEnvVectors: true
      });
    }

    return {
      partiId,
      partiAr,
      partiEn,
      partiReasonAr,
      partiReasonEn,
      steps,
      archCount: arch.length,
      voidCount: voidIndices.length,
      jointCount: jointIndices.length,
      elevatedCount: elevatedArch.length
    };
  }

  // ---------- 6. Circulation diagram: visitors, students & staff, services ----------
  // Schematic routes for a presentation diagram (not a corridor plan):
  // visitors: main street -> main entrance -> public blocks
  // students & staff: parking (or street) -> main entrance -> hub (courtyard / cores) -> teaching & training blocks
  // services: back edge of the site -> admin / service blocks
  function nearestEdgePoint(o, x, z, out) {
    const dx = x - o.cx, dz = z - o.cz;
    let lx = dx * o.ux[0] + dz * o.ux[1], lz = dx * o.uz[0] + dz * o.uz[1];
    const inside = Math.abs(lx) <= o.hw && Math.abs(lz) <= o.hd;
    if (inside) { if (o.hw - Math.abs(lx) < o.hd - Math.abs(lz)) lx = Math.sign(lx || 1) * o.hw; else lz = Math.sign(lz || 1) * o.hd; }
    else { lx = Math.max(-o.hw, Math.min(o.hw, lx)); lz = Math.max(-o.hd, Math.min(o.hd, lz)); }
    // step slightly outside the face so arrows stop in front of the building
    const nlx = Math.abs(lx) >= o.hw - 1e-6 ? Math.sign(lx) : 0, nlz = Math.abs(lz) >= o.hd - 1e-6 ? Math.sign(lz) : 0;
    lx += nlx * (out || 1.5); lz += nlz * (out || 1.5);
    return [+(o.cx + o.ux[0] * lx + o.uz[0] * lz).toFixed(2), +(o.cz + o.ux[1] * lx + o.uz[1] * lz).toFixed(2)];
  }

  // opts.entry / opts.hub / opts.service: [x, z] points chosen by the user override the automatic ones
  function computeCirculation({ blocks, site, opts }) {
    const ov = opts || {};
    const pt = v => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) ? [+v[0], +v[1]] : null;
    const list = Array.isArray(blocks) ? blocks : [];
    const st = site || {};
    const W = Math.max(10, Number(st.w) || 100), D = Math.max(10, Number(st.d) || 100);
    const streets = st.streets || { s: true };
    const edgeMid = side => side === 'n' ? [0, -D / 2] : side === 's' ? [0, D / 2] : side === 'e' ? [W / 2, 0] : [-W / 2, 0];
    const opposite = { n: 's', s: 'n', e: 'w', w: 'e' };
    const mainSide = ['s', 'n', 'e', 'w'].find(k => streets[k]) || 's';
    const serviceSide = ['n', 's', 'e', 'w'].find(k => streets[k] && k !== mainSide) || opposite[mainSide];

    const items = [];
    list.forEach((b, i) => { if (b && !b.hidden && !PROP_SHAPES.includes(b.shape) && b.mat !== 'context') items.push({ i, b, o: getObb(b) }); });
    const arch = items.filter(x => isAnalyzable(x.b));
    if (!arch.length) return { entry: null, hub: null, flows: [] };
    const fnOf = x => x.b.fn || '';

    // main entrance: an entrance-named block, else the public block nearest the main street, else the nearest block
    const street = edgeMid(mainSide);
    const dist = (x, p) => Math.hypot(x.o.cx - p[0], x.o.cz - p[1]);
    const named = arch.filter(x => /مدخل|entrance|entry|lobby|بهو/i.test(x.b.name || ''));
    const pubs = arch.filter(x => fnOf(x) === 'pub');
    const userEntry = pt(ov.entry);
    const entryBlock = userEntry ? arch.slice().sort((a, b) => dist(a, userEntry) - dist(b, userEntry))[0]
      : (named.length ? named : pubs.length ? pubs : arch).slice().sort((a, b) => dist(a, street) - dist(b, street))[0];
    const entry = userEntry || nearestEdgePoint(entryBlock.o, street[0], street[1], 2);
    const streetPt = mainSide === 'n' || mainSide === 's' ? [entry[0], street[1]] : [street[0], entry[1]];

    // hub: the courtyard (green open space) if any, else the circulation cores, else the entrance
    const greens = items.filter(x => x.b.mat === 'green' && !isAnalyzable(x.b));
    const cores = arch.filter(x => fnOf(x) === 'circ' || x.b.mat === 'joint');
    const centroid = arr => { let sx = 0, sz = 0, sa = 0; arr.forEach(x => { const a = Math.max(1, x.o.w * x.o.d); sx += x.o.cx * a; sz += x.o.cz * a; sa += a; }); return [+(sx / sa).toFixed(2), +(sz / sa).toFixed(2)]; };
    const hub = pt(ov.hub) || (greens.length ? centroid([greens.slice().sort((a, b) => b.o.w * b.o.d - a.o.w * a.o.d)[0]]) : cores.length ? centroid(cores) : entry);

    const parks = items.filter(x => x.b.mat === 'asphalt' && x.b.park);
    const studentStart = parks.length ? [parks[0].o.cx, parks[0].o.cz] : streetPt;
    const to = (x, from) => nearestEdgePoint(x.o, from[0], from[1], 1.5);

    const flows = [];
    const visit = pubs.filter(x => x !== entryBlock);
    flows.push({ id: 'visitors', paths: [[streetPt, entry]].concat(visit.map(x => [entry, to(x, entry)])) });
    const teach = arch.filter(x => fnOf(x) === 'main' || fnOf(x) === 'spec' || (!fnOf(x) && x !== entryBlock && !cores.includes(x)));
    const viaHub = hub[0] !== entry[0] || hub[1] !== entry[1];
    flows.push({ id: 'students', paths: [[studentStart, entry]].concat(teach.map(x => viaHub ? [entry, hub, to(x, hub)] : [entry, to(x, entry)])) });
    const svc = arch.filter(x => fnOf(x) === 'adm');
    const back = edgeMid(serviceSide), userSvc = pt(ov.service);
    flows.push({ id: 'service', paths: svc.map(x => { const from = userSvc || back, p = to(x, from); const b0 = userSvc || (serviceSide === 'n' || serviceSide === 's' ? [p[0], back[1]] : [back[0], p[1]]); return [b0, p]; }) });

    return { entry, hub, street: streetPt, mainSide, serviceSide, service: userSvc || null, entryIdx: entryBlock.i, custom: { entry: !!userEntry, hub: !!pt(ov.hub), service: !!userSvc }, flows: flows.filter(f => f.paths.length) };
  }

  return {
    computeCirculation,
    isAnalyzable,
    getObb,
    getBlockHeight,
    computeSolarAnalysis,
    computeWindAnalysis,
    computeNoiseAnalysis,
    computeZoningAndBubbles,
    computeMorphologyEvolution
  };
});
