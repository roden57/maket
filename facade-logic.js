(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_FACADE = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RECTISH_SHAPES = ['box', 'court', 'gate', 'gable', 'shed'];
  const FLAT_MATS = ['green', 'paving', 'asphalt', 'water'];

  const FACADE_TYPES = {
    '': { ar: 'بدون', en: 'None', defaultWwr: 0, defaultDepth: 0.3, defaultSpacing: 3.2, baseShade: 0 },
    win: { ar: 'شبابيك (إيقاع)', en: 'Rhythmic Windows', defaultWwr: 42, defaultDepth: 0.18, defaultSpacing: 3.2, baseShade: 14 },
    curtain: { ar: 'ستائر زجاجية', en: 'Curtain Wall', defaultWwr: 74, defaultDepth: 0.25, defaultSpacing: 2.8, baseShade: 10 },
    fins: { ar: 'كاسرات عمودية', en: 'Vertical Louvers', defaultWwr: 52, defaultDepth: 0.65, defaultSpacing: 2.0, baseShade: 42 },
    hfins: { ar: 'كاسرات أفقية', en: 'Horizontal Shading', defaultWwr: 56, defaultDepth: 0.7, defaultSpacing: 3.5, baseShade: 52 },
    grid: { ar: 'إطار شبكي', en: 'Egg-Crate Grid', defaultWwr: 50, defaultDepth: 0.6, defaultSpacing: 3.0, baseShade: 60 },
    mash: { ar: 'مشربية', en: 'Mashrabiya Screen', defaultWwr: 44, defaultDepth: 0.45, defaultSpacing: 3.8, baseShade: 68 },
    balcony: { ar: 'شرفات متكررة', en: 'Recessed Balconies', defaultWwr: 55, defaultDepth: 1.25, defaultSpacing: 4.2, baseShade: 62 }
  };

  const FACADE_TONES = {
    slate: { ar: 'رمادي معدني', en: 'Slate Metal', dark: '#273647', lite: '#e2e8f0', glass: '#4c7a9c', wood: '#8a5a32' },
    bronze: { ar: 'برونزي دافئ', en: 'Warm Bronze', dark: '#4a3525', lite: '#d6c3a5', glass: '#567988', wood: '#7c4d28' },
    ivory: { ar: 'أبيض عاجي', en: 'Architectural Ivory', dark: '#334155', lite: '#f5f2eb', glass: '#5886a5', wood: '#9b6b43' },
    charcoal: { ar: 'فحمي داكن', en: 'Dark Charcoal', dark: '#18181b', lite: '#71717a', glass: '#335773', wood: '#5c3b24' },
    terracotta: { ar: 'طيني معماري', en: 'Terracotta', dark: '#5c2d1c', lite: '#ead7c5', glass: '#4e758a', wood: '#8c4427' }
  };

  const FACADE_PRESETS = {
    officeGlass: {
      ar: 'مكتبي زجاجي',
      en: 'Glass Curtain',
      fac: 'curtain',
      cfg: { spacing: 2.8, wwr: 74, depth: 0.25, tone: 'slate', baseGround: true, sides: { f: true, b: true, r: true, l: true } }
    },
    solarSouth: {
      ar: 'كاسرات شمسية',
      en: 'Solar Louvers',
      fac: 'hfins',
      cfg: { spacing: 3.5, wwr: 54, depth: 0.85, tone: 'ivory', baseGround: true, sides: { f: true, b: false, r: true, l: true } }
    },
    heritageMash: {
      ar: 'مشربية تراثية',
      en: 'Mashrabiya',
      fac: 'mash',
      cfg: { spacing: 3.8, wwr: 44, depth: 0.5, tone: 'bronze', baseGround: false, sides: { f: true, b: true, r: true, l: true } }
    },
    resBalcony: {
      ar: 'شرفات سكنية',
      en: 'Balconies',
      fac: 'balcony',
      cfg: { spacing: 4.2, wwr: 56, depth: 1.2, tone: 'ivory', baseGround: false, sides: { f: true, b: true, r: true, l: true } }
    }
  };

  function clamp(v, lo, hi, fb) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fb;
    return Math.min(hi, Math.max(lo, n));
  }

  function isBlockFacadeEligible(b) {
    if (!b || typeof b !== 'object') return false;
    return RECTISH_SHAPES.includes(b.shape) && !FLAT_MATS.includes(b.mat) && b.mat !== 'context';
  }

  function normalizeFacadeConfig(raw, facType) {
    const meta = FACADE_TYPES[facType] || FACADE_TYPES.win;
    const src = raw && typeof raw === 'object' ? raw : {};
    const rs = src.sides && typeof src.sides === 'object' ? src.sides : {};
    return {
      spacing: +clamp(src.spacing, 1.5, 8.0, meta.defaultSpacing || 3.2).toFixed(2),
      wwr: Math.round(clamp(src.wwr, 20, 85, meta.defaultWwr || 45)),
      depth: +clamp(src.depth, 0.1, 1.8, meta.defaultDepth || 0.45).toFixed(2),
      tone: FACADE_TONES[src.tone] ? src.tone : 'slate',
      baseGround: src.baseGround !== false,
      sides: {
        f: rs.f !== false,
        b: rs.b !== false,
        r: rs.r !== false,
        l: rs.l !== false
      }
    };
  }

  function computeBlockFacadeMetrics(block, fh) {
    const floorH = Math.max(1, Number(fh) || 4);
    if (!block || !isBlockFacadeEligible(block)) {
      return {
        eligible: false,
        hasFacade: false,
        wallArea: 0,
        activeWallArea: 0,
        glazedArea: 0,
        effectiveWwr: 0,
        shadingPct: 0,
        moduleCount: 0,
        activeSideCount: 0
      };
    }
    const rotDeg = block.shape === 'box' ? 0 : (Number(block.ry) || 0);
    const rotated90 = Math.abs(rotDeg) % 180 !== 0;
    const w = Math.max(0.5, Number(rotated90 ? block.d : block.w) || 10);
    const d = Math.max(0.5, Number(rotated90 ? block.w : block.d) || 10);
    const floors = Math.max(1, Math.round(Number(block.f) || 1));
    const hw = floors * floorH;
    const fac = FACADE_TYPES[block.fac] ? block.fac : '';
    const cfg = normalizeFacadeConfig(block.facCfg, fac || 'win');
    const wallArea = 2 * (w + d) * hw;

    if (!fac) {
      return {
        eligible: true,
        hasFacade: false,
        wallArea: +wallArea.toFixed(1),
        activeWallArea: 0,
        glazedArea: 0,
        effectiveWwr: 0,
        shadingPct: 0,
        moduleCount: 0,
        activeSideCount: 0
      };
    }

    const activeFloors = (!cfg.baseGround && floors > 1) ? floors - 1 : floors;
    const floorFactor = activeFloors / floors;
    const sideLengths = [
      cfg.sides.f ? w : 0,
      cfg.sides.b ? w : 0,
      cfg.sides.r ? d : 0,
      cfg.sides.l ? d : 0
    ];
    let activeSideCount = 0;
    let activePerim = 0;
    let baysPerFloor = 0;
    for (let i = 0; i < sideLengths.length; i++) {
      if (sideLengths[i] > 0) {
        activeSideCount++;
        activePerim += sideLengths[i];
        baysPerFloor += Math.max(1, Math.round(sideLengths[i] / cfg.spacing));
      }
    }

    const activeWallArea = activePerim * hw * floorFactor;
    const glazedArea = activeWallArea * (cfg.wwr / 100);
    const effectiveWwr = wallArea > 0 ? (glazedArea / wallArea) * 100 : 0;
    const typeMeta = FACADE_TYPES[fac];
    const depthBonus = Math.min(24, cfg.depth * 18);
    const spacingFactor = fac === 'fins' || fac === 'grid' || fac === 'hfins'
      ? Math.max(0.75, Math.min(1.15, 3.2 / cfg.spacing))
      : 1;
    const shadingPct = activeSideCount > 0
      ? Math.min(92, Math.round((typeMeta.baseShade + depthBonus) * spacingFactor))
      : 0;

    return {
      eligible: true,
      hasFacade: true,
      wallArea: +wallArea.toFixed(1),
      activeWallArea: +activeWallArea.toFixed(1),
      glazedArea: +glazedArea.toFixed(1),
      effectiveWwr: +effectiveWwr.toFixed(1),
      shadingPct,
      moduleCount: baysPerFloor * activeFloors,
      activeSideCount
    };
  }

  function computeProjectFacadeSummary(blocks, fh) {
    const list = Array.isArray(blocks) ? blocks : [];
    let eligibleCount = 0;
    let facetedCount = 0;
    let totalWallArea = 0;
    let totalGlazedArea = 0;
    let shadingWeighted = 0;
    let totalModules = 0;
    const byType = {};

    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!b || b.hidden || !isBlockFacadeEligible(b)) continue;
      const m = computeBlockFacadeMetrics(b, fh);
      eligibleCount++;
      totalWallArea += m.wallArea;
      if (m.hasFacade) {
        facetedCount++;
        totalGlazedArea += m.glazedArea;
        shadingWeighted += m.shadingPct * m.activeWallArea;
        totalModules += m.moduleCount;
        byType[b.fac] = (byType[b.fac] || 0) + 1;
      }
    }

    return {
      eligibleCount,
      facetedCount,
      plainCount: Math.max(0, eligibleCount - facetedCount),
      totalWallArea: +totalWallArea.toFixed(1),
      totalGlazedArea: +totalGlazedArea.toFixed(1),
      projectWwr: totalWallArea > 0 ? +((totalGlazedArea / totalWallArea) * 100).toFixed(1) : 0,
      avgShadingPct: totalGlazedArea > 0 ? Math.round(shadingWeighted / Math.max(1, totalWallArea)) : 0,
      totalModules,
      byType
    };
  }

  function generateFacadeBoxes(opts) {
    const b = opts && opts.block;
    if (!b || !b.fac || !FACADE_TYPES[b.fac] || !isBlockFacadeEligible(b)) {
      return { dark: [], lite: [], wood: [], glass: [], palette: FACADE_TONES.slate };
    }

    const fh = Math.max(1, Number(opts.fh) || 4);
    const totalH = Math.max(1, Number(opts.height) || (b.f * fh));
    const roofH = Math.max(0, Number(opts.roofHeight) || 0);
    const rotDeg = b.shape === 'box' ? 0 : (Number(b.ry) || 0);
    const rotated90 = Math.abs(rotDeg) % 180 !== 0;
    const w = Math.max(0.5, Number(rotated90 ? b.d : b.w) || 10);
    const d = Math.max(0.5, Number(rotated90 ? b.w : b.d) || 10);
    const W = w / 2;
    const D = d / 2;
    const H = totalH / 2;
    const hw = Math.max(1, totalH - roofH);
    const floors = Math.max(1, Math.round(Number(b.f) || 1));
    const cfg = normalizeFacadeConfig(b.facCfg, b.fac);
    const palette = FACADE_TONES[cfg.tone] || FACADE_TONES.slate;
    const gate = b.shape === 'gate' && Array.isArray(opts.gateGap) ? opts.gateGap : null;

    const dark = [];
    const lite = [];
    const wood = [];
    const glass = [];

    const faces = [];
    if (cfg.sides.f) faces.push([-W, D, 1, 0, 0, 1, w]);
    if (cfg.sides.b) faces.push([W, -D, -1, 0, 0, -1, w]);
    if (cfg.sides.r) faces.push([W, D, 0, -1, 1, 0, d]);
    if (cfg.sides.l) faces.push([-W, -D, 0, 1, -1, 0, d]);

    if (b.shape === 'court' && faces.length > 0) {
      const t = Math.max(1, Number(opts.courtDepth) || Math.min(w, d) * 0.25);
      const Wi = Math.max(0.5, W - t);
      const Di = Math.max(0.5, D - t);
      faces.push(
        [Wi, Di, -1, 0, 0, -1, 2 * Wi],
        [-Wi, -Di, 1, 0, 0, 1, 2 * Wi],
        [-Wi, Di, 0, -1, 1, 0, 2 * Di],
        [Wi, -Di, 0, 1, -1, 0, 2 * Di]
      );
    }

    const startFloor = (!cfg.baseGround && floors > 1) ? 1 : 0;
    const wwrFrac = cfg.wwr / 100;
    const wwrSqrt = Math.sqrt(wwrFrac);

    for (let fi = 0; fi < faces.length; fi++) {
      const [ox, oz, dx, dz, nx, nz, len] = faces[fi];
      if (len < 0.8) continue;
      const ang = Math.atan2(-dz, dx);

      const pushBox = (s, off, y, sx, sy, sz, arr) => {
        if (sx <= 0.01 || sy <= 0.01 || sz <= 0.01) return;
        const x = ox + dx * s + nx * off;
        const z = oz + dz * s + nz * off;
        if (gate && nx === 0 && Math.abs(x) < gate[0] / 2 + sx / 2 + 0.3 && y - sy / 2 < -H + gate[1]) {
          return;
        }
        arr.push([x, y, z, sx, sy, sz, ang]);
      };

      const nBays = Math.max(1, Math.round(len / cfg.spacing));
      const bayW = len / nBays;
      const winW = Math.max(0.45, Math.min(bayW - 0.24, bayW * wwrSqrt * 0.94));
      const bandH = Math.max(0.75, Math.min(fh - 0.32, fh * (0.36 + 0.56 * wwrFrac)));
      const contStartY = -H + startFloor * fh;
      const contH = Math.max(0.5, (-H + hw) - contStartY);
      const contMidY = contStartY + contH / 2;

      for (let k = startFloor; k < floors; k++) {
        const y0 = -H + k * fh;
        if (y0 + fh > -H + hw + 0.01) break;
        const winY = y0 + fh * 0.52;

        if (b.fac === 'win') {
          const sillOff = Math.max(0.12, cfg.depth * 0.55);
          for (let i = 0; i < nBays; i++) {
            const s = (i + 0.5) * bayW;
            pushBox(s, 0.05, winY, winW, bandH, 0.1, glass);
            pushBox(s, sillOff, y0 + fh * 0.52 - bandH / 2 - 0.05, winW + 0.16, 0.09, Math.max(0.14, cfg.depth), lite);
            pushBox(s, sillOff * 0.85, y0 + fh * 0.52 + bandH / 2 + 0.05, winW + 0.16, 0.09, Math.max(0.12, cfg.depth * 0.8), dark);
          }
        } else if (b.fac === 'curtain') {
          const spanLen = Math.max(0.5, len - 0.2);
          pushBox(len / 2, 0.05, winY, spanLen, bandH, 0.1, glass);
          pushBox(len / 2, 0.09 + cfg.depth * 0.25, y0 + 0.14, len - 0.04, 0.24, Math.max(0.12, cfg.depth * 0.6), dark);
        } else if (b.fac === 'fins') {
          for (let i = 0; i < nBays; i++) {
            pushBox((i + 0.5) * bayW, 0.05, winY, Math.max(0.4, bayW - 0.22), bandH, 0.09, glass);
          }
        } else if (b.fac === 'hfins') {
          const spanLen = Math.max(0.5, len - 0.35);
          pushBox(len / 2, 0.04, winY, spanLen, bandH, 0.09, glass);
          const bladeCount = cfg.depth >= 0.7 ? 3 : 2;
          for (let bi = 0; bi < bladeCount; bi++) {
            const frac = bladeCount === 1 ? 0.6 : 0.38 + (bi / (bladeCount - 1)) * 0.5;
            pushBox(len / 2, cfg.depth * 0.52, y0 + fh * frac, len - 0.12, 0.08, Math.max(0.2, cfg.depth), lite);
          }
        } else if (b.fac === 'grid') {
          for (let i = 0; i < nBays; i++) {
            pushBox((i + 0.5) * bayW, 0.05, winY, Math.max(0.4, bayW - 0.28), bandH, 0.09, glass);
          }
          pushBox(len / 2, cfg.depth * 0.5, y0 + 0.1, len, 0.16, Math.max(0.2, cfg.depth), lite);
        } else if (b.fac === 'mash') {
          for (let i = 0; i < nBays; i++) {
            const s = (i + 0.5) * bayW;
            const scrW = Math.max(0.6, Math.min(bayW - 0.18, bayW * (0.58 + 0.34 * wwrFrac)));
            const scrH = Math.max(1.0, fh - 0.55);
            pushBox(s, 0.04, winY, scrW * 0.92, scrH * 0.92, 0.08, glass);
            pushBox(s, Math.max(0.14, cfg.depth * 0.55), winY, scrW, scrH, Math.max(0.16, cfg.depth * 0.65), wood);
            pushBox(s, Math.max(0.16, cfg.depth * 0.62), y0 + fh * 0.52 + scrH / 2 + 0.05, scrW + 0.1, 0.09, Math.max(0.2, cfg.depth * 0.7), dark);
          }
        } else if (b.fac === 'balcony') {
          const proj = Math.max(0.45, cfg.depth);
          for (let i = 0; i < nBays; i++) {
            const s = (i + 0.5) * bayW;
            const balW = Math.max(0.8, bayW * 0.84);
            pushBox(s, 0.05, winY, Math.min(balW * 0.86, winW), Math.max(1.0, fh - 0.45), 0.09, glass);
            pushBox(s, proj * 0.5, y0 + 0.12, balW, 0.18, proj, lite);
            pushBox(s, proj - 0.06, y0 + 0.68, balW, 0.92, 0.07, glass);
            pushBox(s, proj - 0.06, y0 + 1.15, balW + 0.04, 0.07, 0.1, dark);
          }
        }
      }

      if ((b.fac === 'curtain' || b.fac === 'fins' || b.fac === 'grid') && contH > 0.4) {
        const finCount = b.fac === 'curtain' ? nBays : nBays;
        const finW = b.fac === 'curtain' ? 0.1 : 0.13;
        const finD = b.fac === 'curtain' ? Math.max(0.16, cfg.depth) : Math.max(0.24, cfg.depth);
        const finTarget = b.fac === 'curtain' ? dark : lite;
        for (let i = 0; i <= finCount; i++) {
          pushBox(i * bayW, finD * 0.5, contMidY, finW, contH, finD, finTarget);
        }
      }
      if (b.fac === 'grid' && contH > 0.4) {
        pushBox(len / 2, cfg.depth * 0.5, -H + hw - 0.08, len, 0.16, Math.max(0.2, cfg.depth), lite);
      }
    }

    return { dark, lite, wood, glass, palette };
  }

  return {
    RECTISH_SHAPES,
    FLAT_MATS,
    FACADE_TYPES,
    FACADE_TONES,
    FACADE_PRESETS,
    isBlockFacadeEligible,
    normalizeFacadeConfig,
    computeBlockFacadeMetrics,
    computeProjectFacadeSummary,
    generateFacadeBoxes
  };
});
