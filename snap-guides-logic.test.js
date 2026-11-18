const test = require('node:test');
const assert = require('node:assert/strict');
const SNAP = require('./snap-guides-logic.js');

test('computes world AABB accurately for rotated blocks and ry=90 blocks', () => {
  const bRy = SNAP.getBlockAabbXZ({ shape: 'L', x: 10, z: 20, w: 6, d: 12, ry: 90, rot: 0 });
  assert.equal(bRy.minX, 7);
  assert.equal(bRy.maxX, 13);
  assert.equal(bRy.minZ, 14);
  assert.equal(bRy.maxZ, 26);

  const bRot = SNAP.getBlockAabbXZ({ shape: 'box', x: 0, z: 0, w: 10, d: 10, ry: 0, rot: 45 });
  const expectedHalf = 5 * Math.SQRT2;
  assert.ok(Math.abs(bRot.maxX - expectedHalf) < 1e-6);
  assert.ok(Math.abs(bRot.minZ + expectedHalf) < 1e-6);
});

test('collects targets skipping hidden blocks, props, and excluded dragging indices', () => {
  const blocks = [
    { name: 'Active', shape: 'box', x: 0, z: 0, w: 10, d: 10 },
    { name: 'Hidden', shape: 'box', x: 20, z: 0, w: 10, d: 10, hidden: true },
    { name: 'Tree', shape: 'tree', x: 30, z: 0, w: 4, d: 4 },
    { name: 'Dragged', shape: 'box', x: 12, z: 0, w: 8, d: 8 }
  ];
  const targets = SNAP.collectSnapTargets(blocks, new Set([3]), { w: 100, d: 100, sb: 5 });
  const xVals = targets.x.map(t => t.val);
  assert.ok(xVals.includes(-5));
  assert.ok(xVals.includes(5));
  assert.ok(!xVals.includes(25)); // hidden excluded
  assert.ok(!xVals.includes(32)); // prop excluded
  assert.ok(!xVals.includes(16)); // dragged excluded
  assert.ok(xVals.includes(-45)); // setback included
});

test('snaps dragged block to neighbor edge and center, returning spanning guide lines', () => {
  const blocks = [
    { name: 'Wing A', shape: 'box', x: -10, z: -20, w: 10, d: 12 }, // X: -15..-5, Z: -26..-14
    { name: 'Wing B', shape: 'box', x: -9.7, z: 10, w: 16, d: 10 }   // X: -17.7..-1.7, center -9.7
  ];
  const targets = SNAP.collectSnapTargets(blocks, new Set([1]), { w: 100, d: 100, sb: 0 });
  const dragBox = SNAP.getBlockAabbXZ(blocks[1]);
  const res = SNAP.computeSmartDragSnap({ dragBox, targets, threshold: 0.8, guideY: 0.15 });

  // Center -9.7 snaps cleanly to Wing A center -10 (dx = -0.3)
  assert.equal(res.matchedX, true);
  assert.ok(Math.abs(res.dx - (-0.3)) < 1e-6);
  const centerGuide = res.guides.find(g => g.axis === 'x' && g.kind === 'center');
  assert.ok(centerGuide, 'expected center alignment guide');
  assert.equal(centerGuide.coord, -10);
  // Span covers both Wing A (-26) and Wing B (+15) plus 2.5m overshoot
  assert.ok(centerGuide.spanStart <= -28.5);
  assert.ok(centerGuide.spanEnd >= 17.5);
});

test('emits multiple simultaneous guides when both X edge and Z edge align flush', () => {
  const blocks = [
    { name: 'Base', shape: 'box', x: 0, z: 0, w: 20, d: 10 },       // X: -10..10, Z: -5..5
    { name: 'Adj', shape: 'box', x: 14.7, z: 0.3, w: 10, d: 10 }    // left edge 9.7 near 10 (+0.3), center Z 0.3 near 0 (-0.3)
  ];
  const targets = SNAP.collectSnapTargets(blocks, new Set([1]), { w: 100, d: 100, sb: 0 });
  const res = SNAP.computeSmartDragSnap({ dragBox: SNAP.getBlockAabbXZ(blocks[1]), targets, threshold: 0.8 });

  assert.equal(res.matchedX, true);
  assert.equal(res.matchedZ, true);
  assert.ok(Math.abs(res.dx - 0.3) < 1e-6);
  assert.ok(Math.abs(res.dz - (-0.3)) < 1e-6);
  assert.ok(res.guides.some(g => g.axis === 'x' && g.coord === 10 && g.kind === 'edge'));
  assert.ok(res.guides.some(g => g.axis === 'z' && g.coord === 0 && g.kind === 'center'));
});

test('computes smart resize handle snap and emits edge guide', () => {
  const blocks = [
    { name: 'Neighbor', shape: 'box', x: 20, z: -20, w: 10, d: 10 }, // minX=15, maxX=25
    { name: 'Editing', shape: 'box', x: 0, z: 0, w: 20, d: 10 }
  ];
  const targets = SNAP.collectSnapTargets(blocks, new Set([1]), { w: 100, d: 100, sb: 0 });
  const r = SNAP.computeSmartResizeSnap({
    rawMovingVal: 14.6,
    axis: 'x',
    dragCrossMin: -5,
    dragCrossMax: 5,
    targets,
    threshold: 0.8
  });
  assert.equal(r.matched, true);
  assert.equal(r.snappedVal, 15);
  assert.equal(r.guides.length, 1);
  assert.equal(r.guides[0].coord, 15);
});
