(function(root) {
  'use strict';

  const PALETTE_KEY = 'mc3d_palette';
  const L = (ar, en) => (root.L ? root.L(ar, en) : ar);

  const ZONE_ORDER = ['main', 'pub', 'spec', 'adm', 'circ', ''];
  const ZONE_FALLBACK = {
    main: { ar: 'فضاءات رئيسية', en: 'Primary Spaces' },
    pub: { ar: 'عام واستقبال', en: 'Public & Lobby' },
    spec: { ar: 'تخصصي / خاص', en: 'Specialized Zone' },
    adm: { ar: 'إدارة وخدمات', en: 'Admin & Services' },
    circ: { ar: 'حركة ومفاصل', en: 'Circulation & Cores' },
    '': { ar: 'غير محدد', en: 'Unassigned' }
  };

  let currentMode = 'site';
  let hoveredKey = null;
  let lastPayload = null;
  let paletteOpen = false;
  let onPaletteChangeCb = null;
  let palette = loadPalette();

  function loadPalette() {
    const areasMod = root.MC3D_AREAS;
    if (!areasMod) {
      return {
        occupied: '#1e40af',
        unoccupied: '#cbd5e1',
        zones: { main: '#2563eb', pub: '#0d9488', spec: '#d97706', adm: '#64748b', circ: '#7c3aed', '': '#94a3b8' }
      };
    }
    try {
      const raw = root.localStorage && root.localStorage.getItem(PALETTE_KEY);
      if (raw) return areasMod.mergePalette(areasMod.DEFAULT_PALETTE, JSON.parse(raw));
    } catch (e) {}
    return areasMod.mergePalette(areasMod.DEFAULT_PALETTE, null);
  }

  function savePalette(p) {
    try {
      if (root.localStorage) root.localStorage.setItem(PALETTE_KEY, JSON.stringify(p));
    } catch (e) {}
  }

  function getZoneLabel(key) {
    if (root.MC3D_I18N && typeof root.MC3D_I18N.dn === 'function') {
      const fb = (ZONE_FALLBACK[key] && ZONE_FALLBACK[key].ar) || key;
      return root.MC3D_I18N.dn('fns', key, fb);
    }
    const pair = ZONE_FALLBACK[key] || { ar: key, en: key };
    return L(pair.ar, pair.en);
  }

  function formatArea(v) {
    return Math.round(v).toLocaleString('en');
  }

  function formatPct(p) {
    if (!Number.isFinite(p) || p <= 0) return '0%';
    if (p > 0 && p < 1) return '<1%';
    return Math.round(p) + '%';
  }

  function palettesEqual(a, b) {
    if (!a || !b) return false;
    if ((a.occupied || '').toLowerCase() !== (b.occupied || '').toLowerCase()) return false;
    if ((a.unoccupied || '').toLowerCase() !== (b.unoccupied || '').toLowerCase()) return false;
    return ZONE_ORDER.every(k => ((a.zones && a.zones[k]) || '').toLowerCase() === ((b.zones && b.zones[k]) || '').toLowerCase());
  }

  function notifyPaletteChange() {
    savePalette(palette);
    if (typeof onPaletteChangeCb === 'function') {
      onPaletteChangeCb(getPalette());
    }
    renderPaletteControls();
    render();
  }

  function getPalette() {
    const areasMod = root.MC3D_AREAS;
    return areasMod ? areasMod.mergePalette(areasMod.DEFAULT_PALETTE, palette) : JSON.parse(JSON.stringify(palette));
  }

  function setZoneColor(key, hex) {
    const areasMod = root.MC3D_AREAS;
    if (!areasMod || !areasMod.isValidHex(hex)) return;
    palette = areasMod.mergePalette(palette, { zones: { [key]: hex } });
    notifyPaletteChange();
  }

  function setOccupancyColor(which, hex) {
    const areasMod = root.MC3D_AREAS;
    if (!areasMod || !areasMod.isValidHex(hex)) return;
    if (which !== 'occupied' && which !== 'unoccupied') return;
    palette = areasMod.mergePalette(palette, { [which]: hex });
    notifyPaletteChange();
  }

  function applyPreset(presetId) {
    const areasMod = root.MC3D_AREAS;
    if (!areasMod) return;
    const found = (areasMod.PALETTE_PRESETS || []).find(pr => pr.id === presetId);
    if (!found) return;
    palette = areasMod.mergePalette(areasMod.DEFAULT_PALETTE, found.palette);
    notifyPaletteChange();
  }

  function resetPalette() {
    const areasMod = root.MC3D_AREAS;
    if (!areasMod) return;
    palette = areasMod.mergePalette(areasMod.DEFAULT_PALETTE, null);
    notifyPaletteChange();
  }

  function getLabels(mode) {
    if (mode === 'zones') {
      return {
        totalLabel: L('إجمالي المساحة الطابقية', 'Total Gross Floor Area'),
        emptyHint: L('لا توجد كتل طابقية بعد — أضف كتلاً لعرض توزيع التصنيفات.', 'No countable blocks yet — add blocks to view zone distribution.'),
        overflowHint: () => ''
      };
    }
    if (mode === 'program') {
      return {
        occupied: L('السعة المشغولة', 'Occupied Capacity'),
        unoccupied: L('السعة غير المشغولة', 'Unoccupied Capacity'),
        occupiedShort: L('مشغولة', 'Occupied'),
        unoccupiedShort: L('غير مشغولة', 'Free'),
        totalLabel: L('إجمالي سعة الكتل الصافية', 'Total Net Block Capacity'),
        emptyHint: L('لا توجد كتل طابقية بعد — أضف كتلاً لعرض سعتها.', 'No countable blocks yet — add blocks to measure capacity.'),
        overflowHint: ov => L(
          `تجاوز في التوزيع بمقدار ${formatArea(ov)} م² عن صافي السعة`,
          `Program exceeds net capacity by ${formatArea(ov)} m²`
        )
      };
    }
    return {
      occupied: L('المساحات المشغولة', 'Occupied Area'),
      unoccupied: L('المساحات غير المشغولة', 'Unoccupied Area'),
      occupiedShort: L('مشغولة', 'Occupied'),
      unoccupiedShort: L('غير مشغولة', 'Free'),
      totalLabel: L('إجمالي مساحة الموقع', 'Total Site Area'),
      emptyHint: L('حدّد أبعاد الموقع لعرض التوزيع.', 'Set site dimensions to display occupancy.'),
      overflowHint: () => ''
    };
  }

  function sliceDisplayName(sliceKey, lbl) {
    if (currentMode === 'zones') return getZoneLabel(sliceKey);
    return sliceKey === 'occupied' ? lbl.occupied : lbl.unoccupied;
  }

  function renderPaletteControls() {
    const panel = document.getElementById('occPalettePanel');
    const toggleBtn = document.getElementById('occColorBtn');
    const presetsEl = document.getElementById('occPresets');
    const zoneEl = document.getElementById('occZonePickers');
    const occEl = document.getElementById('occSlicePickers');
    const areasMod = root.MC3D_AREAS;

    if (toggleBtn) {
      toggleBtn.classList.toggle('on', paletteOpen);
      toggleBtn.setAttribute('aria-expanded', paletteOpen ? 'true' : 'false');
    }
    if (!panel) return;
    panel.style.display = paletteOpen ? 'flex' : 'none';
    if (!areasMod) return;

    if (presetsEl) {
      presetsEl.innerHTML = areasMod.PALETTE_PRESETS.map(pr => {
        const active = palettesEqual(palette, pr.palette) ? ' on' : '';
        const dots = [pr.palette.zones.main, pr.palette.zones.pub, pr.palette.zones.spec, pr.palette.zones.circ]
          .map(c => `<i style="background:${c}"></i>`)
          .join('');
        return `<button type="button" class="occ-pre-btn${active}" data-preset="${pr.id}">` +
          `<span class="occ-pre-dots">${dots}</span>` +
          `<span>${L(pr.ar, pr.en)}</span>` +
          `</button>`;
      }).join('');

      presetsEl.querySelectorAll('.occ-pre-btn').forEach(btn => {
        btn.onclick = () => applyPreset(btn.dataset.preset);
      });
    }

    if (zoneEl) {
      zoneEl.innerHTML = ZONE_ORDER.map(k => {
        const hex = (palette.zones[k] || '#94a3b8').toLowerCase();
        const label = getZoneLabel(k);
        const inputId = 'occColZone_' + (k || 'none');
        return `<label class="occ-col-row" for="${inputId}">` +
          `<span class="occ-col-lbl">${label}</span>` +
          `<span class="occ-col-ctrl"><span class="occ-col-hex">${hex.toUpperCase()}</span>` +
          `<input type="color" id="${inputId}" data-zone-key="${k}" value="${hex}" aria-label="${label}"></span>` +
          `</label>`;
      }).join('');

      zoneEl.querySelectorAll('input[data-zone-key]').forEach(inp => {
        inp.oninput = e => setZoneColor(e.target.dataset.zoneKey, e.target.value);
      });
    }

    if (occEl) {
      const occItems = [
        { key: 'occupied', label: L('المساحات المشغولة', 'Occupied Area'), hex: palette.occupied },
        { key: 'unoccupied', label: L('المساحات غير المشغولة', 'Unoccupied Area'), hex: palette.unoccupied }
      ];
      occEl.innerHTML = occItems.map(item => {
        const hex = (item.hex || '#1e40af').toLowerCase();
        const inputId = 'occColSlice_' + item.key;
        return `<label class="occ-col-row" for="${inputId}">` +
          `<span class="occ-col-lbl">${item.label}</span>` +
          `<span class="occ-col-ctrl"><span class="occ-col-hex">${hex.toUpperCase()}</span>` +
          `<input type="color" id="${inputId}" data-occ-key="${item.key}" value="${hex}" aria-label="${item.label}"></span>` +
          `</label>`;
      }).join('');

      occEl.querySelectorAll('input[data-occ-key]').forEach(inp => {
        inp.oninput = e => setOccupancyColor(e.target.dataset.occKey, e.target.value);
      });
    }
  }

  function render(payload) {
    if (payload) lastPayload = payload;
    const container = document.getElementById('occChart');
    const legendEl = document.getElementById('occLegend');
    const summaryEl = document.getElementById('occSummary');
    const noteEl = document.getElementById('occNote');
    if (!container || !legendEl || !summaryEl) return;

    const areasMod = root.MC3D_AREAS;
    const d3 = root.d3;
    if (!areasMod || !d3) return;

    const p = lastPayload || {
      siteWidth: 100,
      siteDepth: 100,
      footprint: 0,
      netCapacity: 0,
      allocatedArea: 0,
      byZone: {}
    };

    let stats;
    if (currentMode === 'zones') {
      const byZone = p.byZone || {};
      const zones = ZONE_ORDER.map(k => ({
        key: k,
        area: Number(byZone[k]) || 0,
        color: palette.zones[k] || areasMod.DEFAULT_PALETTE.zones[k]
      }));
      stats = areasMod.computeZoneBreakdownStats({ zones });
    } else {
      stats = areasMod.computeOccupancyStats({
        mode: currentMode,
        siteWidth: p.siteWidth,
        siteDepth: p.siteDepth,
        footprint: p.footprint,
        netCapacity: p.netCapacity,
        allocatedArea: p.allocatedArea,
        occupiedColor: palette.occupied,
        unoccupiedColor: palette.unoccupied
      });
    }

    const lbl = getLabels(currentMode);
    const u2 = L('م²', 'm²');

    // Mode toggle button states
    const btnSite = document.getElementById('occModeSite');
    const btnProg = document.getElementById('occModeProg');
    const btnZones = document.getElementById('occModeZones');
    if (btnSite) btnSite.classList.toggle('on', currentMode === 'site');
    if (btnProg) btnProg.classList.toggle('on', currentMode === 'program');
    if (btnZones) btnZones.classList.toggle('on', currentMode === 'zones');

    const size = 152;
    const radius = 66;
    const innerRadius = 42;
    const hoverOuter = 71;

    const rootSel = d3.select(container);
    rootSel.selectAll('*').remove();

    const svg = rootSel.append('svg')
      .attr('viewBox', `0 0 ${size} ${size}`)
      .attr('width', size)
      .attr('height', size)
      .attr('role', 'img')
      .attr('aria-label', L('رسم بياني دائري لتوزيع المساحات', 'Circular area distribution chart'));

    const g = svg.append('g')
      .attr('transform', `translate(${size / 2},${size / 2})`);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(2.5);

    const arcHover = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(hoverOuter)
      .cornerRadius(2.5);

    const activeSlice = hoveredKey ? stats.slices.find(s => s.key === hoveredKey) : null;
    let centerPrimary = '—';
    let centerSecondary = L('بدون بيانات', 'No data');

    if (stats.hasTotal) {
      if (currentMode === 'zones') {
        if (activeSlice) {
          centerPrimary = formatPct(activeSlice.pct);
          const nm = getZoneLabel(activeSlice.key);
          centerSecondary = nm.length > 13 ? nm.slice(0, 12) + '…' : nm;
        } else {
          centerPrimary = formatArea(stats.total);
          centerSecondary = u2;
        }
      } else {
        centerPrimary = activeSlice ? formatPct(activeSlice.pct) : formatPct(stats.occupiedPct);
        centerSecondary = activeSlice
          ? (activeSlice.key === 'occupied' ? lbl.occupiedShort : lbl.unoccupiedShort)
          : lbl.occupiedShort;
      }
    }

    const centerPctText = g.append('text')
      .attr('class', 'occ-center-val')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.12em')
      .text(centerPrimary);

    const centerSubText = g.append('text')
      .attr('class', 'occ-center-sub')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.35em')
      .text(centerSecondary);

    if (!stats.hasTotal) {
      g.append('circle')
        .attr('r', (radius + innerRadius) / 2)
        .attr('fill', 'none')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', radius - innerRadius);
    } else {
      const nonZeroCount = stats.slices.filter(s => s.value > 0).length;
      const pie = d3.pie()
        .value(d => d.value)
        .sort(null)
        .padAngle(nonZeroCount > 1 ? 0.03 : 0);

      const arcs = pie(stats.slices);

      const paths = g.selectAll('path.occ-slice')
        .data(arcs, d => d.data.key)
        .enter()
        .append('path')
        .attr('class', d => 'occ-slice occ-slice-' + (d.data.key || 'none'))
        .attr('data-key', d => d.data.key)
        .attr('fill', d => d.data.color)
        .attr('stroke', d => d.data.key === 'unoccupied' ? '#94a3b8' : '#ffffff')
        .attr('stroke-width', d => d.data.key === 'unoccupied' ? 0.75 : 1)
        .attr('d', d => (hoveredKey === d.data.key ? arcHover(d) : arc(d)))
        .style('cursor', 'pointer')
        .on('mouseenter', function(event, d) {
          setHover(d.data.key, stats, lbl, u2, centerPctText, centerSubText, paths, arc, arcHover);
        })
        .on('mouseleave', function() {
          setHover(null, stats, lbl, u2, centerPctText, centerSubText, paths, arc, arcHover);
        });

      paths.append('title')
        .text(d => {
          const name = sliceDisplayName(d.data.key, lbl);
          return `${name}: ${formatArea(d.data.rawValue)} ${u2} (${formatPct(d.data.pct)})`;
        });
    }

    legendEl.innerHTML = stats.slices.map(s => {
      const name = sliceDisplayName(s.key, lbl);
      const borderStyle = s.key === 'unoccupied' ? 'border:1px solid #94a3b8;' : '';
      const activeCls = hoveredKey === s.key ? ' is-active' : '';
      return `<div class="occ-row${activeCls}" data-key="${s.key}">` +
        `<span class="occ-name"><span class="sw" style="background:${s.color};${borderStyle}"></span><span>${name}</span></span>` +
        `<span class="occ-vals"><b>${formatArea(s.rawValue)}</b> ${u2} <span class="occ-pct">· ${formatPct(s.pct)}</span></span>` +
        `</div>`;
    }).join('');

    legendEl.querySelectorAll('.occ-row').forEach(row => {
      const key = row.dataset.key;
      row.onmouseenter = () => {
        hoveredKey = key;
        render();
      };
      row.onmouseleave = () => {
        hoveredKey = null;
        render();
      };
    });

    summaryEl.innerHTML = `<span>${lbl.totalLabel}:</span> <b>${formatArea(stats.total)} ${u2}</b>`;

    if (noteEl) {
      if (!stats.hasTotal) {
        noteEl.textContent = lbl.emptyHint;
        noteEl.className = 'hint';
        noteEl.style.display = 'block';
      } else if (stats.isOverflow) {
        noteEl.textContent = lbl.overflowHint(stats.overflow);
        noteEl.className = 'warnTxt';
        noteEl.style.display = 'block';
      } else if (currentMode !== 'zones' && stats.occupied === 0) {
        noteEl.textContent = currentMode === 'site'
          ? L('الموقع غير مشغول حالياً — أضف كتلاً لرؤية نسبة التغطية.', 'Site is currently unoccupied — add blocks to measure coverage.')
          : L('لم يتم توزيع فضاءات بعد — افتح «البرنامج الوظيفي والتوزيع» للتخصيص.', 'No spaces allocated yet — open Program & Space Allocation to assign.');
        noteEl.className = 'hint';
        noteEl.style.display = 'block';
      } else {
        noteEl.textContent = '';
        noteEl.style.display = 'none';
      }
    }
  }

  function setHover(key, stats, lbl, u2, centerPctText, centerSubText, paths, arc, arcHover) {
    hoveredKey = key;
    const active = key !== null ? stats.slices.find(s => s.key === key) : null;
    if (!stats.hasTotal) {
      centerPctText.text('—');
      centerSubText.text(L('بدون بيانات', 'No data'));
    } else if (currentMode === 'zones') {
      if (active) {
        centerPctText.text(formatPct(active.pct));
        const nm = getZoneLabel(active.key);
        centerSubText.text(nm.length > 13 ? nm.slice(0, 12) + '…' : nm);
      } else {
        centerPctText.text(formatArea(stats.total));
        centerSubText.text(u2);
      }
    } else {
      centerPctText.text(formatPct(active ? active.pct : stats.occupiedPct));
      centerSubText.text(
        active ? (active.key === 'occupied' ? lbl.occupiedShort : lbl.unoccupiedShort) : lbl.occupiedShort
      );
    }

    const reduceMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    paths.each(function(d) {
      const targetArc = d.data.key === key ? arcHover : arc;
      const sel = root.d3.select(this);
      if (reduceMotion) {
        sel.attr('d', targetArc(d));
      } else {
        sel.transition().duration(140).attr('d', targetArc(d));
      }
    });

    document.querySelectorAll('#occLegend .occ-row').forEach(r => {
      r.classList.toggle('is-active', key !== null && r.dataset.key === key);
    });
  }

  function setMode(mode) {
    currentMode = (mode === 'program' || mode === 'zones') ? mode : 'site';
    hoveredKey = null;
    render();
  }

  function togglePalettePanel(force) {
    paletteOpen = typeof force === 'boolean' ? force : !paletteOpen;
    renderPaletteControls();
  }

  function bindEvents() {
    const btnSite = document.getElementById('occModeSite');
    const btnProg = document.getElementById('occModeProg');
    const btnZones = document.getElementById('occModeZones');
    const colorBtn = document.getElementById('occColorBtn');
    const resetBtn = document.getElementById('occColorReset');
    if (btnSite) btnSite.onclick = () => setMode('site');
    if (btnProg) btnProg.onclick = () => setMode('program');
    if (btnZones) btnZones.onclick = () => setMode('zones');
    if (colorBtn) colorBtn.onclick = () => togglePalettePanel();
    if (resetBtn) resetBtn.onclick = () => resetPalette();
    renderPaletteControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }

  root.MC3D_OCC_CHART = {
    render,
    renderPaletteControls,
    setMode,
    getMode: () => currentMode,
    getPalette,
    applyPreset,
    resetPalette,
    setZoneColor,
    setOccupancyColor,
    togglePalettePanel,
    setOnPaletteChange: cb => { onPaletteChangeCb = cb; }
  };
})(window);
