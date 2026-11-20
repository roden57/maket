const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('./form-ops-logic.js');

const box = o => Object.assign({ shape: 'box', mat: 'brick', fn: 'main', x: 0, z: 0, w: 40, d: 30, f: 4, y0: 0, rot: 0 }, o);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('no form / non-box shapes are untouched', () => {
  assert.equal(F.has(box()), false);
  assert.equal(F.has(box({ form: {} })), false);
  assert.equal(F.has(box({ shape: 'cyl', form: { ch: { r: 3 } } })), false);
  const T = F.tiers(box(), 4);
  assert.equal(T.length, 1);
  near(T[0].area, 1200);
  near(F.gfa(box(), 4), 4800);
});

test('courtyard open from the ground: area, GFA and point test', () => {
  const b = box({ form: { court: { w: 20, d: 10 } } });
  assert.equal(F.has(b), true);
  near(F.footArea(b, 4), 1200 - 200);
  near(F.gfa(b, 4), 4 * 1000);
  assert.equal(F.insideLocal(b, 4, 0, 0, 0), false); // in the void
  assert.equal(F.insideLocal(b, 4, 15, 0, 0), true); // in the wing
});

test('courtyard above a podium (f0) is solid below', () => {
  const b = box({ form: { court: { w: 20, d: 10, f0: 2 } } });
  const T = F.tiers(b, 4);
  assert.equal(T.length, 2);
  assert.equal(T[0].hole, null);
  near(F.gfa(b, 4), 2 * 1200 + 2 * 1000);
  assert.equal(F.insideLocal(b, 4, 0, 0, 0), true);
  assert.equal(F.insideLocal(b, 4, 0, 0, 3), false);
});

test('courtyard is clamped to keep 1 m of wing and dropped when too small', () => {
  const b = box({ form: { court: { w: 100, d: 100 } } });
  const T = F.tiers(b, 4);
  near(T[0].holeRect.x1 - T[0].holeRect.x0, 38);
  near(T[0].holeRect.z1 - T[0].holeRect.z0, 28);
  const off = box({ form: { court: { w: 10, d: 10, ox: 30 } } }); // centre pushed outside: nothing left
  assert.equal(F.tiers(off, 4)[0].hole, null);
});

test('step-backs per side and per group of floors', () => {
  const b = box({ f: 6, form: { steps: [{ at: 2, f: 4 }, { at: 4, f: 8, r: 5 }] } });
  const T = F.tiers(b, 3.5);
  assert.deepEqual(T.map(t => [t.f0, t.f1]), [[0, 2], [2, 4], [4, 6]]);
  near(T[1].rect.z1, 15 - 4);
  near(T[2].rect.z1, 15 - 8);
  near(T[2].rect.x1, 20 - 5);
  near(F.gfa(b, 3.5), 2 * 1200 + 2 * 40 * 26 + 2 * 35 * 22);
  near(F.floorArea(b, 3.5, 5), 35 * 22);
  // a point in the setback zone is outside on the upper floors only
  assert.equal(F.insideLocal(b, 3.5, 0, 13, 0), true);
  assert.equal(F.insideLocal(b, 3.5, 0, 13, 3), false);
});

test('step-backs that would eat the whole block are scaled to leave 2 m', () => {
  const b = box({ w: 10, form: { steps: [{ at: 1, l: 10, r: 10 }] } });
  const T = F.tiers(b, 4);
  near(T[1].rect.x1 - T[1].rect.x0, 2);
  const out = box({ f: 3, form: { steps: [{ at: 0, f: 3 }, { at: 3, f: 3 }] } }); // at must be 1..f-1
  assert.equal(F.has(out), false);
});

test('chamfer cuts the chosen corners', () => {
  const b = box({ form: { ch: { r: 4, c: { fr: true, fl: true, bl: false, br: false } } } });
  const T = F.tiers(b, 4);
  assert.equal(T[0].outer.length, 6);
  near(T[0].area, 1200 - 2 * 8);
  assert.equal(F.insideLocal(b, 4, 19.5, 14.5, 0), false); // cut corner
  assert.equal(F.insideLocal(b, 4, -19.5, -14.5, 0), true); // kept corner
});

test('chamfer is capped and the courtyard keeps clear of it', () => {
  const b = box({ w: 10, d: 10, form: { ch: { r: 50 }, court: { w: 9, d: 9 } } });
  const T = F.tiers(b, 4);
  assert.ok(T[0].outer.length === 8);
  if (T[0].hole) T[0].hole.forEach(([x, z]) => assert.equal(F.pip(T[0].outer, x, z), true));
});

test('sloped roof: rise from angle, height grows toward the high side', () => {
  const b = box({ form: { slope: { a: 20, dir: 'f' } } });
  const rf = F.roof(b, 4);
  near(rf.rise, Math.tan(20 * Math.PI / 180) * 30);
  near(F.roofT(rf, 0, 15), 0);  // front edge = low
  near(F.roofT(rf, 0, -15), 1); // back edge = high
  // roof does not add floor area
  near(F.gfa(b, 4), 4800);
  const m = F.metrics(b, 4);
  near(m.volume, 1200 * 16 + 1200 * rf.rise * 0.5, 1e-3);
  near(m.height, 16 + rf.rise);
  // 3D point test under / above the sloping plane
  assert.equal(F.insideWorld3D(b, 4, 0, 16 + rf.rise * 0.9, -14), true);
  assert.equal(F.insideWorld3D(b, 4, 0, 16 + rf.rise * 0.2, 14), false);
});

test('prisms are in world space and follow rotation', () => {
  const b = box({ x: 100, z: 50, rot: 90, form: { steps: [{ at: 2, r: 10 }] } });
  const P = F.prisms(b, 4);
  assert.equal(P.length, 2);
  near(P[1].y0, 8);
  // local +x (right side, set back) points to world +z after rot 90 in the app's convention (group.rotation.y = -rot)
  const zs = P[1].rings[0].map(p => p[1]);
  near(Math.min(...zs), 50 - 20);
  near(Math.max(...zs), 50 + 10);
});

test('prisms carry the sloped top for section cuts', () => {
  const b = box({ y0: 2, form: { slope: { a: 45, dir: 'r' } } });
  const P = F.prisms(b, 4);
  const top = P[P.length - 1];
  near(top.top(20, 0), 2 + 16);      // low side (right)
  near(top.top(-20, 0), 2 + 16 + 40); // high side: tan45 × 40 = 40
});

test('metrics: envelope counts terraces and courtyard walls', () => {
  const plain = F.metrics(box({ form: { court: { w: 1e-9, d: 0 } } }), 4); // inactive court → plain box path not used
  assert.ok(plain.footprint > 0);
  const c = F.metrics(box({ form: { court: { w: 20, d: 10 } } }), 4);
  near(c.perimeter, 140 + 60);
  near(c.envelope, (140 + 60) * 16 + 1000);
});

test('splitFloors returns one rectangle per floor at the right place', () => {
  const b = box({ f: 3, form: { steps: [{ at: 1, f: 10 }], court: { w: 10, d: 6, f0: 2 }, slope: { a: 10, dir: 'b' } } });
  const parts = F.splitFloors(b, 4);
  assert.equal(parts.length, 3);
  near(parts[0].d, 30); near(parts[1].d, 20); near(parts[1].z, -5);
  assert.equal(parts[0].form, null);
  assert.ok(parts[2].form.court && parts[2].form.slope);
  near(parts[2].form.court.oz, 5);
});

test('autoSteps builds cumulative terraces', () => {
  const s = F.autoSteps({ floors: 7, every: 2, dist: 3, sides: { f: true, r: true } });
  assert.deepEqual(s.map(x => [x.at, x.f, x.r, x.b]), [[2, 3, 3, 0], [4, 6, 6, 0], [6, 9, 9, 0]]);
});

test('sideCompass follows rotation and site north', () => {
  assert.deepEqual(F.sideCompass(0, 0), { f: 'S', b: 'N', r: 'E', l: 'W' });
  assert.equal(F.sideCompass(90, 0).f, 'W');
  assert.equal(F.sideCompass(90, 0).r, 'S');
  assert.equal(F.sideCompass(0, 90).f, 'E');
});

test('rotForm90 keeps the same building after w/d swap', () => {
  const b = box({ w: 40, d: 30, f: 3, form: { court: { w: 10, d: 6, ox: 5, oz: 2 }, steps: [{ at: 1, r: 4 }], ch: { r: 2, c: { fr: true, fl: false, bl: false, br: false } }, slope: { a: 10, dir: 'r' } } });
  const r = box({ w: 30, d: 40, f: 3, form: F.rotForm90(b.form) });
  near(F.gfa(r, 4), F.gfa(b, 4));
  assert.equal(r.form.steps[0].f, 4);
  assert.equal(r.form.slope.dir, 'f');
  assert.equal(r.form.ch.c.fl, true);
  // the courtyard centre (5,2) maps to (-2,5)
  const h = F.tiers(r, 4)[0].holeRect;
  near((h.x0 + h.x1) / 2, -2); near((h.z0 + h.z1) / 2, 5);
});
