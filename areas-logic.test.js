const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_PALETTE,
  PALETTE_PRESETS,
  isValidHex,
  mergePalette,
  computeOccupancyStats,
  computeZoneBreakdownStats
} = require('./areas-logic.js');

test('site mode computes occupied footprint vs unoccupied open space accurately', () => {
  const res = computeOccupancyStats({
    mode: 'site',
    siteWidth: 100,
    siteDepth: 100,
    footprint: 1850
  });

  assert.equal(res.mode, 'site');
  assert.equal(res.total, 10000);
  assert.equal(res.occupied, 1850);
  assert.equal(res.unoccupied, 8150);
  assert.equal(res.overflow, 0);
  assert.equal(res.isOverflow, false);
  assert.equal(Math.round(res.occupiedPct * 10) / 10, 18.5);
  assert.equal(Math.round(res.unoccupiedPct * 10) / 10, 81.5);
  assert.equal(res.slices[0].key, 'occupied');
  assert.equal(res.slices[0].value, 1850);
  assert.equal(res.slices[1].key, 'unoccupied');
  assert.equal(res.slices[1].value, 8150);
});

test('site mode handles zero footprint (empty project) cleanly', () => {
  const res = computeOccupancyStats({
    mode: 'site',
    siteWidth: 80,
    siteDepth: 50,
    footprint: 0
  });

  assert.equal(res.total, 4000);
  assert.equal(res.occupied, 0);
  assert.equal(res.unoccupied, 4000);
  assert.equal(res.occupiedPct, 0);
  assert.equal(res.unoccupiedPct, 100);
  assert.equal(res.hasTotal, true);
});

test('program mode computes allocated vs unoccupied capacity and handles overflow safely', () => {
  const nominal = computeOccupancyStats({
    mode: 'program',
    netCapacity: 5000,
    allocatedArea: 3250,
    occupiedColor: '#0f766e',
    unoccupiedColor: '#e2e8f0'
  });
  assert.equal(nominal.total, 5000);
  assert.equal(nominal.occupied, 3250);
  assert.equal(nominal.unoccupied, 1750);
  assert.equal(nominal.occupiedPct, 65);
  assert.equal(nominal.isOverflow, false);
  assert.equal(nominal.slices[0].color, '#0f766e');
  assert.equal(nominal.slices[1].color, '#e2e8f0');

  const over = computeOccupancyStats({
    mode: 'program',
    netCapacity: 2000,
    allocatedArea: 2500
  });
  assert.equal(over.occupied, 2000);
  assert.equal(over.unoccupied, 0);
  assert.equal(over.overflow, 500);
  assert.equal(over.isOverflow, true);
  assert.equal(over.occupiedPct, 125);
  assert.equal(over.clampedOccupiedPct, 100);
  assert.equal(over.slices[0].color, '#b91c1c');
});

test('handles invalid, negative, or zero totals without NaN', () => {
  const res = computeOccupancyStats({
    mode: 'site',
    siteWidth: -10,
    siteDepth: NaN,
    footprint: -5
  });

  assert.equal(res.total, 0);
  assert.equal(res.occupied, 0);
  assert.equal(res.unoccupied, 0);
  assert.equal(res.occupiedPct, 0);
  assert.equal(res.unoccupiedPct, 0);
  assert.equal(res.hasTotal, false);
});

test('mergePalette validates hex strings and preserves defaults for invalid entries', () => {
  assert.equal(isValidHex('#1e40af'), true);
  assert.equal(isValidHex('red'), false);
  assert.equal(isValidHex('#123'), false);

  const merged = mergePalette(DEFAULT_PALETTE, {
    occupied: '#C2410C',
    unoccupied: 'invalid-color',
    zones: {
      main: '#E11D48',
      pub: 'not-hex',
      '': '#111827'
    }
  });

  assert.equal(merged.occupied, '#c2410c');
  assert.equal(merged.unoccupied, DEFAULT_PALETTE.unoccupied);
  assert.equal(merged.zones.main, '#e11d48');
  assert.equal(merged.zones.pub, DEFAULT_PALETTE.zones.pub);
  assert.equal(merged.zones[''], '#111827');
  assert.ok(PALETTE_PRESETS.length >= 3);
});

test('computeZoneBreakdownStats calculates functional zone shares with custom colors', () => {
  const res = computeZoneBreakdownStats({
    zones: [
      { key: 'main', area: 1500, color: '#c2410c' },
      { key: 'pub', area: 500, color: '#0d9488' },
      { key: 'adm', area: 0, color: '#64748b' }
    ]
  });

  assert.equal(res.mode, 'zones');
  assert.equal(res.total, 2000);
  assert.equal(res.hasTotal, true);
  assert.equal(res.slices.length, 2);
  assert.equal(res.slices[0].key, 'main');
  assert.equal(res.slices[0].pct, 75);
  assert.equal(res.slices[0].color, '#c2410c');
  assert.equal(res.slices[1].key, 'pub');
  assert.equal(res.slices[1].pct, 25);
});
