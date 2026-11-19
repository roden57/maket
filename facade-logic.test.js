const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FACADE_TYPES,
  FACADE_TONES,
  FACADE_PRESETS,
  isBlockFacadeEligible,
  normalizeFacadeConfig,
  computeBlockFacadeMetrics,
  computeProjectFacadeSummary,
  generateFacadeBoxes
} = require('./facade-logic.js');

function sampleBlock(overrides) {
  return Object.assign({
    id: 'k0',
    name: 'Main Wing',
    shape: 'box',
    mat: 'stone',
    fn: 'main',
    x: 0,
    z: 0,
    w: 20,
    d: 12,
    f: 4,
    y0: 0,
    ry: 0,
    rot: 0,
    fac: 'win'
  }, overrides || {});
}

test('isBlockFacadeEligible filters rectangular architectural blocks and excludes flat/context/props', () => {
  assert.equal(isBlockFacadeEligible(sampleBlock({ shape: 'box', mat: 'stone' })), true);
  assert.equal(isBlockFacadeEligible(sampleBlock({ shape: 'court', mat: 'brick' })), true);
  assert.equal(isBlockFacadeEligible(sampleBlock({ shape: 'box', mat: 'green' })), false);
  assert.equal(isBlockFacadeEligible(sampleBlock({ shape: 'box', mat: 'context' })), false);
  assert.equal(isBlockFacadeEligible(sampleBlock({ shape: 'cyl', mat: 'white' })), false);
});

test('normalizeFacadeConfig clamps parametric bounds and preserves directional side flags', () => {
  const cfg = normalizeFacadeConfig({
    spacing: 99,
    wwr: 5,
    depth: 9,
    tone: 'unknown',
    baseGround: false,
    sides: { f: true, b: false, r: true, l: false }
  }, 'hfins');

  assert.equal(cfg.spacing, 8.0);
  assert.equal(cfg.wwr, 20);
  assert.equal(cfg.depth, 1.8);
  assert.equal(cfg.tone, 'slate');
  assert.equal(cfg.baseGround, false);
  assert.deepEqual(cfg.sides, { f: true, b: false, r: true, l: false });
});

test('generateFacadeBoxes produces geometry for every facade type and respects side filtering and baseGround', () => {
  const types = Object.keys(FACADE_TYPES).filter(Boolean);
  assert.ok(types.length >= 7);

  for (const fac of types) {
    const b = sampleBlock({
      fac,
      facCfg: { spacing: 3.0, wwr: 55, depth: 0.6, tone: 'bronze', baseGround: true, sides: { f: true, b: true, r: true, l: true } }
    });
    const geoAll = generateFacadeBoxes({ block: b, fh: 4, height: 16, roofHeight: 0 });
    const countAll = geoAll.dark.length + geoAll.lite.length + geoAll.wood.length + geoAll.glass.length;
    assert.ok(countAll > 0, `expected 3D boxes for facade type ${fac}`);
    assert.equal(geoAll.palette.dark, FACADE_TONES.bronze.dark);

    // Disabling 3 sides reduces generated boxes proportionally
    const bFrontOnly = sampleBlock({
      fac,
      facCfg: { spacing: 3.0, wwr: 55, depth: 0.6, tone: 'bronze', baseGround: true, sides: { f: true, b: false, r: false, l: false } }
    });
    const geoOne = generateFacadeBoxes({ block: bFrontOnly, fh: 4, height: 16, roofHeight: 0 });
    const countOne = geoOne.dark.length + geoOne.lite.length + geoOne.wood.length + geoOne.glass.length;
    assert.ok(countOne > 0 && countOne < countAll, `front-only should have fewer boxes than all-sides for ${fac}`);
  }

  // Skipping ground floor reduces balcony count from 4 floors to 3 floors
  const balAll = generateFacadeBoxes({
    block: sampleBlock({ fac: 'balcony', f: 4, facCfg: { baseGround: true } }),
    fh: 4,
    height: 16,
    roofHeight: 0
  });
  const balUpper = generateFacadeBoxes({
    block: sampleBlock({ fac: 'balcony', f: 4, facCfg: { baseGround: false } }),
    fh: 4,
    height: 16,
    roofHeight: 0
  });
  assert.ok(balUpper.lite.length < balAll.lite.length);
});

test('computeBlockFacadeMetrics & computeProjectFacadeSummary calculate WWR, glazing area, shading %, and module counts', () => {
  const b1 = sampleBlock({
    w: 20,
    d: 10,
    f: 4,
    fac: 'curtain',
    facCfg: FACADE_PRESETS.officeGlass.cfg
  });
  const b2 = sampleBlock({
    id: 'k1',
    w: 16,
    d: 10,
    f: 3,
    fac: ''
  });

  const m1 = computeBlockFacadeMetrics(b1, 4);
  assert.equal(m1.eligible, true);
  assert.equal(m1.hasFacade, true);
  assert.equal(m1.wallArea, 2 * (20 + 10) * 16); // 960 m2
  assert.equal(m1.effectiveWwr, 74);
  assert.ok(m1.glazedArea > 700);
  assert.ok(m1.moduleCount > 0);

  const summary = computeProjectFacadeSummary([b1, b2, sampleBlock({ id: 'k2', mat: 'green', fac: 'win' })], 4);
  assert.equal(summary.eligibleCount, 2);
  assert.equal(summary.facetedCount, 1);
  assert.equal(summary.plainCount, 1);
  assert.ok(summary.projectWwr > 30 && summary.projectWwr < 74);
});

test('new simple types ribbon and slit produce glass and frames', () => {
  for (const fac of ['ribbon', 'slit']) {
    const block = { shape: 'box', mat: 'brick', x: 0, z: 0, w: 20, d: 12, f: 3, fac, facCfg: {} };
    const r = generateFacadeBoxes({ block, fh: 4, height: 12 });
    assert.ok(r.glass.length > 0, fac + ' has glass');
    assert.ok(r.lite.length > 0, fac + ' has frames/sills');
  }
});

test('sideFac gives each side its own element; normalize keeps only valid types', () => {
  const cfg = normalizeFacadeConfig({ sideFac: { f: 'hfins', b: 'win', r: 'nope' } }, 'win');
  assert.deepEqual(cfg.sideFac, { f: 'hfins', b: 'win' });
  const only = s => ({ shape: 'box', mat: 'brick', x: 0, z: 0, w: 20, d: 12, f: 2, fac: 'win',
    facCfg: { sides: { f: s === 'f', b: s === 'b', r: false, l: false }, sideFac: { f: 'mash', b: 'win' } } });
  const front = generateFacadeBoxes({ block: only('f'), fh: 4, height: 8 });
  const back = generateFacadeBoxes({ block: only('b'), fh: 4, height: 8 });
  assert.ok(front.wood.length > 0, 'mashrabiya side uses wood screens');
  assert.equal(back.wood.length, 0, 'window side has no wood');
});

test('ground-floor elements draw even with no facade type, only on chosen sides', () => {
  const block = { shape: 'box', mat: 'brick', x: 0, z: 0, w: 24, d: 12, f: 3, fac: '',
    facCfg: { ground: { type: 'colon', sides: { f: true } } } };
  const r = generateFacadeBoxes({ block, fh: 4, height: 12 });
  assert.ok(r.lite.length >= 3, 'columns + roof slab');
  assert.equal(r.glass.length, 0);
  const entry = generateFacadeBoxes({ block: Object.assign({}, block, { facCfg: { ground: { type: 'entry', sides: { f: true, b: true } } } }), fh: 4, height: 12 });
  assert.equal(entry.glass.length, 2, 'one glazed door per chosen side');
  const none = generateFacadeBoxes({ block: Object.assign({}, block, { facCfg: {} }), fh: 4, height: 12 });
  assert.equal(none.lite.length + none.glass.length + none.dark.length, 0);
});
