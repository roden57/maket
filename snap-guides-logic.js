(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_SNAP = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PROP_SHAPES = ['tree', 'person', 'car'];
  const GUIDE_OVERSHOOT_M = 2.5;
  const EXACT_MATCH_EPS = 0.025;

  function getRotOf(b) {
    if (!b) return 0;
    if (b.shape === 'box' || b.shape === 'riwaq') return 0;
    return Number(b.ry) || 0;
  }

  function getLocalDims(b) {
    const w = Math.max(0.5, Number(b && b.w) || 10);
    const d = Math.max(0.5, Number(b && b.d) || 10);
    return Math.abs(getRotOf(b)) % 180 === 0 ? [w, d] : [d, w];
  }

  function getBlockAabbXZ(b) {
    if (!b) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, cx: 0, cz: 0 };
    const cx = Number(b.x) || 0;
    const cz = Number(b.z) || 0;
    const [w, d] = getLocalDims(b);
    const totalDeg = getRotOf(b) + (Number(b.rot) || 0);
    const rad = (-totalDeg * Math.PI) / 180;
    const hw = w / 2;
    const hd = d / 2;
    if (Math.abs(totalDeg % 180) < 1e-6) {
      return { minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd, cx, cz };
    }
    const c = Math.abs(Math.cos(rad));
    const s = Math.abs(Math.sin(rad));
    const ex = hw * c + hd * s;
    const ez = hw * s + hd * c;
    return { minX: cx - ex, maxX: cx + ex, minZ: cz - ez, maxZ: cz + ez, cx, cz };
  }

  function getSelectionAabbXZ(blocks, indices) {
    const list = Array.isArray(blocks) ? blocks : [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    let count = 0;
    for (const i of (indices || [])) {
      const b = list[i];
      if (!b) continue;
      const box = getBlockAabbXZ(b);
      if (box.minX < minX) minX = box.minX;
      if (box.maxX > maxX) maxX = box.maxX;
      if (box.minZ < minZ) minZ = box.minZ;
      if (box.maxZ > maxZ) maxZ = box.maxZ;
      count++;
    }
    if (!count) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, cx: 0, cz: 0 };
    return { minX, maxX, minZ, maxZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 };
  }

  function collectSnapTargets(blocks, exclIndices, site) {
    const excl = exclIndices instanceof Set ? exclIndices : new Set(exclIndices || []);
    const list = Array.isArray(blocks) ? blocks : [];
    const x = [];
    const z = [];

    for (let i = 0; i < list.length; i++) {
      if (excl.has(i)) continue;
      const b = list[i];
      if (!b || b.hidden || PROP_SHAPES.includes(b.shape)) continue;
      const box = getBlockAabbXZ(b);
      const name = b.name || '';
      x.push(
        { val: box.minX, kind: 'edge', source: 'block', name, spanMin: box.minZ, spanMax: box.maxZ },
        { val: box.maxX, kind: 'edge', source: 'block', name, spanMin: box.minZ, spanMax: box.maxZ },
        { val: box.cx, kind: 'center', source: 'block', name, spanMin: box.minZ, spanMax: box.maxZ }
      );
      z.push(
        { val: box.minZ, kind: 'edge', source: 'block', name, spanMin: box.minX, spanMax: box.maxX },
        { val: box.maxZ, kind: 'edge', source: 'block', name, spanMin: box.minX, spanMax: box.maxX },
        { val: box.cz, kind: 'center', source: 'block', name, spanMin: box.minX, spanMax: box.maxX }
      );
    }

    if (site && typeof site === 'object') {
      const sw = Math.max(10, Number(site.w) || 100);
      const sd = Math.max(10, Number(site.d) || 100);
      const hw = sw / 2;
      const hd = sd / 2;
      x.push(
        { val: -hw, kind: 'site', source: 'site', name: 'site-w', spanMin: -hd, spanMax: hd },
        { val: hw, kind: 'site', source: 'site', name: 'site-e', spanMin: -hd, spanMax: hd },
        { val: 0, kind: 'center', source: 'site', name: 'site-cx', spanMin: -hd, spanMax: hd }
      );
      z.push(
        { val: -hd, kind: 'site', source: 'site', name: 'site-n', spanMin: -hw, spanMax: hw },
        { val: hd, kind: 'site', source: 'site', name: 'site-s', spanMin: -hw, spanMax: hw },
        { val: 0, kind: 'center', source: 'site', name: 'site-cz', spanMin: -hw, spanMax: hw }
      );

      const customSb = site.sbMode === 'custom';
      const sbN = Math.max(0, Number(customSb ? site.sbN : site.sb) || 0);
      const sbS = Math.max(0, Number(customSb ? site.sbS : site.sb) || 0);
      const sbE = Math.max(0, Number(customSb ? site.sbE : site.sb) || 0);
      const sbW = Math.max(0, Number(customSb ? site.sbW : site.sb) || 0);
      if (sbW > 0) x.push({ val: -hw + sbW, kind: 'site', source: 'site', name: 'sb-w', spanMin: -hd + sbN, spanMax: hd - sbS });
      if (sbE > 0) x.push({ val: hw - sbE, kind: 'site', source: 'site', name: 'sb-e', spanMin: -hd + sbN, spanMax: hd - sbS });
      if (sbN > 0) z.push({ val: -hd + sbN, kind: 'site', source: 'site', name: 'sb-n', spanMin: -hw + sbW, spanMax: hw - sbE });
      if (sbS > 0) z.push({ val: hd - sbS, kind: 'site', source: 'site', name: 'sb-s', spanMin: -hw + sbW, spanMax: hw - sbE });
    }

    return { x, z };
  }

  function findBestAxisDelta(anchors, candidates, threshold) {
    let bestDx = 0;
    let bestScore = Infinity;
    let matched = false;

    for (const cand of candidates) {
      for (const anc of anchors) {
        const diff = cand.val - anc.val;
        const absDiff = Math.abs(diff);
        if (absDiff >= threshold) continue;
        // Prefer closer distance; slight preference for center-center / edge-edge & block targets on near ties
        const rolePenalty = (cand.kind === 'center' && anc.role === 'center') || (cand.kind !== 'center' && anc.role === 'edge') ? 0 : 0.03;
        const sourcePenalty = cand.source === 'block' ? 0 : 0.04;
        const score = absDiff + rolePenalty + sourcePenalty;
        if (score < bestScore) {
          bestScore = score;
          bestDx = diff;
          matched = true;
        }
      }
    }
    return { delta: matched ? bestDx : 0, matched };
  }

  function collectAxisGuides(axis, anchors, candidates, dragCrossMin, dragCrossMax, guideY) {
    const byKey = new Map();
    for (const anc of anchors) {
      for (const cand of candidates) {
        if (Math.abs(cand.val - anc.val) > EXACT_MATCH_EPS) continue;
        const coord = +cand.val.toFixed(3);
        const guideKind = (anc.role === 'center' && cand.kind === 'center')
          ? 'center'
          : (cand.source === 'site' ? 'site' : 'edge');
        const key = `${axis}|${coord}|${guideKind}`;
        const minS = Math.min(dragCrossMin, cand.spanMin) - GUIDE_OVERSHOOT_M;
        const maxS = Math.max(dragCrossMax, cand.spanMax) + GUIDE_OVERSHOOT_M;
        const existing = byKey.get(key);
        if (existing) {
          existing.spanStart = Math.min(existing.spanStart, minS);
          existing.spanEnd = Math.max(existing.spanEnd, maxS);
          if (cand.source === 'block') existing.source = 'block';
        } else {
          byKey.set(key, {
            axis,
            coord,
            spanStart: +minS.toFixed(3),
            spanEnd: +maxS.toFixed(3),
            kind: guideKind,
            matchRole: anc.role,
            source: cand.source,
            targetName: cand.name || '',
            y: Number.isFinite(guideY) ? guideY : 0.12
          });
        }
      }
    }
    return [...byKey.values()];
  }

  function computeSmartDragSnap({ dragBox, targets, threshold, guideY }) {
    const th = Math.max(0.2, Number(threshold) || 0.8);
    const box = dragBox || { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
    const cx = (box.minX + box.maxX) / 2;
    const cz = (box.minZ + box.maxZ) / 2;
    const tX = (targets && targets.x) || [];
    const tZ = (targets && targets.z) || [];

    const xAnchorsRaw = [
      { role: 'edge', val: box.minX },
      { role: 'edge', val: box.maxX },
      { role: 'center', val: cx }
    ];
    const zAnchorsRaw = [
      { role: 'edge', val: box.minZ },
      { role: 'edge', val: box.maxZ },
      { role: 'center', val: cz }
    ];

    const resX = findBestAxisDelta(xAnchorsRaw, tX, th);
    const resZ = findBestAxisDelta(zAnchorsRaw, tZ, th);

    const snappedBox = {
      minX: box.minX + resX.delta,
      maxX: box.maxX + resX.delta,
      cx: cx + resX.delta,
      minZ: box.minZ + resZ.delta,
      maxZ: box.maxZ + resZ.delta,
      cz: cz + resZ.delta
    };

    const xGuides = collectAxisGuides(
      'x',
      [
        { role: 'edge', val: snappedBox.minX },
        { role: 'edge', val: snappedBox.maxX },
        { role: 'center', val: snappedBox.cx }
      ],
      tX,
      snappedBox.minZ,
      snappedBox.maxZ,
      guideY
    );

    const zGuides = collectAxisGuides(
      'z',
      [
        { role: 'edge', val: snappedBox.minZ },
        { role: 'edge', val: snappedBox.maxZ },
        { role: 'center', val: snappedBox.cz }
      ],
      tZ,
      snappedBox.minX,
      snappedBox.maxX,
      guideY
    );

    return {
      dx: resX.delta,
      dz: resZ.delta,
      matchedX: xGuides.length > 0,
      matchedZ: zGuides.length > 0,
      guides: [...xGuides, ...zGuides]
    };
  }

  function computeSmartResizeSnap({ rawMovingVal, axis, dragCrossMin, dragCrossMax, targets, threshold, guideY }) {
    const th = Math.max(0.2, Number(threshold) || 0.8);
    const list = (targets && targets[axis]) || [];
    const res = findBestAxisDelta([{ role: 'edge', val: rawMovingVal }], list, th);
    if (!res.matched) {
      return { matched: false, snappedVal: rawMovingVal, guides: [] };
    }
    const snappedVal = rawMovingVal + res.delta;
    const guides = collectAxisGuides(
      axis,
      [{ role: 'edge', val: snappedVal }],
      list,
      dragCrossMin,
      dragCrossMax,
      guideY
    );
    return { matched: true, snappedVal, guides };
  }

  return {
    getBlockAabbXZ,
    getSelectionAabbXZ,
    collectSnapTargets,
    computeSmartDragSnap,
    computeSmartResizeSnap
  };
});
