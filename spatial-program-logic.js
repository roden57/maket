(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_SPROG = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Spatial program & area schedule: one target (gross m²) per function, compared live with what is drawn.
  // Built area of a block = footprint area × floors (the same rule the app uses for GFA / FAR).
  const OK_LOW = 95, OK_HIGH = 105;
  const PALETTE = ['#0EA5E9', '#DB2777', '#65A30D', '#9333EA', '#EA580C', '#0891B2', '#CA8A04', '#4F46E5'];

  const num = (v, fb) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
  const round10 = v => Math.round(v / 10) * 10;

  /** default schedule from the app's functions: [{key,name,color,net}] and the net→gross efficiency */
  function defaultProgram(fns, eff) {
    const e = Math.max(0.3, Math.min(1, num(eff, 0.8)));
    return (fns || []).filter(f => f && f.key).map(f => ({
      id: f.key, fn: f.key, name: String(f.name || f.key), color: f.color || '#94A3B8',
      targetArea: Math.max(0, round10(num(f.net, 0) / e))
    }));
  }

  /** keeps only well-formed entries; ids unique */
  function normalizeProgram(raw) {
    const seen = new Set(), out = [];
    (Array.isArray(raw) ? raw : []).forEach(p => {
      if (!p || typeof p !== 'object') return;
      const id = String(p.id || p.fn || '').trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      out.push({
        id, fn: String(p.fn || id), name: String(p.name || id).slice(0, 60),
        color: /^#[0-9a-f]{6}$/i.test(p.color || '') ? p.color : '#94A3B8',
        targetArea: Math.max(0, Math.round(num(p.targetArea, 0))),
        custom: !!p.custom
      });
    });
    return out;
  }

  function status(pct, target, built) {
    if (!(target > 0)) return built > 0 ? 'over' : 'none';
    if (pct < OK_LOW) return 'under';
    if (pct <= OK_HIGH) return 'ok';
    return 'over';
  }

  /**
   * blocks: model blocks; program: normalized schedule; area(b): footprint m²; counts(b): counts toward floor area
   * returns rows per program entry, an 'unassigned' bucket (blocks whose function is not in the program) and totals
   */
  function computeStatus({ blocks, program, area, counts }) {
    const A = typeof area === 'function' ? area : (b => num(b.w, 0) * num(b.d, 0));
    const C = typeof counts === 'function' ? counts : (b => !b.hidden);
    const prog = normalizeProgram(program);
    const by = {}, nBy = {};
    let unassigned = 0, unassignedN = 0;
    (Array.isArray(blocks) ? blocks : []).forEach(b => {
      if (!b || b.hidden || !C(b)) return;
      const built = A(b) * Math.max(1, Math.round(num(b.f, 1)));
      const fn = b.fn || '';
      if (prog.some(p => p.fn === fn)) { by[fn] = (by[fn] || 0) + built; nBy[fn] = (nBy[fn] || 0) + 1; }
      else { unassigned += built; unassignedN++; }
    });
    const rows = prog.map(p => {
      const built = Math.round(by[p.fn] || 0), pct = p.targetArea > 0 ? (built / p.targetArea) * 100 : 0;
      return Object.assign({}, p, { built, blocks: nBy[p.fn] || 0, pct: Math.round(pct * 10) / 10, status: status(pct, p.targetArea, built) });
    });
    const target = rows.reduce((s, r) => s + r.targetArea, 0);
    const built = rows.reduce((s, r) => s + r.built, 0) + Math.round(unassigned);
    const pct = target > 0 ? Math.round((built / target) * 1000) / 10 : 0;
    return { rows, unassigned: { built: Math.round(unassigned), blocks: unassignedN }, totals: { target, built, pct, status: status(pct, target, built) } };
  }

  /** next id / colour for a user-added function */
  function newCustom(program, name) {
    const prog = normalizeProgram(program);
    let k = 1; while (prog.some(p => p.id === 'u' + k)) k++;
    const used = new Set(prog.map(p => p.color.toUpperCase()));
    const color = PALETTE.find(c => !used.has(c)) || PALETTE[k % PALETTE.length];
    return { id: 'u' + k, fn: 'u' + k, name: String(name || ('وظيفة ' + k)).slice(0, 60), color, targetArea: 0, custom: true };
  }

  return { OK_LOW, OK_HIGH, defaultProgram, normalizeProgram, computeStatus, newCustom, status };
});
