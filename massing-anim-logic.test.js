const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('./massing-anim-logic.js');

const steps = [
  { titleAr: 'المحيط', highlightIndices: [] },
  { titleAr: 'بثق', highlightIndices: [0, 1] },
  { titleAr: 'تفريغ', highlightIndices: [0, 1, 2] },
  { titleAr: 'نهائي', highlightIndices: [0, 1, 2, 3] }
];

test('timeline covers the whole duration with scenes in diagram order', () => {
  const tl = A.buildTimeline({ steps, links: [{ a: 0, b: 1 }], allIdx: [0, 1, 2, 3], opts: { duration: 30 } });
  const kinds = tl.scenes.map(s => s.kind);
  assert.deepEqual(kinds, ['title', 'site', 'step', 'step', 'step', 'links', 'climate', 'final']);
  assert.equal(tl.scenes[0].t0, 0);
  assert.ok(Math.abs(tl.scenes[tl.scenes.length - 1].t1 - 30) < 1e-9);
  for (let i = 1; i < tl.scenes.length; i++) assert.ok(Math.abs(tl.scenes[i].t0 - tl.scenes[i - 1].t1) < 1e-9);
});

test('each block arrives once, in the first step that adds it', () => {
  const tl = A.buildTimeline({ steps, allIdx: [0, 1, 2, 3, 4], opts: { duration: 20, links: false, climate: false } });
  const step = tl.scenes.filter(s => s.kind === 'step');
  assert.deepEqual(step.map(s => s.add), [[0, 1], [2], [3], [4]]); // 4 is in no step -> "remaining" scene
  assert.ok(tl.blockStart[0].t < tl.blockStart[2].t);
});

test('drop style: hidden before start, high in the air early, landed at the end', () => {
  const tl = A.buildTimeline({ steps, allIdx: [0, 1, 2, 3], opts: { duration: 30, style: 'drop' } });
  const bs = tl.blockStart[2];
  assert.equal(A.blockState(tl, 2, bs.t - 0.01, 30).visible, false);
  assert.ok(A.blockState(tl, 2, bs.t + 0.01, 30).dy > 25);
  const end = A.blockState(tl, 2, bs.t + bs.len, 30);
  assert.equal(end.visible, true);
  assert.ok(Math.abs(end.dy) < 1e-6);
});

test('grow style scales height from the ground up; static blocks are always shown', () => {
  const tl = A.buildTimeline({ steps, allIdx: [0, 1, 2, 3], staticIdx: [9], opts: { style: 'grow' } });
  const bs = tl.blockStart[0];
  const mid = A.blockState(tl, 0, bs.t + bs.len / 2);
  assert.ok(mid.sy > 0 && mid.sy < 1);
  assert.equal(mid.dy, 0);
  assert.deepEqual(A.blockState(tl, 9, 0), { visible: true, dy: 0, sy: 1, alpha: 1, fresh: false });
});

test('links draw progressively during their scene and stay drawn', () => {
  const tl = A.buildTimeline({ steps, links: [{ a: 0, b: 1 }, { a: 1, b: 2 }], allIdx: [0, 1, 2, 3] });
  const sc = tl.scenes.find(s => s.kind === 'links');
  assert.equal(A.linkProgress(tl, sc.t0 - 0.1, 0, 2), 0);
  assert.equal(A.linkProgress(tl, sc.t1, 0, 2), 1);
  assert.equal(A.linkProgress(tl, tl.total, 1, 2), 1);
});

test('options can drop the intro, links and climate scenes', () => {
  const tl = A.buildTimeline({ steps, links: [{ a: 0, b: 1 }], allIdx: [0, 1, 2, 3], opts: { intro: false, links: false, climate: false } });
  assert.deepEqual(tl.scenes.map(s => s.kind), ['site', 'step', 'step', 'step', 'final']);
  assert.ok(A.cameraAngle(tl, tl.total) > Math.PI);
});
