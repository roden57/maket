const test = require('node:test');
const assert = require('node:assert/strict');
const ANALYSIS = require('./analysis-studio-logic.js');

const DEFAULT_SITE = {
  w: 100,
  d: 100,
  sb: 5,
  north: 0,
  roadW: 18,
  streets: { n: false, s: true, e: false, w: false },
  lat: 33.31,
  lon: 44.36,
  tz: 3,
  wind: 315
};

test('solar analysis detects neighbor shading reduction on low block tucked beside tall tower', () => {
  const blocks = [
    { name: 'Tall South Shield', shape: 'box', mat: 'concrete', fn: 'main', x: 0, z: 14, w: 30, d: 10, f: 8, y0: 0 },
    { name: 'Shaded Wing', shape: 'box', mat: 'brick', fn: 'spec', x: 0, z: 2, w: 14, d: 8, f: 1, y0: 0 },
    { name: 'Open Exposed Wing', shape: 'box', mat: 'brick', fn: 'pub', x: 35, z: -20, w: 14, d: 10, f: 2, y0: 0 }
  ];
  const res = ANALYSIS.computeSolarAnalysis({ blocks, site: DEFAULT_SITE, fh: 4 });
  assert.equal(res.items.length, 3);
  assert.ok(res.byIndex[1].solarScore < res.byIndex[2].solarScore, 'shaded low wing should receive less solar exposure than open wing');
  assert.ok(res.summary.peakSunAltDeg > res.summary.winterSunAltDeg, 'summer noon solar altitude must exceed winter noon');
  assert.equal(res.arcSamples.length, 3);
});

test('wind analysis detects leeward shelter behind windward block and Venturi channeling between parallel wings', () => {
  // Prevailing wind = 0 deg (North -> blowing toward +Z)
  const site = Object.assign({}, DEFAULT_SITE, { wind: 0, north: 0 });
  const blocks = [
    { name: 'Windward Left', shape: 'box', mat: 'brick', fn: 'main', x: -12, z: -20, w: 16, d: 12, f: 5, y0: 0 },
    { name: 'Windward Right', shape: 'box', mat: 'brick', fn: 'main', x: 10, z: -20, w: 16, d: 12, f: 5, y0: 0 }, // gap = (-2) to (+2) => 4m Venturi gap!
    { name: 'Sheltered Rear', shape: 'box', mat: 'stone', fn: 'spec', x: -12, z: 4, w: 12, d: 10, f: 2, y0: 0 }
  ];
  const res = ANALYSIS.computeWindAnalysis({ blocks, site, fh: 4 });
  assert.equal(res.byIndex[2].status, 'sheltered');
  assert.ok(res.byIndex[2].shelterPct >= 45, 'rear low block behind tall windward block should be sheltered');
  assert.ok(res.corridors.length >= 1, 'should detect narrow gap Venturi corridor');
  assert.ok(res.corridors[0].speedFactor > 1.0, 'Venturi corridor should boost speedFactor > 1');
  assert.equal(res.streamlines.length, 7);
});

test('noise analysis models street dBA falloff, building acoustic barrier insertion loss, and sensitive conflicts', () => {
  // Street only on South (+Z = +54), roadW = 24
  const site = Object.assign({}, DEFAULT_SITE, { roadW: 24, streets: { n: false, s: true, e: false, w: false } });
  const blocks = [
    { name: 'Noisy Spec Front', shape: 'box', mat: 'stone', fn: 'spec', x: 0, z: 40, w: 40, d: 10, f: 4, y0: 0 },
    { name: 'Quiet Screened Rear', shape: 'box', mat: 'white', fn: 'main', x: 0, z: -25, w: 20, d: 10, f: 2, y0: 0 }
  ];
  const res = ANALYSIS.computeNoiseAnalysis({ blocks, site, fh: 4 });
  assert.ok(res.byIndex[0].peakDb > res.byIndex[1].peakDb + 8, 'front block on wide street must be much louder than screened rear block');
  assert.equal(res.byIndex[0].zone, 'noisy');
  assert.equal(res.conflicts.length, 1, 'sensitive spec block facing loud street triggers acoustic conflict');
  assert.equal(res.dbGrid.length, res.cols * res.rows);
});

test('zoning & bubble diagram aggregates zones, detects direct adjacencies, and separates SVG bubbles cleanly', () => {
  const blocks = [
    { name: 'Plaza', mat: 'paving', x: 0, z: 26, w: 30, d: 12, f: 1 },
    { name: 'Lobby', shape: 'box', mat: 'white', fn: 'pub', x: 0, z: 14, w: 28, d: 10, f: 2 },
    { name: 'Core', shape: 'box', mat: 'joint', fn: 'circ', x: 0, z: 7, w: 8, d: 6, f: 4 },
    { name: 'Main Hall', shape: 'box', mat: 'stone', fn: 'main', x: -16, z: -6, w: 20, d: 16, f: 3 },
    { name: 'Lab Wing', shape: 'box', mat: 'brick', fn: 'spec', x: 18, z: -6, w: 20, d: 16, f: 3 }
  ];
  const res = ANALYSIS.computeZoningAndBubbles({ blocks, fh: 4 });
  assert.ok(res.nodes.length === 5);
  assert.ok(res.strongLinkCount >= 2, 'Plaza-Lobby and Lobby-Core should form strong direct adjacency links');
  assert.ok(res.bubblesByMass.every(b => Number.isFinite(b.bx) && Number.isFinite(b.by) && b.br > 0));
  // Ensure bubbles do not sit on top of each other after relaxation
  for (let i = 0; i < res.bubblesByZone.length; i++) {
    for (let j = i + 1; j < res.bubblesByZone.length; j++) {
      const a = res.bubblesByZone[i], b = res.bubblesByZone[j];
      const dist = Math.hypot(a.bx - b.bx, a.by - b.by);
      assert.ok(dist >= (a.br + b.br) * 0.9, 'zone bubbles should remain separated for readable labels');
    }
  }
});

test('morphology evolution classifies Courtyard vs Tower-Podium partis and generates adaptive formation steps', () => {
  const courtyardBlocks = [
    { name: 'Courtyard', mat: 'green', x: 0, z: 0, w: 30, d: 22, f: 1 },
    { name: 'Riwaq', shape: 'riwaq', mat: 'white', x: 0, z: 0, w: 29, d: 21, f: 1 },
    { name: 'Main Wing', mat: 'stone', fn: 'main', x: -23, z: 0, w: 14, d: 38, f: 3 },
    { name: 'Spec Wing', mat: 'brick', fn: 'spec', x: 23, z: 0, w: 14, d: 38, f: 3 },
    { name: 'Joint 1', mat: 'joint', fn: 'circ', x: -14, z: 15, w: 7, d: 9, f: 4 }
  ];
  const m1 = ANALYSIS.computeMorphologyEvolution({ blocks: courtyardBlocks, site: DEFAULT_SITE, fh: 4 });
  assert.equal(m1.partiId, 'courtyard');
  assert.ok(m1.steps.some(s => s.op === 'carve'), 'courtyard parti includes void carving step');
  assert.ok(m1.steps.some(s => s.op === 'join'), 'courtyard parti includes circulation joints step');

  const towerBlocks = [
    { name: 'Podium', mat: 'stone', fn: 'pub', x: 0, z: 0, w: 54, d: 30, f: 2, y0: 0 },
    { name: 'Tower', mat: 'white', fn: 'main', x: 8, z: 0, w: 22, d: 18, f: 8, y0: 8 }
  ];
  const m2 = ANALYSIS.computeMorphologyEvolution({ blocks: towerBlocks, site: DEFAULT_SITE, fh: 4 });
  assert.equal(m2.partiId, 'tower-podium');
  assert.ok(m2.steps.some(s => s.op === 'stack'), 'tower-podium parti includes vertical stacking step');
});
