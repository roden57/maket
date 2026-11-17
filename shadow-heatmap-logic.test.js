const test = require('node:test');
const assert = require('node:assert/strict');
const {
  sunPosition,
  sunDirectionVector,
  getAnnualSunSamples,
  computeAnnualShadowHeatmap,
  sampleColorRamp,
  probeHeatmapAt,
  rampCssGradient
} = require('./shadow-heatmap-logic.js');

test('solar altitude in Baghdad is higher at summer solstice noon than winter solstice noon', () => {
  const summer = sunPosition(33.31, 44.36, 3, 6, 21, 12);
  const winter = sunPosition(33.31, 44.36, 3, 12, 21, 12);
  assert.ok(summer.alt > winter.alt);
  assert.ok(summer.alt * 180 / Math.PI > 75);
  assert.ok(winter.alt * 180 / Math.PI < 38);
});

test('sunDirectionVector respects North offset angle consistently', () => {
  const azSouth = Math.PI; // due South
  const alt = Math.PI / 4;
  const v0 = sunDirectionVector(alt, azSouth, 0);
  // With north = 0, South sun has +Z component and near-zero X
  assert.ok(Math.abs(v0.x) < 1e-6);
  assert.ok(v0.z > 0.5);
  // Rotating North by +90 deg rotates sun vector clockwise around Y
  const v90 = sunDirectionVector(alt, azSouth, 90);
  assert.ok(v90.x < -0.5);
  assert.ok(Math.abs(v90.z) < 1e-6);
});

test('getAnnualSunSamples collects ~4000-4500 annual daylight hours across 12 representative days', () => {
  const { samples, totalDaylightHours } = getAnnualSunSamples({
    lat: 33.31, lon: 44.36, tz: 3, north: 0, stepHours: 0.5
  });
  assert.ok(samples.length > 200);
  assert.ok(totalDaylightHours > 4000 && totalDaylightHours < 4600);
});

test('empty site yields zero shadow accumulation everywhere', () => {
  const res = computeAnnualShadowHeatmap({
    site: { w: 100, d: 100, lat: 33.31, lon: 44.36, tz: 3, north: 0 },
    fh: 4,
    blocks: []
  });
  assert.equal(res.stats.avgRatio, 0);
  assert.equal(res.stats.maxRatio, 0);
  assert.equal(res.stats.heavyArea, 0);
});

test('northern-hemisphere tall opaque tower casts higher annual shadow to its North (-Z) than South (+Z)', () => {
  const res = computeAnnualShadowHeatmap({
    site: { w: 100, d: 100, lat: 33.31, lon: 44.36, tz: 3, north: 0 },
    fh: 4,
    blocks: [
      { shape: 'box', mat: 'stone', x: 0, z: 0, w: 20, d: 10, f: 5, y0: 0 } // 20m tall
    ]
  });
  const northSide = probeHeatmapAt(res, 0, -10);
  const southSide = probeHeatmapAt(res, 0, 10);
  assert.ok(northSide && southSide);
  assert.equal(northSide.inBuilding, false);
  assert.ok(northSide.ratio > southSide.ratio, `Expected north shadow (${northSide.ratio}) > south (${southSide.ratio})`);
  assert.ok(northSide.hours > 1500);
  assert.ok(res.stats.maxRatio <= 1 && res.stats.maxRatio > 0.3);
});

test('overlapping blocks do not double-count shadow hours beyond totalDaylightHours', () => {
  const res = computeAnnualShadowHeatmap({
    site: { w: 80, d: 80, lat: 33.31, lon: 44.36, tz: 3, north: 0 },
    fh: 4,
    blocks: [
      { shape: 'box', mat: 'stone', x: 0, z: 0, w: 20, d: 20, f: 6, y0: 0 },
      { shape: 'box', mat: 'brick', x: 2, z: 2, w: 18, d: 18, f: 6, y0: 0 }
    ]
  });
  for (let i = 0; i < res.shadowRatio.length; i++) {
    assert.ok(res.shadowRatio[i] <= 1.000001);
    assert.ok(res.shadowHours[i] <= res.totalDaylightHours + 1e-3);
  }
});

test('flat slabs, glass blocks, and hidden blocks cast zero shadow', () => {
  const res = computeAnnualShadowHeatmap({
    site: { w: 80, d: 80, lat: 33.31, lon: 44.36, tz: 3, north: 0 },
    fh: 4,
    blocks: [
      { shape: 'box', mat: 'green', x: 0, z: 0, w: 30, d: 30, f: 1, y0: 0 },
      { shape: 'box', mat: 'glass', x: 0, z: 0, w: 16, d: 16, f: 5, y0: 0 },
      { shape: 'box', mat: 'stone', x: 0, z: 0, w: 16, d: 16, f: 5, y0: 0, hidden: true }
    ]
  });
  assert.equal(res.stats.maxRatio, 0);
  assert.equal(res.stats.avgRatio, 0);
});

test('sampleColorRamp and rampCssGradient produce valid outputs', () => {
  const low = sampleColorRamp(0, 'thermal');
  const high = sampleColorRamp(1, 'thermal');
  const cool = sampleColorRamp(0.75, 'cool');
  assert.equal(low.length, 4);
  assert.ok(high[3] > low[3]);
  assert.ok(cool.every(n => n >= 0 && n <= 255));
  assert.ok(rampCssGradient('thermal').startsWith('linear-gradient'));
});
