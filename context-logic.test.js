const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('./context-logic.js');

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const site = { w: 100, d: 80, roadW: 12, streets: { n: false, s: true, e: false, w: false } };

test('quick neighbour sits just outside the plot, across the street when there is one', () => {
  const [n] = C.quickBlocks({ site, side: 'n', front: 20, depth: 10, floors: 4 });
  near(n.z, -40 - 5); near(n.x, 0);
  assert.equal(n.mat, 'context'); assert.equal(n.f, 4);
  const [s] = C.quickBlocks({ site, side: 's', front: 20, depth: 10, floors: 2 });
  near(s.z, 40 + 12 + 5);
  const [e] = C.quickBlocks({ site, side: 'e', front: 30, depth: 8 });
  near(e.x, 50 + 4); assert.equal(e.d, 30); assert.equal(e.w, 8);
});

test('quick neighbour takes the next free slot, fill covers the side without overlaps', () => {
  const first = C.quickBlocks({ site, side: 'n', front: 20, depth: 10 })[0];
  const second = C.quickBlocks({ site, side: 'n', front: 20, depth: 10, blocks: [first] })[0];
  assert.ok(Math.abs(second.x - first.x) >= 20 - 1e-6);
  const row = C.quickBlocks({ site, side: 'w', front: 15, depth: 10, fill: true });
  assert.equal(row.length, Math.floor(80 / 15));
  for (let i = 1; i < row.length; i++) assert.ok(row[i].z - row[i - 1].z >= 15 - 1e-6);
});

test('projector: north is -z, east is +x, and the north angle rotates both', () => {
  const P = C.projector(33.35, 44.38, 0);
  const [xN, zN] = P(33.35 + 0.001, 44.38);
  near(xN, 0); near(zN, -110.574, 1e-3);
  const [xE, zE] = P(33.35, 44.38 + 0.001);
  assert.ok(xE > 92 && xE < 94); near(zE, 0);
  const R = C.projector(33.35, 44.38, 90);
  const [x2, z2] = R(33.35 + 0.001, 44.38); // true north points to scene +x when north = 90
  near(x2, 110.574, 1e-3); near(z2, 0, 1e-9);
});

test('parseLatLon accepts Google Maps style pairs', () => {
  assert.deepEqual(C.parseLatLon('33.35712, 44.38359'), { lat: 33.35712, lon: 44.38359 });
  assert.deepEqual(C.parseLatLon('33.35712 44.38359'), { lat: 33.35712, lon: 44.38359 });
  assert.equal(C.parseLatLon('hello'), null);
  assert.equal(C.parseLatLon('120, 44'), null);
});

test('parseHeight: height tag, levels, otherwise estimate', () => {
  assert.deepEqual(C.parseHeight({ height: '12.5 m' }), { h: 12.5, src: 'height' });
  assert.deepEqual(C.parseHeight({ 'building:levels': '3' }), { lv: 3, src: 'levels' });
  assert.equal(C.parseHeight({ building: 'yes' }), null);
});

const sq = (lat, lon, dLat, dLon) => [
  { lat, lon }, { lat, lon: lon + dLon }, { lat: lat + dLat, lon: lon + dLon }, { lat: lat + dLat, lon }, { lat, lon }
];

test('parseOSM + toBlocks: ways and multipolygons become context polygons with floors', () => {
  const lat = 33.35, lon = 44.38;
  const json = { elements: [
    { type: 'way', id: 1, tags: { building: 'yes', 'building:levels': '4' }, geometry: sq(lat + 0.001, lon, 0.0002, 0.0002) },
    { type: 'way', id: 2, tags: { building: 'yes' }, geometry: sq(lat - 0.001, lon + 0.001, 0.0001, 0.0001) },
    { type: 'way', id: 3, tags: { building: 'yes', height: '20' }, geometry: sq(lat - 0.00005, lon - 0.00005, 0.0001, 0.0001) }, // on the plot
    { type: 'relation', id: 9, tags: { building: 'yes', type: 'multipolygon' }, members: [
      { type: 'way', role: 'outer', geometry: sq(lat + 0.002, lon + 0.002, 0.0002, 0.0002).slice(0, 3) },
      { type: 'way', role: 'outer', geometry: sq(lat + 0.002, lon + 0.002, 0.0002, 0.0002).slice(2) }
    ] },
    { type: 'way', id: 4, tags: { building: 'shed' }, geometry: sq(lat + 0.003, lon, 0.00002, 0.00002) } // tiny
  ] };
  const B = C.parseOSM(json, { lat, lon, north: 0 });
  assert.equal(B.length, 5);
  const rel = B.find(b => b.id === 'r9');
  assert.ok(rel && rel.ring.length === 4);
  const r = C.toBlocks(B, { fh: 4, defFloors: 2, site: { w: 100, d: 80 }, skipSite: true, minArea: 15 });
  assert.equal(r.skipped.site, 1); assert.equal(r.skipped.small, 1);
  assert.equal(r.blocks.length, 3);
  const w1 = r.blocks.find(b => b.osm === 'w1');
  assert.equal(w1.f, 4); assert.equal(w1.est, false); assert.equal(w1.shape, 'poly'); assert.equal(w1.mat, 'context');
  assert.ok(w1.z < -100); // north of the site
  const w2 = r.blocks.find(b => b.osm === 'w2');
  assert.equal(w2.f, 2); assert.equal(w2.est, true);
  const keep = C.toBlocks(B, { fh: 4, site: { w: 100, d: 80 }, skipSite: false });
  assert.equal(keep.blocks.find(b => b.osm === 'w3').f, 5); // 20 m / 4 m
});

test('cleanRing drops duplicates and collinear points', () => {
  const R = C.cleanRing([[0, 0], [5, 0], [10, 0], [10, 0.1], [10, 10], [0, 10], [0, 0]]);
  assert.equal(R.length, 4);
});

test('overpassQuery and extent', () => {
  const q = C.overpassQuery(33.35, 44.38, 150);
  assert.ok(q.includes('around:150,33.350000,44.380000') && q.includes('out geom'));
  assert.equal(C.extent([{ x: 120, z: 0, w: 10, d: 10 }, { x: 0, z: 0, w: 4, d: 4, hidden: true }], 60), 125);
  assert.deepEqual(C.summary([{ mat: 'context', ctx: 'osm', est: true }, { mat: 'brick' }]), { total: 1, osm: 1, estimated: 1, hidden: 0 });
});
