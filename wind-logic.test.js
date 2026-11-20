const test = require('node:test');
const assert = require('node:assert/strict');
const WD = require('./wind-logic.js');

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const rect = (id, x, z, w, d, h, extra) => Object.assign({ id, name: id, rings: [[[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]]], h, y0: 0 }, extra);

test('frame: a north wind blows toward the south (+z); the north angle rotates it', () => {
  const F = WD.frame(0, 0);
  near(F.flow.x, 0); near(F.flow.z, 1);
  const G = WD.frame(0, 90); // true north is scene +x
  near(G.flow.x, -1); near(G.flow.z, 0, 1e-12);
  const NW = WD.frame(315, 0);
  assert.ok(NW.flow.x > 0 && NW.flow.z > 0); // from the north-west toward the south-east
});

test('dirName and rose', () => {
  assert.equal(WD.dirName(315), 'شمالية غربية');
  assert.equal(WD.dirName(90, true), 'East');
  const R = WD.rose(315);
  assert.equal(R.length, 16);
  const top = R.reduce((a, b) => (b.f > a.f ? b : a));
  assert.equal(top.deg, 315); assert.equal(top.f, 1);
  const opp = R.find(p => p.deg === 135), side = R.find(p => p.deg === 45);
  assert.ok(opp.f > side.f && opp.f < 0.5);
});

test('wake sits downwind, scales with height and stays a closed polygon', () => {
  const Z = WD.zones([rect('a', 0, 0, 20, 10, 12)], { windDeg: 0, north: 0 });
  assert.equal(Z.wakes.length, 1);
  const w = Z.wakes[0];
  near(w.len, 12 * Math.min(3.5, 2 + 0.25 * 20 / 12));
  const zs = w.poly.map(p => p[1]);
  near(Math.min(...zs), 5); near(Math.max(...zs), 5 + w.len);
  const tall = WD.zones([rect('a', 0, 0, 20, 10, 24)], { windDeg: 0 }).wakes[0];
  assert.ok(tall.len > w.len);
});

test('channel between two masses side by side, none when the gap is too wide or they are in line', () => {
  const Z = WD.zones([rect('a', -10, 0, 12, 20, 15), rect('b', 10, 0, 12, 20, 15)], { windDeg: 0 });
  assert.equal(Z.channels.length, 1);
  const c = Z.channels[0];
  near(c.gap, 8); near(c.cx, 0); assert.ok(c.factor > 1 && c.factor <= 1.6);
  const wide = WD.zones([rect('a', -40, 0, 12, 20, 6), rect('b', 40, 0, 12, 20, 6)], { windDeg: 0 });
  assert.equal(wide.channels.length, 0);
  const inline = WD.zones([rect('a', 0, -20, 12, 10, 15), rect('b', 0, 20, 12, 10, 15)], { windDeg: 0 });
  assert.equal(inline.channels.length, 0);
});

test('corner streams only for tall masses; raised and flat masses are ignored', () => {
  assert.equal(WD.zones([rect('a', 0, 0, 20, 20, 8)], { windDeg: 0 }).corners.length, 0);
  assert.equal(WD.zones([rect('a', 0, 0, 20, 20, 20)], { windDeg: 0 }).corners.length, 2);
  const Z = WD.zones([rect('a', 0, 0, 20, 20, 20, { y0: 8 }), rect('b', 50, 0, 10, 10, 1)], { windDeg: 0 });
  assert.equal(Z.wakes.length, 0);
});

test('no channel or corner stream where a third mass blocks it', () => {
  const pair = [rect('a', -10, 0, 12, 20, 15), rect('b', 10, 0, 12, 20, 15)];
  const Z = WD.zones(pair.concat([rect('c', 0, 0, 6, 10, 6)]), { windDeg: 0 });
  assert.equal(Z.channels.length, 0);
  const tower = rect('t', 0, 0, 20, 20, 30);
  const free = WD.zones([tower], { windDeg: 0 }).corners.length;
  const side = WD.zones([tower, rect('n', 16, 0, 8, 20, 6)], { windDeg: 0 }).corners.length;
  assert.equal(free, 2); assert.equal(side, 1);
});

test('a mass at 45° to the wind: the wake starts at its back corner, corner streams at its side corners', () => {
  const d = 10 / Math.SQRT2; // a 10×10 square seen as a diamond by a north wind
  const diamond = { id: 'd', rings: [[[0, -d * 1.0], [d, 0], [0, d], [-d, 0]].map(([x, z]) => [x, z])], h: 20, y0: 0 };
  const Z = WD.zones([diamond], { windDeg: 0 });
  const zs = Z.wakes[0].poly.map(p => p[1]);
  near(Math.min(...zs), 0, 1e-2); // side corners at z = 0, back corner at z = d
  Z.corners.forEach(c => near(c.poly[0][1], 0, 1e-2));
});

test('the speed-up tail stops before a mass standing downstream of the gap', () => {
  const pair = [rect('a', -10, 0, 12, 20, 15), rect('b', 10, 0, 12, 20, 15)];
  const free = WD.zones(pair, { windDeg: 0 }).channels[0];
  const short = WD.zones(pair.concat([rect('c', 0, 16, 10, 4, 6)]), { windDeg: 0 }).channels[0];
  const end = c => Math.max(...c.poly.map(p => p[1]));
  assert.ok(end(free) > 18 && end(short) <= 14 + 1e-6 && end(short) > 10, `${end(free)} / ${end(short)}`);
});
