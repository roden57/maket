(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_ANIM = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Timeline for the massing-evolution film, following the usual order of parti / massing diagrams:
  // title -> site & setbacks -> one scene per massing step (new blocks drop / grow in) ->
  // functional relationships -> climate response -> final orbit.

  const STYLES = ['drop', 'grow', 'fade'];
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const easeInOut = t => { t = clamp01(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  const easeOutCubic = t => 1 - Math.pow(1 - clamp01(t), 3);
  // falls in, hits the ground, two small bounces
  function easeOutBounce(t) {
    t = clamp01(t);
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) { t -= 1.5 / d; return n * t * t + 0.75; }
    if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; }
    t -= 2.625 / d; return n * t * t + 0.984375;
  }

  function opts(o) {
    const s = o && typeof o === 'object' ? o : {};
    return {
      duration: Math.max(8, Math.min(120, Number(s.duration) || 30)),
      style: STYLES.includes(s.style) ? s.style : 'drop',
      intro: s.intro !== false,
      links: s.links !== false,
      climate: s.climate !== false,
      blockTime: Math.max(0.3, Math.min(3, Number(s.blockTime) || 1.1))
    };
  }

  /**
   * steps: [{titleAr,titleEn,highlightIndices:[...]}] (from computeMorphologyEvolution)
   * links: [{a,b,strength}]   allIdx: every block index to show (others stay hidden)
   * staticIdx: indices visible from the start (context, roads, props)
   */
  function buildTimeline(input) {
    const src = input || {};
    const o = opts(src.opts);
    const steps = Array.isArray(src.steps) ? src.steps : [];
    const links = Array.isArray(src.links) ? src.links : [];
    const staticIdx = new Set(src.staticIdx || []);
    const allIdx = (src.allIdx || []).filter(i => !staticIdx.has(i));

    // scene list with relative weights
    const scenes = [];
    if (o.intro) scenes.push({ kind: 'title', w: 1.2, ar: src.titleAr || 'تكوّن الكتلة', en: src.titleEn || 'Massing Evolution' });
    scenes.push({ kind: 'site', w: 1.4, ar: 'الموقع والارتدادات', en: 'Site & setbacks' });
    const seen = new Set();
    steps.forEach((st, si) => {
      const add = (st.highlightIndices || []).filter(i => !seen.has(i) && !staticIdx.has(i));
      add.forEach(i => seen.add(i));
      if (!add.length && si === 0) return; // envelope step: covered by the site scene
      scenes.push({ kind: 'step', w: add.length ? 1 + Math.min(1.2, add.length * 0.12) : 0.8, step: si, add, ar: st.titleAr || '', en: st.titleEn || '', badge: st.metricBadge || '' });
    });
    const rest = allIdx.filter(i => !seen.has(i));
    if (rest.length) scenes.push({ kind: 'step', w: 1, step: -1, add: rest, ar: 'استكمال الكتل', en: 'Remaining masses' });
    if (o.links && links.length) scenes.push({ kind: 'links', w: 1.6, ar: 'العلاقات الوظيفية بين الكتل', en: 'Functional relationships' });
    if (o.climate) scenes.push({ kind: 'climate', w: 1.6, ar: 'الاستجابة للشمس والرياح', en: 'Response to sun & wind' });
    scenes.push({ kind: 'final', w: 1.5, ar: 'الشكل النهائي', en: 'Final massing' });

    const W = scenes.reduce((s, x) => s + x.w, 0);
    let t = 0;
    scenes.forEach(sc => { sc.t0 = t; sc.t1 = t + (sc.w / W) * o.duration; t = sc.t1; });

    // when each block starts arriving: staggered inside its step scene
    const blockStart = {};
    scenes.filter(s => s.kind === 'step').forEach(sc => {
      const span = sc.t1 - sc.t0, n = sc.add.length;
      const len = Math.min(o.blockTime, span * 0.7);
      const gap = n > 1 ? Math.max(0, (span * 0.85 - len) / (n - 1)) : 0;
      sc.add.forEach((i, k) => { blockStart[i] = { t: sc.t0 + k * Math.min(gap, 0.35), len }; });
    });
    return { opts: o, total: o.duration, scenes, blockStart, staticIdx: [...staticIdx] };
  }

  function sceneAt(tl, t) {
    const sc = tl.scenes;
    for (let i = 0; i < sc.length; i++) if (t < sc[i].t1) return { scene: sc[i], index: i, k: clamp01((t - sc[i].t0) / Math.max(1e-6, sc[i].t1 - sc[i].t0)) };
    return { scene: sc[sc.length - 1], index: sc.length - 1, k: 1 };
  }

  /** state of one block at time t: visible, dy (metres above its place), sy (height scale), alpha, fresh (just arrived) */
  function blockState(tl, idx, t, dropHeight) {
    if (tl.staticIdx.includes(idx)) return { visible: true, dy: 0, sy: 1, alpha: 1, fresh: false };
    const bs = tl.blockStart[idx];
    if (!bs || t < bs.t) return { visible: false, dy: 0, sy: 1, alpha: 0, fresh: false };
    const p = clamp01((t - bs.t) / bs.len), H = dropHeight || 30, style = tl.opts.style;
    const fresh = t - bs.t < bs.len + 1.2;
    if (style === 'grow') return { visible: true, dy: 0, sy: Math.max(0.02, easeOutCubic(p)), alpha: 1, fresh };
    if (style === 'fade') return { visible: true, dy: (1 - easeOutCubic(p)) * H * 0.15, sy: 1, alpha: easeOutCubic(p), fresh };
    return { visible: true, dy: (1 - easeOutBounce(p)) * H, sy: 1, alpha: 1, fresh };
  }

  /** how much of link i (of n) is drawn during the links scene and after it (0..1) */
  function linkProgress(tl, t, i, n) {
    const sc = tl.scenes.find(s => s.kind === 'links');
    if (!sc || t < sc.t0) return 0;
    const span = sc.t1 - sc.t0, start = sc.t0 + (n > 1 ? (i / n) * span * 0.6 : 0);
    return clamp01((t - start) / (span * 0.35));
  }

  /** camera turn (radians) from the start angle: slow quarter-turn, then a fuller turn in the final scene */
  function cameraAngle(tl, t) {
    const fin = tl.scenes.find(s => s.kind === 'final');
    const pre = fin ? fin.t0 : tl.total;
    if (t <= pre) return easeInOut(t / Math.max(1e-6, pre)) * Math.PI * 0.5;
    return Math.PI * 0.5 + easeInOut((t - pre) / Math.max(1e-6, tl.total - pre)) * Math.PI * 0.75;
  }

  return { STYLES, buildTimeline, sceneAt, blockState, linkProgress, cameraAngle, easeOutBounce, easeInOut };
});
