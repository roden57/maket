const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildSectionPlaneParams,
  analyzeSectionCut
} = require('./section-logic.js');

test('buildSectionPlaneParams preserves standard X/Z/Y clipping conventions', () => {
  const px = buildSectionPlaneParams({ axis: 'x', pos: 12, flip: false, angleDeg: 0 });
  assert.deepEqual(px.normal, { x: -1, y: 0, z: 0 });
  assert.equal(px.constant, 12);

  const pxFlip = buildSectionPlaneParams({ axis: 'x', pos: 12, flip: true, angleDeg: 0 });
  assert.deepEqual(pxFlip.normal, { x: 1, y: 0, z: 0 });
  assert.equal(pxFlip.constant, -12);

  const py = buildSectionPlaneParams({ axis: 'y', pos: 5.2, flip: false });
  assert.deepEqual(py.normal, { x: 0, y: -1, z: 0 });
  assert.equal(py.constant, 5.2);
});

test('buildSectionPlaneParams creates opposite second plane in slice-band mode', () => {
  const s = buildSectionPlaneParams({ axis: 'x', pos: 10, flip: false, sliceOn: true, thickness: 8 });
  assert.ok(s.second);
  assert.deepEqual(s.second.normal, { x: 1, y: 0, z: 0 });
  // At x=10 (primary) s >= 0; at x=2 (10 - 8) s2 >= 0 -> kept band [2, 10]
  assert.equal(s.second.normal.x * 2 + s.second.constant, 0);
  assert.equal(s.normal.x * 10 + s.constant, 0);
});

test('analyzeSectionCut slices a box and computes exact cut span, area, and max height', () => {
  const res = analyzeSectionCut({
    axis: 'x',
    pos: 0,
    flip: false,
    fh: 4,
    blocks: [
      { id: 'k1', name: 'Main Wing', shape: 'box', mat: 'stone', fn: 'main', x: 0, z: 5, w: 10, d: 20, f: 3, y0: 0 }
    ]
  });
  assert.equal(res.cutCount, 1);
  assert.equal(res.capSegments.length, 1);
  assert.ok(Math.abs(res.cutItems[0].cutSpanWidth - 20) < 1e-6);
  assert.ok(Math.abs(res.totalCutArea - 240) < 1e-6); // 20m wide x 12m tall
  assert.equal(res.maxCutHeight, 12);
});

test('analyzeSectionCut splits a courtyard block into two wall segments with open center', () => {
  const res = analyzeSectionCut({
    axis: 'x',
    pos: 0,
    flip: false,
    fh: 4,
    blocks: [
      { id: 'c1', name: 'Courtyard', shape: 'court', mat: 'white', x: 0, z: 0, w: 30, d: 30, t: 5, f: 2, y0: 0 }
    ]
  });
  assert.equal(res.cutCount, 1);
  assert.equal(res.capSegments.length, 2);
  const wTotal = res.capSegments.reduce((s, g) => s + (g.u1 - g.u0), 0);
  assert.ok(Math.abs(wTotal - 10) < 1e-6); // two 5m thick walls
});

test('analyzeSectionCut supports angled vertical cuts and horizontal Y floor cuts', () => {
  const angled = analyzeSectionCut({
    axis: 'x',
    pos: 0,
    angleDeg: 30,
    fh: 4,
    blocks: [
      { id: 'b1', name: 'Tower', shape: 'box', mat: 'brick', x: 0, z: 0, w: 12, d: 12, f: 4, y0: 0 }
    ]
  });
  assert.equal(angled.cutCount, 1);
  assert.ok(angled.cutItems[0].cutSpanWidth > 12); // diagonal slice across square > side length

  const horiz = analyzeSectionCut({
    axis: 'y',
    pos: 5.2,
    fh: 4,
    blocks: [
      { id: 'low', name: 'One Floor', shape: 'box', mat: 'brick', x: -20, z: 0, w: 10, d: 10, f: 1, y0: 0 }, // 0..4m (below cut)
      { id: 'tall', name: 'Three Floors', shape: 'box', mat: 'stone', x: 10, z: 0, w: 12, d: 10, f: 3, y0: 0 } // 0..12m (cut!)
    ]
  });
  assert.equal(horiz.cutCount, 1);
  assert.equal(horiz.cutItems[0].id, 'tall');
  assert.ok(Math.abs(horiz.totalCutArea - 120) < 1e-6);

  const sliced = analyzeSectionCut({
    axis: 'x',
    pos: 4,
    flip: false,
    sliceOn: true,
    thickness: 8,
    fh: 4,
    blocks: [
      { id: 's1', name: 'Sliced Wing', shape: 'box', mat: 'stone', x: 0, z: 0, w: 12, d: 10, f: 2, y0: 0 }
    ]
  });
  assert.equal(sliced.capSegments.length, 1);
  assert.equal(sliced.capSegments2.length, 1);
});

test('formed blocks: vertical cut follows step-backs, courtyard and sloped roof', () => {
  const res = analyzeSectionCut({
    axis: 'x', pos: 0, fh: 4,
    blocks: [{ id: 'f1', name: 'Formed', shape: 'box', mat: 'brick', x: 0, z: 0, w: 40, d: 30, f: 4, y0: 0,
      form: { court: { w: 10, d: 10 }, steps: [{ at: 2, f: 5 }], slope: { a: 45, dir: 'b' } } }]
  });
  assert.equal(res.cutCount, 1);
  // 2 tiers × 2 wings either side of the courtyard
  assert.equal(res.capSegments.length, 4);
  const upper = res.capSegments.filter(s => s.y0 === 8);
  assert.equal(upper.length, 2);
  // the step-back pulls the front (+z) edge in by 5 m: the cut spans z -15 .. 10 on the upper tier
  const us = upper.map(s => [s.u0, s.u1]).flat();
  assert.ok(Math.abs(Math.max(...us) - Math.min(...us) - 25) < 1e-6);
  // sloped top: ends at different heights, falling toward the back (-z)
  upper.forEach(s => assert.ok(s.yt0 !== undefined && Math.abs(s.yt0 - s.yt1) > 1));
  assert.ok(res.maxCutHeight > 16 + 20);
});

test('formed blocks: horizontal cut uses the tier at that level with the courtyard hole', () => {
  const b = { id: 'f1', name: 'Formed', shape: 'box', mat: 'brick', x: 0, z: 0, w: 40, d: 30, f: 4, y0: 0,
    form: { court: { w: 10, d: 10, f0: 1 }, steps: [{ at: 2, f: 5 }] } };
  const low = analyzeSectionCut({ axis: 'y', pos: 2, fh: 4, blocks: [b] });
  assert.equal(low.cutItems[0].rings.length, 1);
  assert.ok(Math.abs(low.totalCutArea - 1200) < 1e-6);
  const high = analyzeSectionCut({ axis: 'y', pos: 10, fh: 4, blocks: [b] });
  assert.equal(high.cutItems[0].rings.length, 2);
  assert.ok(Math.abs(high.totalCutArea - (40 * 25 - 100)) < 1e-6);
  const above = analyzeSectionCut({ axis: 'y', pos: 17, fh: 4, blocks: [b] });
  assert.equal(above.cutCount, 0);
});
