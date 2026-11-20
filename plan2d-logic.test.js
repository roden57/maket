const test = require('node:test');
const assert = require('node:assert/strict');
const P2 = require('./plan2d-logic.js');

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const site = { w: 100, d: 80, sb: 5, north: 0 };
const box = (code, x, z, w, d, rot, extra) => {
  const c = P2.corners({ x, z, w, d, rot });
  return Object.assign({ code, label: 'كتلة ' + code, kind: 'own', rings: [[c.bl, c.br, c.fr, c.fl]], frame: { x, z, w, d, rot }, floors: 3, top: 12 }, extra);
};

test('site boundary, setback and overall site dimensions', () => {
  const plan = P2.build({ site, items: [] });
  const dims = plan.prims.filter(p => p.t === 'dim');
  assert.deepEqual(dims.map(d => d.text), ['100.0', '80.0']);
  assert.ok(plan.prims.some(p => p.layer === 'SETBACK' && p.dash));
});

test('each own mass gets width and depth dimensions, rotated with it; neighbours get none', () => {
  const plan = P2.build({ site, items: [box('B01', 0, 0, 30, 12, 30), box('C1', 60, 0, 10, 10, 0, { kind: 'ctx' })] });
  const dims = plan.prims.filter(p => p.t === 'dim').slice(2);
  assert.deepEqual(dims.map(d => d.text), ['30.0', '12.0']);
  const g = P2.dimGeom(dims[0]);
  near(Math.abs(g.ang), 30, 1e-6);
  assert.ok(plan.prims.some(p => p.t === 'text' && p.s.includes('B01 · 3F · +12.0')));
});

test('a rectangular courtyard is dimensioned inside the void', () => {
  const it = box('B02', 0, 0, 40, 30, 0);
  it.rings.push([[-8, -6], [8, -6], [8, 6], [-8, 6]]);
  const plan = P2.build({ site, items: [it] });
  const dims = plan.prims.filter(p => p.t === 'dim').slice(4);
  assert.deepEqual(dims.map(d => d.text), ['16.0', '12.0']);
  dims.forEach(d => { const g = P2.dimGeom(d); assert.ok(Math.abs(g.tx) < 8 && Math.abs(g.tz) < 6); });
  assert.ok(plan.prims.some(p => p.layer === 'COURTYARD'));
});

test('SVG is to scale and DXF dims are LINE + TEXT on layer DIMS', () => {
  const plan = P2.build({ site, items: [box('B01', 0, 0, 30, 12, 0)] });
  const s = P2.fitScale(plan);
  assert.equal(s, 500);
  const svg = P2.toSVG(plan, { scale: 500, title: 'مشروع' });
  const w = parseFloat(svg.match(/width="([\d.]+)mm"/)[1]);
  near(w, (plan.bounds.x1 - plan.bounds.x0) * 2, 1e-6); // 1:500 → 2 mm per metre
  assert.ok(svg.includes('1:500') && svg.includes('100.0'));
  const dxf = P2.dimsToDXF(plan);
  assert.ok(/0\nLINE\n8\nDIMS/.test(dxf) && /0\nTEXT\n8\nDIMS[\s\S]*\n1\n30\.0\n/.test(dxf));
});

test('overlapping masses are filled one by one (no even-odd holes between different masses)', () => {
  const svg = P2.toSVG(P2.build({ site, items: [box('B01', 0, 0, 20, 20, 0), box('B02', 5, 5, 20, 20, 0)] }), { scale: 500 });
  const fills = svg.match(/fill="#e5e7eb"/g) || [];
  assert.equal(fills.length, 2);
});
