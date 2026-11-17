(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_AREAS = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const HEX_RE = /^#[0-9a-fA-F]{6}$/;

  function isValidHex(v) {
    return typeof v === 'string' && HEX_RE.test(v.trim());
  }

  function normHex(v, fallback) {
    return isValidHex(v) ? v.trim().toLowerCase() : fallback;
  }

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  const DEFAULT_PALETTE = {
    occupied: '#1e40af',
    unoccupied: '#cbd5e1',
    zones: {
      main: '#2563eb',
      pub: '#0d9488',
      spec: '#d97706',
      adm: '#64748b',
      circ: '#7c3aed',
      '': '#94a3b8'
    }
  };

  const PALETTE_PRESETS = [
    {
      id: 'default',
      ar: 'معماري',
      en: 'Architectural',
      palette: {
        occupied: '#1e40af',
        unoccupied: '#cbd5e1',
        zones: {
          main: '#2563eb',
          pub: '#0d9488',
          spec: '#d97706',
          adm: '#64748b',
          circ: '#7c3aed',
          '': '#94a3b8'
        }
      }
    },
    {
      id: 'warm',
      ar: 'ترابي دافئ',
      en: 'Warm Earth',
      palette: {
        occupied: '#b45309',
        unoccupied: '#e7e5e4',
        zones: {
          main: '#c2410c',
          pub: '#d97706',
          spec: '#be123c',
          adm: '#78716c',
          circ: '#0f766e',
          '': '#a8a29e'
        }
      }
    },
    {
      id: 'botanical',
      ar: 'طبيعي هادئ',
      en: 'Botanical',
      palette: {
        occupied: '#0f766e',
        unoccupied: '#dbe4df',
        zones: {
          main: '#047857',
          pub: '#0284c7',
          spec: '#ca8a04',
          adm: '#475569',
          circ: '#65a30d',
          '': '#94a3b8'
        }
      }
    },
    {
      id: 'contrast',
      ar: 'تباين عالٍ',
      en: 'High Contrast',
      palette: {
        occupied: '#0f172a',
        unoccupied: '#e2e8f0',
        zones: {
          main: '#1d4ed8',
          pub: '#059669',
          spec: '#dc2626',
          adm: '#4b5563',
          circ: '#9333ea',
          '': '#9ca3af'
        }
      }
    }
  ];

  function clonePalette(p) {
    const src = p || DEFAULT_PALETTE;
    return {
      occupied: normHex(src.occupied, DEFAULT_PALETTE.occupied),
      unoccupied: normHex(src.unoccupied, DEFAULT_PALETTE.unoccupied),
      zones: Object.assign({}, DEFAULT_PALETTE.zones, src.zones || {})
    };
  }

  function mergePalette(base, overrides) {
    const out = clonePalette(base);
    if (!overrides || typeof overrides !== 'object') return out;
    if (isValidHex(overrides.occupied)) out.occupied = overrides.occupied.trim().toLowerCase();
    if (isValidHex(overrides.unoccupied)) out.unoccupied = overrides.unoccupied.trim().toLowerCase();
    if (overrides.zones && typeof overrides.zones === 'object') {
      Object.keys(DEFAULT_PALETTE.zones).forEach(k => {
        if (isValidHex(overrides.zones[k])) {
          out.zones[k] = overrides.zones[k].trim().toLowerCase();
        }
      });
    }
    return out;
  }

  /**
   * Computes occupied vs. unoccupied area metrics for either:
   * - mode === 'site': Built footprint vs. open/unoccupied land within the site parcel.
   * - mode === 'program': Allocated functional program spaces vs. remaining block floor capacity.
   */
  function computeOccupancyStats(input) {
    const opts = input || {};
    const mode = opts.mode === 'program' ? 'program' : 'site';

    let total = 0;
    let rawOccupied = 0;

    if (mode === 'site') {
      total = num(opts.siteWidth) * num(opts.siteDepth);
      rawOccupied = num(opts.footprint);
    } else {
      total = num(opts.netCapacity);
      rawOccupied = num(opts.allocatedArea);
    }

    const overflow = total > 0 ? Math.max(0, rawOccupied - total) : rawOccupied;
    const occupied = total > 0 ? Math.min(total, rawOccupied) : 0;
    const unoccupied = total > 0 ? Math.max(0, total - occupied) : 0;

    const occupiedPct = total > 0 ? (rawOccupied / total) * 100 : 0;
    const clampedOccupiedPct = total > 0 ? (occupied / total) * 100 : 0;
    const unoccupiedPct = total > 0 ? Math.max(0, 100 - clampedOccupiedPct) : 0;

    const occColor = normHex(opts.occupiedColor, DEFAULT_PALETTE.occupied);
    const unoccColor = normHex(opts.unoccupiedColor, DEFAULT_PALETTE.unoccupied);

    const slices = [
      {
        key: 'occupied',
        value: occupied,
        rawValue: rawOccupied,
        pct: occupiedPct,
        sharePct: clampedOccupiedPct,
        color: overflow > 0.5 ? '#b91c1c' : occColor
      },
      {
        key: 'unoccupied',
        value: unoccupied,
        rawValue: unoccupied,
        pct: unoccupiedPct,
        sharePct: unoccupiedPct,
        color: unoccColor
      }
    ];

    return {
      mode,
      total,
      rawOccupied,
      occupied,
      unoccupied,
      overflow,
      occupiedPct,
      clampedOccupiedPct,
      unoccupiedPct,
      hasTotal: total > 0,
      isOverflow: overflow > 0.5,
      slices
    };
  }

  /**
   * Computes circular distribution across functional zones using customizable zone colors.
   */
  function computeZoneBreakdownStats(input) {
    const opts = input || {};
    const list = Array.isArray(opts.zones) ? opts.zones : [];
    const total = list.reduce((s, item) => s + num(item && item.area), 0);

    const slices = list
      .map(item => {
        const key = String((item && item.key) ?? '');
        const area = num(item && item.area);
        const fallbackColor = DEFAULT_PALETTE.zones[key] || DEFAULT_PALETTE.zones[''];
        return {
          key,
          value: area,
          rawValue: area,
          pct: total > 0 ? (area / total) * 100 : 0,
          sharePct: total > 0 ? (area / total) * 100 : 0,
          color: normHex(item && item.color, fallbackColor)
        };
      })
      .filter(s => s.value > 0);

    return {
      mode: 'zones',
      total,
      hasTotal: total > 0,
      slices
    };
  }

  return {
    DEFAULT_PALETTE,
    PALETTE_PRESETS,
    isValidHex,
    mergePalette,
    computeOccupancyStats,
    computeZoneBreakdownStats
  };
});
