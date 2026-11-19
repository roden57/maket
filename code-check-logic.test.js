const test = require('node:test');
const assert = require('node:assert/strict');
const { computeCodeChecks, distToCore } = require('./code-check-logic.js');

const box = (o) => Object.assign({ shape: 'box', mat: 'brick', fn: 'main', x: 0, z: 0, w: 10, d: 10, f: 1, y0: 0 }, o);

test('parking: required from floor area, provided from asphalt', () => {
  const r = computeCodeChecks({
    blocks: [box({ w: 20, d: 25, f: 2 }), box({ mat: 'asphalt', fn: '', x: 40, w: 20, d: 25 })],
    opts: { parkM2: 50, spaceM2: 25 }
  });
  assert.equal(r.gfa, 1000);
  assert.equal(r.parking.required, 20);
  assert.equal(r.parking.provided, 20);
  assert.equal(r.parking.ok, true);
});

test('escape: block far from any core fails, near block passes', () => {
  const r = computeCodeChecks({
    blocks: [
      box({ name: 'core', mat: 'joint', fn: 'circ', x: 0, w: 6, d: 6, f: 3 }),
      box({ name: 'near', x: 15, w: 20, d: 10, f: 3 }),
      box({ name: 'far', x: 120, w: 20, d: 10, f: 3 })
    ],
    opts: { escapeMax: 45 }
  });
  const near = r.escape.items.find(i => i.name === 'near');
  const far = r.escape.items.find(i => i.name === 'far');
  assert.equal(near.ok, true);
  assert.equal(far.ok, false);
  assert.equal(r.escape.failCount, 1);
  assert.equal(r.escape.items[0].name, 'far'); // worst first
});

test('escape: no cores at all means every multi-storey block fails', () => {
  const r = computeCodeChecks({ blocks: [box({ f: 2 })] });
  assert.equal(r.escape.ok, false);
  assert.equal(r.escape.items[0].worst, null);
  assert.equal(r.stairs.ok, false);
});

test('single-storey design needs no stairs, lifts or escape check', () => {
  const r = computeCodeChecks({ blocks: [box({ f: 1 }), box({ x: 30, f: 1 })] });
  assert.equal(r.escape.items.length, 0);
  assert.equal(r.lifts.required, 0);
  assert.equal(r.lifts.ok, true);
  assert.equal(r.stairs.ok, true);
});

test('lifts: passenger lifts by upper-floor area plus one service lift', () => {
  const r = computeCodeChecks({
    blocks: [
      box({ w: 50, d: 50, f: 3 }), // upper gfa = 2500 * 2 = 5000
      box({ mat: 'joint', fn: 'circ', x: 40, w: 6, d: 6, f: 3 })
    ],
    opts: { liftM2: 2500, serviceLift: 1 }
  });
  assert.equal(r.lifts.required, 4); // 5000/2500 = 2 (+ core upper area rounds up to 3) + 1
  assert.equal(r.lifts.capacity, 2);
  assert.equal(r.lifts.ok, false);
});

test('distance to a core is zero inside and rectilinear outside', () => {
  const core = box({ w: 10, d: 10 });
  assert.equal(distToCore(core, 0, 0), 0);
  assert.equal(distToCore(core, 8, 0), 3);
  assert.equal(distToCore(core, 8, 9), 7);
});
