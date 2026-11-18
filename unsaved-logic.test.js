const test = require('node:test');
const assert = require('node:assert/strict');
const {
  stableStringify,
  serializeModelSnapshot,
  createUnsavedTracker
} = require('./unsaved-logic.js');

function sampleState() {
  return {
    v: 9,
    fh: 4,
    site: { w: 100, d: 100, sb: 5, north: 0, city: 'baghdad' },
    meta: { title: 'Test Project', designer: 'Architect', org: '', location: '' },
    blocks: [
      { id: 'k0', name: 'Block A', shape: 'box', mat: 'brick', fn: 'main', x: 0, z: 0, w: 12, d: 10, f: 3, y0: 0, ry: 0, rot: 0 }
    ],
    sun: { on: false, date: '2026-06-21', hour: 14 },
    img: null
  };
}

test('stableStringify produces identical output regardless of object key order', () => {
  const a = { b: 2, a: 1, nested: { z: true, y: [3, 1] } };
  const b = { nested: { y: [3, 1], z: true }, a: 1, b: 2 };
  assert.equal(stableStringify(a), stableStringify(b));
});

test('tracker reports clean immediately after markClean and ignores key reordering', () => {
  const tracker = createUnsavedTracker();
  const s1 = sampleState();
  tracker.markClean(s1, 'Design 1');

  const reordered = {
    sun: { hour: 14, date: '2026-06-21', on: false },
    blocks: [{ rot: 0, ry: 0, y0: 0, f: 3, d: 10, w: 12, z: 0, x: 0, fn: 'main', mat: 'brick', shape: 'box', name: 'Block A', id: 'k0' }],
    img: null,
    meta: { location: '', org: '', designer: 'Architect', title: 'Test Project' },
    site: { city: 'baghdad', north: 0, sb: 5, d: 100, w: 100 },
    fh: 4,
    v: 9
  };

  assert.equal(tracker.hasUnsavedChanges(reordered, 'Design 1', false), false);

  const ev = { defaultPrevented: false, returnValue: undefined, preventDefault() { this.defaultPrevented = true; } };
  assert.equal(tracker.handleBeforeUnload(ev, reordered, 'Design 1', false), false);
  assert.equal(ev.defaultPrevented, false);
  assert.equal(ev.returnValue, undefined);
});

test('tracker detects model modifications across blocks, site, floors, and name, and triggers beforeunload', () => {
  const tracker = createUnsavedTracker();
  const state = sampleState();
  tracker.markClean(state, 'Design 1');

  // Modify block floors
  state.blocks[0].f = 4;
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), true);

  const ev = { defaultPrevented: false, returnValue: undefined, preventDefault() { this.defaultPrevented = true; } };
  const warned = tracker.handleBeforeUnload(ev, state, 'Design 1', false);
  assert.equal(warned, true);
  assert.equal(ev.defaultPrevented, true);
  assert.equal(ev.returnValue, '');

  // Undo back to original clean state clears dirty automatically
  state.blocks[0].f = 3;
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), false);

  // Site mutation triggers dirty
  state.site.w = 120;
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), true);

  // Explicit save marks clean again
  tracker.markClean(state, 'Design 1');
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), false);
});

test('tracker warns during active canvas gestures, failed local saves, or pending sync, and honors unload suppression', () => {
  const tracker = createUnsavedTracker();
  const state = sampleState();
  tracker.markClean(state, 'Design 1');

  // Active gesture while coordinates haven't settled
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', true), true);

  // Storage full failure
  tracker.setLocalSaveStatus({ pending: false, ok: false });
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), true);
  tracker.setLocalSaveStatus({ pending: false, ok: true });
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), false);

  // Pending cloud sync
  tracker.setCloudStatus({ pending: true });
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), true);
  tracker.setCloudStatus({ pending: false });
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), false);

  // Programmatic reload suppression (e.g. logout / account switch)
  state.blocks.push({ id: 'k1', name: 'Block B', shape: 'box', mat: 'stone', fn: 'pub', x: 10, z: 10, w: 8, d: 8, f: 2, y0: 0, ry: 0, rot: 0 });
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), true);
  tracker.suppressNextUnload();
  const ev = { defaultPrevented: false, returnValue: undefined, preventDefault() { this.defaultPrevented = true; } };
  assert.equal(tracker.handleBeforeUnload(ev, state, 'Design 1', false), false);
  assert.equal(ev.defaultPrevented, false);
  tracker.clearSuppression();
  assert.equal(tracker.hasUnsavedChanges(state, 'Design 1', false), true);
});
