const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeSiteConfig,
  computeBuildableZone,
  checkSetbackCompliance,
  computeSiteMetrics
} = require('./site-logic.js');

test('normalizeSiteConfig preserves uniform setbacks and handles asymmetric custom setbacks', () => {
  const uniform = normalizeSiteConfig({ w: 80, d: 60, sb: 5 });
  assert.equal(uniform.sbMode, 'uniform');
  assert.equal(uniform.sbN, 5);
  assert.equal(uniform.sbS, 5);
  assert.equal(uniform.sbE, 5);
  assert.equal(uniform.sbW, 5);
  assert.equal(uniform.streets.s, true);
  assert.equal(uniform.roadW, 12);

  const custom = normalizeSiteConfig({
    w: 80,
    d: 60,
    sb: 5,
    sbMode: 'custom',
    sbN: 4,
    sbS: 10,
    sbE: 3,
    sbW: 6,
    streets: { n: false, s: true, e: true, w: false }
  });
  assert.equal(custom.sbMode, 'custom');
  assert.equal(custom.sbN, 4);
  assert.equal(custom.sbS, 10);
  assert.equal(custom.sbE, 3);
  assert.equal(custom.sbW, 6);
  assert.equal(custom.streets.e, true);
});

test('computeBuildableZone computes exact asymmetric buildable envelope and ratio', () => {
  const z = computeBuildableZone({
    w: 100,
    d: 80,
    sbMode: 'custom',
    sbN: 6,
    sbS: 14,
    sbE: 5,
    sbW: 15
  });
  assert.equal(z.plotArea, 8000);
  assert.equal(z.width, 80); // 100 - 15 - 5
  assert.equal(z.depth, 60); // 80 - 6 - 14
  assert.equal(z.area, 4800);
  assert.equal(z.minX, -35); // -50 + 15
  assert.equal(z.maxX, 45);  // 50 - 5
  assert.equal(z.minZ, -34); // -40 + 6
  assert.equal(z.maxZ, 26);  // 40 - 14
  assert.equal(z.valid, true);
});

test('checkSetbackCompliance detects setback breaches, out-of-plot blocks, and ignores landscape/context', () => {
  const site = { w: 100, d: 100, sb: 10, sbMode: 'uniform' }; // buildable [-40..40, -40..40]
  const blocks = [
    { id: 'ok1', name: 'Center Tower', shape: 'box', mat: 'stone', x: 0, z: 0, w: 30, d: 30, f: 4 },
    { id: 'breach1', name: 'South Wing', shape: 'box', mat: 'brick', x: 0, z: 36, w: 20, d: 14, f: 2 }, // z reaches +43 > 40
    { id: 'out1', name: 'Far Annex', shape: 'box', mat: 'concrete', x: 48, z: 0, w: 12, d: 12, f: 2 }, // x reaches +54 > 50
    { id: 'flat1', name: 'Plinth Paving', shape: 'box', mat: 'paving', x: 0, z: 44, w: 40, d: 10, f: 1 }, // flat ignored
    { id: 'ctx1', name: 'Neighbor', shape: 'box', mat: 'context', x: -70, z: 0, w: 20, d: 30, f: 3 } // context ignored
  ];

  const res = checkSetbackCompliance({ site, blocks });
  assert.equal(res.checkedCount, 3);
  assert.equal(res.compliantCount, 1);
  assert.equal(res.violationCount, 2);
  assert.equal(res.isFullyCompliant, false);
  assert.equal(res.violations[0].id, 'breach1');
  assert.equal(res.violations[0].sides.s, true);
  assert.equal(res.violations[0].outOfPlot, false);
  assert.equal(res.violations[1].id, 'out1');
  assert.equal(res.violations[1].outOfPlot, true);
});

test('computeSiteMetrics calculates coverage, FAR, and zoning compliance thresholds', () => {
  const m = computeSiteMetrics({
    site: { w: 50, d: 40, sb: 4, maxCovPct: 50, maxFar: 2.0, streets: { n: false, s: true, e: true, w: false } },
    blocks: [{ id: 'b1', name: 'Mass', shape: 'box', mat: 'stone', x: 0, z: 0, w: 20, d: 20, f: 3 }],
    footprintArea: 1100, // 55% > 50%
    gfa: 3200 // FAR 1.6 <= 2.0
  });
  assert.equal(m.plotArea, 2000);
  assert.equal(m.buildableArea, 42 * 32);
  assert.equal(m.coveragePct, 55);
  assert.equal(m.coverageOk, false);
  assert.equal(m.far, 1.6);
  assert.equal(m.farOk, true);
  assert.equal(m.streetCount, 2);
  assert.equal(m.compliance.isFullyCompliant, true);
});
