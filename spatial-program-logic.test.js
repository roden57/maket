const test = require('node:test');
const assert = require('node:assert/strict');
const SP = require('./spatial-program-logic.js');

const box = o => Object.assign({ shape: 'box', mat: 'brick', fn: 'main', x: 0, z: 0, w: 10, d: 10, f: 1 }, o);
const prog = [
  { id: 'main', fn: 'main', name: 'Teaching', color: '#2563EB', targetArea: 1000 },
  { id: 'adm', fn: 'adm', name: 'Admin', color: '#64748B', targetArea: 400 }
];

test('built area = footprint × floors, grouped by function', () => {
  const r = SP.computeStatus({ blocks: [box({ w: 20, d: 25, f: 2 }), box({ fn: 'adm', w: 10, d: 10, f: 4 })], program: prog });
  assert.equal(r.rows[0].built, 1000);
  assert.equal(r.rows[1].built, 400);
  assert.equal(r.totals.target, 1400);
  assert.equal(r.totals.built, 1400);
});

test('status thresholds: under < 95 %, ok 95–105 %, over > 105 %', () => {
  const at = a => SP.computeStatus({ blocks: [box({ w: a, d: 10 })], program: [prog[0]] }).rows[0].status;
  assert.equal(at(94), 'under');   // 940 m² = 94 %
  assert.equal(at(95), 'ok');      // 95 %
  assert.equal(at(105), 'ok');     // 105 %
  assert.equal(at(106), 'over');   // 106 %
});

test('hidden blocks and blocks the app does not count are ignored; unknown functions go to unassigned', () => {
  const r = SP.computeStatus({
    blocks: [box({ hidden: true }), box({ mat: 'green' }), box({ fn: '' , w: 5, d: 4 })],
    program: prog, counts: b => b.mat !== 'green'
  });
  assert.equal(r.rows[0].built, 0);
  assert.equal(r.unassigned.built, 20);
  assert.equal(r.unassigned.blocks, 1);
});

test('custom area function (e.g. courtyard footprint) is used', () => {
  const r = SP.computeStatus({ blocks: [box({ w: 20, d: 20, f: 2 })], program: prog, area: () => 300 });
  assert.equal(r.rows[0].built, 600);
});

test('default schedule converts net program areas to gross with the efficiency', () => {
  const d = SP.defaultProgram([{ key: 'main', name: 'Teaching', color: '#2563EB', net: 1020 }, { key: '', name: 'none' }], 0.8);
  assert.equal(d.length, 1);
  assert.equal(d[0].targetArea, 1280); // 1020 / 0.8 = 1275 → nearest 10
});

test('normalize drops bad entries and duplicates; newCustom gets a fresh id and unused colour', () => {
  const n = SP.normalizeProgram([prog[0], prog[0], null, { name: 'x' }, { id: 'adm', targetArea: -5, color: 'red' }]);
  assert.deepEqual(n.map(p => p.id), ['main', 'adm']);
  assert.equal(n[1].targetArea, 0);
  assert.equal(n[1].color, '#94A3B8');
  const c = SP.newCustom(n.concat([{ id: 'u1', fn: 'u1', name: 'Lab', color: '#0EA5E9' }]), 'Cafe');
  assert.equal(c.id, 'u2');
  assert.equal(c.custom, true);
  assert.notEqual(c.color, '#0EA5E9');
});

test('a function with no target but drawn area counts as over; empty one as none', () => {
  const r = SP.computeStatus({ blocks: [box({ fn: 'adm' })], program: [{ id: 'adm', fn: 'adm', name: 'A', targetArea: 0 }, { id: 'main', fn: 'main', name: 'M', targetArea: 0 }] });
  assert.equal(r.rows[0].status, 'over');
  assert.equal(r.rows[1].status, 'none');
});

test('computeStatus uses gfa(b) when given (formed blocks)', () => {
  const r = SP.computeStatus({ blocks: [box({ f: 3 })], program: prog, area: b => b.w * b.d, gfa: () => 250, counts: () => true });
  assert.equal(r.rows.find(x => x.fn === 'main').built, 250);
});
