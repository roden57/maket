const test = require('node:test');
const assert = require('node:assert/strict');
const MASS = require('./mass-logic.js');

test('excludes flat slabs, props, riwaq, context, and hidden masses', () => {
  assert.equal(MASS.isMassAnalyzable({ shape: 'box', mat: 'brick' }), true);
  assert.equal(MASS.isMassAnalyzable({ shape: 'box', mat: 'brick', hidden: true }), false);
  assert.equal(MASS.isMassAnalyzable({ shape: 'box', mat: 'green' }), false);
  assert.equal(MASS.isMassAnalyzable({ shape: 'box', mat: 'context' }), false);
  assert.equal(MASS.isMassAnalyzable({ shape: 'riwaq', mat: 'white' }), false);
  assert.equal(MASS.isMassAnalyzable({ shape: 'tree', mat: 'brick' }), false);
});

test('computes accurate volume, envelope area, S/V ratio, and compactness for rectangular mass', () => {
  const m = MASS.analyzeBlockMass({ id: 'b1', name: 'Cube', shape: 'box', mat: 'stone', x: 0, z: 0, w: 10, d: 10, f: 2, y0: 0 }, 0, 4);
  // 10x10x8 => vol = 800, envelope = 4*10*8 + 100 = 420, svr = 420/800 = 0.525
  assert.equal(m.footprint, 100);
  assert.equal(m.gfa, 200);
  assert.equal(m.height, 8);
  assert.equal(m.volume, 800);
  assert.equal(m.envelopeArea, 420);
  assert.equal(m.svr, 0.525);
  assert.ok(m.compactnessPct > 95 && m.compactnessPct <= 100);
  assert.equal(m.daylightPct, 100);
});

test('courtyard block achieves higher daylight perimeter reach than deep solid block of equal footprint', () => {
  const deep = MASS.analyzeBlockMass({ id: 'd1', name: 'Deep', shape: 'box', w: 40, d: 40, f: 3 }, 0, 4);
  const court = MASS.analyzeBlockMass({ id: 'c1', name: 'Court', shape: 'court', w: 46, d: 46, t: 11, f: 3 }, 1, 4);
  assert.ok(deep.daylightPct < 65, `expected deep daylight < 65, got ${deep.daylightPct}`);
  assert.equal(court.daylightPct, 100);
  assert.ok(court.daylightPct > deep.daylightPct);
});

test('detects 3D overlapping collisions while ignoring cleanly stacked vertical podium + tower', () => {
  const blocks = [
    { id: 'podium', name: 'Podium', shape: 'box', mat: 'stone', x: 0, z: 0, w: 40, d: 30, f: 2, y0: 0 }, // top=8
    { id: 'tower', name: 'Tower', shape: 'box', mat: 'white', x: 0, z: 0, w: 18, d: 16, f: 6, y0: 8 },  // stacked cleanly on y0=8
    { id: 'core', name: 'Core', shape: 'box', mat: 'joint', x: -8, z: 0, w: 8, d: 8, f: 8, y0: 0 },     // intersects both!
    { id: 'wing', name: 'Wing', shape: 'box', mat: 'brick', x: 26, z: 0, w: 10, d: 12, f: 2, y0: 0 }    // x=21..31 -> gap 1.0m from Podium (x=20)
  ];
  const res = MASS.analyzeProjectMasses(blocks, 4);
  assert.equal(res.summary.count, 4);
  // Core collides with Podium (y 0..8) and Tower (y 8..32), while Podium + Tower do NOT collide with each other
  const pairs = res.collisions.map(c => `${c.aId}-${c.bId}`);
  assert.ok(pairs.includes('podium-core'));
  assert.ok(pairs.includes('tower-core'));
  assert.ok(!pairs.includes('podium-tower'));
  assert.equal(res.tightGaps.length, 1);
  assert.equal(res.tightGaps[0].aId, 'podium');
  assert.equal(res.tightGaps[0].bId, 'wing');
  assert.equal(res.tightGaps[0].gap, 1.0);
});

test('handles rotated boxes in collision and flush-touching tolerance', () => {
  const flushBlocks = [
    { id: 'a', name: 'Wing A', shape: 'box', mat: 'stone', x: -10, z: 0, w: 10, d: 10, f: 2, y0: 0 }, // x: -15..-5
    { id: 'b', name: 'Wing B', shape: 'box', mat: 'brick', x: 0, z: 0, w: 10, d: 10, f: 2, y0: 0 }    // x: -5..5 flush at -5
  ];
  const flushRes = MASS.analyzeProjectMasses(flushBlocks, 4);
  assert.equal(flushRes.collisions.length, 0);
  assert.equal(flushRes.tightGaps.length, 0);

  const rotOverlap = [
    { id: 'r1', name: 'Rot 1', shape: 'box', mat: 'stone', x: 0, z: 0, w: 20, d: 6, f: 2, y0: 0, rot: 45 },
    { id: 'r2', name: 'Rot 2', shape: 'box', mat: 'brick', x: 0, z: 0, w: 20, d: 6, f: 2, y0: 0, rot: -45 }
  ];
  const rotRes = MASS.analyzeProjectMasses(rotOverlap, 4);
  assert.equal(rotRes.collisions.length, 1);
  assert.ok(rotRes.collisions[0].penetration > 5);
});

test('computes overlay colors for height, svr, daylight, and issues modes', () => {
  const blocks = [
    { id: 'a', name: 'Short', shape: 'box', mat: 'stone', x: -20, z: 0, w: 10, d: 10, f: 1, y0: 0 },
    { id: 'b', name: 'Tall', shape: 'box', mat: 'white', x: 20, z: 0, w: 30, d: 30, f: 8, y0: 0 }
  ];
  const analysis = MASS.analyzeProjectMasses(blocks, 4);
  const cNone = MASS.getMassOverlayColor(analysis.items[0], 'none', analysis);
  assert.equal(cNone, null);
  const cH1 = MASS.getMassOverlayColor(analysis.items[0], 'height', analysis);
  const cH2 = MASS.getMassOverlayColor(analysis.items[1], 'height', analysis);
  assert.match(cH1, /^#[0-9a-f]{6}$/i);
  assert.notEqual(cH1, cH2);
  assert.equal(MASS.getMassOverlayColor(analysis.items[0], 'issues', analysis), '#10b981');
});
