(function(){
  const STORAGE_KEY = 'mc3d_lang';
  let lang = 'ar';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ar') lang = saved;
  } catch (e) {}

  function applyRoot(l) {
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'en' ? 'ltr' : 'rtl';
    if (document.title) {
      document.title = l === 'en'
        ? 'Maket — 3D Architectural Massing Studio'
        : 'ماكيت Maket — استوديو النمذجة الكتلية ثلاثية الأبعاد';
    }
  }
  applyRoot(lang);

  // Store original Arabic primary text node without touching child SVGs / inputs / spans
  function getPrimaryTextNode(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.nodeValue.trim().length > 0) return n;
    }
    return null;
  }

  function setTextKeepChildren(el, enText) {
    if (!el) return;
    if (el.dataset.i18nLock === '1') return;
    const tn = getPrimaryTextNode(el);
    if (tn) {
      if (el._arTxt === undefined) el._arTxt = tn.nodeValue;
      tn.nodeValue = lang === 'en'
        ? (el._arTxt.startsWith(' ') ? ' ' : '') + enText + (el._arTxt.endsWith(' ') ? ' ' : '')
        : el._arTxt;
    } else if (!el.children.length) {
      if (el._arTxt === undefined) el._arTxt = el.textContent;
      el.textContent = lang === 'en' ? enText : el._arTxt;
    }
  }

  function setAttr(el, attr, enVal) {
    if (!el) return;
    const k = '_ar_' + attr;
    if (el[k] === undefined) el[k] = el.getAttribute(attr) || '';
    el.setAttribute(attr, lang === 'en' ? enVal : el[k]);
  }

  // Selector -> English label
  const TEXT_MAP = [
    ['#titlebar .brand-mark', 'Maket'],
    ['.tab[data-t="file"]', 'File'],
    ['.tab[data-t="home"]', 'Modeling'],
    ['.tab[data-t="view"]', 'View'],
    ['.tab[data-t="site"]', 'Site'],
    ['.tab[data-t="sun"]', 'Sun & Wind'],
    ['.tab[data-t="sec"]', 'Section'],
    ['.tab[data-t="facade"]', 'Facades'],
    ['.tab[data-t="mass"]', 'Analysis'],
    ['.tab[data-t="sheet"]', 'Sheets'],
    ['.tab[data-t="areas"]', 'Areas'],
    ['#tabMod', 'Edit Mass'],
    ['#tabShMod', 'Format Sheet'],
    ['#bLogout', 'Logout'],
    ['#qExp', 'Export'],

    // File pane
    ['#p_file .grp:nth-child(1) .gc', 'Project Info (Shown in Sheets & Exports)'],
    ['#p_file .grp:nth-child(1) > .gb > .fld-stack', 'Project Title'],
    ['#p_file .grp:nth-child(1) .fld-grid .fld-stack:nth-child(1)', 'Designer'],
    ['#p_file .grp:nth-child(1) .fld-grid .fld-stack:nth-child(2)', 'Organization / Studio'],
    ['#p_file .grp:nth-child(1) > .gb > .fld-stack:last-child', 'Location'],
    ['#p_file .grp:nth-child(2) .gc', 'Starter Templates'],
    ['#bNew', 'Blank Project'],
    ['#bSketch', 'Courtyard'],
    ['#bSketch2', 'Mass Cluster'],
    ['#bSketch3', 'Tower & Podium'],
    ['#p_file .grp:nth-child(3) .gc', 'My Original Sketches'],
    ['#bOrig1', 'Sketch 1'],
    ['#bOrig2', 'Sketch 2'],
    ['#bOrig3', 'Sketch 3'],
    ['#p_file .grp:nth-child(4) .gc', 'Saved Designs'],
    ['#bOpen', 'Open'],
    ['#bDelD', 'Delete'],
    ['#bSave', 'Save As'],
    ['#p_file .grp:nth-child(5) .gc', 'Review & Collaboration'],
    ['#bReview', 'Share for Review'],
    ['#bNote', 'Add Note'],
    ['#bNotes', 'Notes'],
    ['#bPins', 'Pins'],
    ['#p_file .grp:nth-child(6) .gc', 'Export & Backup'],
    ['#b3D', 'Export 3D / PDF'],
    ['#bShot', 'Screenshot'],
    ['#bBackup', 'Full Backup'],
    ['#bRestore', 'Restore Backup'],
    ['#bIO', 'Copy / Paste JSON'],

    // Home / Modeling pane
    ['#p_home .grp:nth-child(1) .gc', 'New Mass Defaults'],
    ['#p_home .grp:nth-child(1) .fld-grid:nth-child(1) .fld-stack:nth-child(1)', 'Shape'],
    ['#p_home .grp:nth-child(1) .fld-grid:nth-child(1) .fld-stack:nth-child(2)', 'Material'],
    ['#p_home .grp:nth-child(1) .fld-grid:nth-child(2) .fld-stack:nth-child(1)', 'Zone / Function'],
    ['#p_home .grp:nth-child(1) .fld-grid:nth-child(2) .fld-stack:nth-child(2)', 'Floors'],
    ['#p_home .grp:nth-child(2) .gc', 'Precision & Snapping'],
    ['#p_home .grp:nth-child(2) .fld-lbl', 'Grid Step'],
    ['#dSnap option[value="0.5"]', '0.5 m'],
    ['#dSnap option[value="1"]', '1 m'],
    ['#dSnap option[value="2"]', '2 m'],
    ['#dSnap option[value="5"]', '5 m'],
    ['#bEdge', 'Smart Align'],
    ['#bAll', 'Select All'],
    ['#tUndo', '↶ Undo'],
    ['#tRedo', '↷ Redo'],
    ['#p_home .grp:nth-child(3) .gc', 'Masses & Elements'],

    // View pane
    ['#p_view .grp:nth-child(1) .gc', 'Camera Views'],
    ['#p_view [data-v="iso"]', 'Isometric'],
    ['#p_view [data-v="top"]', 'Plan'],
    ['#p_view [data-v="front"]', 'Front'],
    ['#p_view [data-v="side"]', 'Side'],
    ['#p_view [data-v="eye"]', 'Eye Level'],
    ['#p_view .grp:nth-child(2) .gc', 'Display Mode'],
    ['#cMat', 'By Material'],
    ['#cFn', 'By Function'],
    ['#cWhite', 'White Model'],
    ['#cXray', 'X-Ray'],
    ['#p_view .grp:nth-child(3) .gc', 'Visibility'],
    ['#bGrid', 'Grid'],
    ['#bNames', 'Labels'],
    ['#bDims', 'Dimensions'],
    ['#p_view .grp:nth-child(4) .gc', 'Render Quality'],
    ['#rqAll', 'Enable Enhanced Render'],
    ['#rqTex', 'Textures'],
    ['#rqAO', 'Soft AO'],
    ['#rqSky', 'Sky'],
    ['#p_view .grp:nth-child(5) .gc', 'Image & Video Capture'],
    ['#p_view .grp:nth-child(5) .fld:nth-child(1) .fld-lbl', 'Video Mode'],
    ['#vidMode option[value="orbit"]', '360° Orbit'],
    ['#vidMode option[value="sun"]', 'Sun Study'],
    ['#bAnimStudio', '🎬 Massing Animation Studio…'],
    ['#maIntro', 'A short film explaining the design: site → blocks drop in step by step → functional relationships → sun & wind → final form, with a caption for each scene.'],
    ['#maDurLbl', 'Duration'],
    ['#maStyleLbl', 'Blocks appear by'],
    ['#maStyle option[value="drop"]', 'Dropping from above'],
    ['#maStyle option[value="grow"]', 'Growing from the ground'],
    ['#maStyle option[value="fade"]', 'Fading in'],
    ['#maColLbl', 'Colours'],
    ['#maCol option[value="fn"]', 'By function'],
    ['#maCol option[value="white"]', 'Architectural white'],
    ['#maCol option[value="mat"]', 'Materials'],
    ['#maIntroLbl', 'Project title card'],
    ['#maLinksLbl', 'Functional relationships between blocks'],
    ['#maClimLbl', 'Sun path and wind flow'],
    ['#maCamHint', 'The camera starts from the current view and turns slowly — set up the angle first.'],
    ['#maPreview', '▶ Preview'],
    ['#maRecord', '⏺ Record & save video'],
    ['#anMorphFilm', '🎬 Massing film (drop, links, climate)'],
    ['#p_view .grp:nth-child(5) .fld:nth-child(2)', 'sec'],
    ['#p_view .grp:nth-child(5) .fld:nth-child(2) .fld-lbl', 'Duration'],
    ['#bVideo', 'Record Video'],
    ['#bShot2', 'Save Image'],
    ['#bWhite', 'White Background on Save'],

    // Site pane
    ['#siteMainGrp .gc', 'Plot Dimensions & Zoning'],
    ['#sitePresetSel option[value=""]', 'Quick Plot Preset…'],
    ['#sitePresetSel option[value="100x100"]', 'Standard Square (100×100m)'],
    ['#sitePresetSel option[value="60x40"]', 'Corner Plot (60×40m)'],
    ['#sitePresetSel option[value="40x60"]', 'Urban Plot (40×60m)'],
    ['#sitePresetSel option[value="160x120"]', 'Campus Parcel (160×120m)'],
    ['#bFitSite', 'Fit View'],
    ['#lblSiteW', 'Width (m)'],
    ['#lblSiteD', 'Depth (m)'],
    ['#lblSiteFH', 'Floor Height (m)'],
    ['#lblSiteN', 'North Angle (°)'],
    ['#sbModeUniform', 'Uniform Setback'],
    ['#sbModeCustom', 'Custom Per Side'],
    ['#sbUniformLbl', 'Setback (m)'],
    ['#lblSbN', 'North (m)'],
    ['#lblSbS', 'South (m)'],
    ['#lblSbE', 'East (m)'],
    ['#lblSbW', 'West (m)'],
    ['#lblMaxCov', 'Max Coverage (%)'],
    ['#lblMaxFar', 'Max FAR'],
    ['#siteStreetsGrp .gc', 'Adjacent Streets & Access'],
    ['#stN', 'North St.'],
    ['#stS', 'South St.'],
    ['#stE', 'East St.'],
    ['#stW', 'West St.'],
    ['#sRoadWLbl', 'Road Width'],
    ['#siteAnalysisGrp .gc', 'Site Summary & Setback Check'],
    ['#sitePlotLbl', 'Plot Area'],
    ['#siteBuildLbl', 'Buildable'],
    ['#siteCompLbl', 'Setbacks'],
    ['#siteCovLbl', 'Site Coverage'],
    ['#siteFarLbl', 'Floor Area Ratio (FAR)'],
    ['#siteImgGrp .gc', 'Site Image / Base Plan'],
    ['#bImg', 'Upload Site Plan'],
    ['#bImgShow', 'Show'],
    ['#siteImgGrp > .gb > .fld:nth-of-type(1) .fld-lbl', 'Opacity'],
    ['#siteImgGrp .fld-grid .fld-stack:nth-child(1)', 'Width (m)'],
    ['#siteImgGrp .fld-grid .fld-stack:nth-child(2)', 'Rotation (°)'],
    ['#siteImgGrp .fld-grid .fld-stack:nth-child(3)', 'Offset X'],
    ['#siteImgGrp .fld-grid .fld-stack:nth-child(4)', 'Offset Z'],
    ['#bCal', '2-Point Calibrate'],
    ['#bImgDel', 'Remove Image'],
    ['#calBox', 'Real Distance'],
    ['#calOk', 'Apply'],

    // Sun & Wind pane
    ['#p_sun .grp:nth-child(1) .gc', 'Geographic Location & Climate'],
    ['#p_sun .grp:nth-child(1) .fld-lbl', 'City'],
    ['#p_sun .grp:nth-child(1) .fld-grid .fld-stack:nth-child(1)', 'Latitude'],
    ['#p_sun .grp:nth-child(1) .fld-grid .fld-stack:nth-child(2)', 'Longitude'],
    ['#p_sun .grp:nth-child(1) .fld-grid .fld-stack:nth-child(3)', 'UTC Offset'],
    ['#p_sun .grp:nth-child(1) .fld-grid .fld-stack:nth-child(4)', 'Wind Azimuth (°)'],
    ['#p_sun .grp:nth-child(2) .gc', 'Sun & Shadow Simulation'],
    ['#bSunOn', 'Enable Real Sun'],
    ['#p_sun .grp:nth-child(2) .fld:nth-of-type(1) .fld-lbl', 'Date'],
    ['#p_sun [data-d="06-21"]', 'Jun 21'],
    ['#p_sun [data-d="03-21"]', 'Mar 21'],
    ['#p_sun [data-d="12-21"]', 'Dec 21'],
    ['#sunTimeLbl', 'Time'],
    ['#bSunPlay', 'Animate Day'],
    ['#bWind', 'Wind Direction'],
    ['#shadowMapGrp .gc', 'Annual Shadow Heatmap'],
    ['#bShadowMap', 'Show Shadow Heatmap'],
    ['#hmRampThermal', 'Thermal'],
    ['#hmRampCool', 'Cool Shade'],
    ['#hmOpLbl', 'Opacity'],
    ['#hmQualLbl', 'Resolution'],
    ['#hmQual option[value="std"]', 'Standard (Fast)'],
    ['#hmQual option[value="high"]', 'High Detail'],
    ['#shadowMapHint', 'Enable to calculate annual shadow accumulation across the year and project a heatmap onto the site ground.'],
    ['#hmLegendTitle', 'Annual Shadow Exposure'],
    ['#hmAvgLbl', 'Avg. Shadow'],
    ['#hmMaxLbl', 'Peak Shadow'],
    ['#hmHeavyLbl', 'Heavy Shade >50%'],
    ['#hmProbeLbl', 'Ground Cursor'],

    // Section pane
    ['#secMainGrp .gc', 'Section Plane & Orientation'],
    ['#bSec', 'Enable Section'],
    ['#secX', 'Longitudinal (X)'],
    ['#secZ', 'Cross (Z)'],
    ['#secY', 'Horizontal (Floor)'],
    ['#secFlip', 'Flip Direction'],
    ['#secViewCut', 'Align Camera'],
    ['#secCap', 'Solid Cut Fill'],
    ['#secFrame', 'Cut Frame'],
    ['#secGeomGrp .gc', 'Position, Angle & Slice'],
    ['#secLvlLbl', 'Floor'],
    ['#secPosLbl', 'Position'],
    ['#secStepM', '−1m'],
    ['#secStepP', '+1m'],
    ['#secAngLbl', 'Angle'],
    ['#secSlice', 'Slice Band'],
    ['#secThickLbl', 'Width'],
    ['#secDataGrp .gc', 'Cross-Section Preview & Metrics'],
    ['#secCntLbl', 'Cut Masses'],
    ['#secAreaLbl', 'Cut Area'],
    ['#secHeightLbl', 'Max Height'],
    ['#secShot', 'Capture to Sheet'],
    ['#secReset', 'Reset'],

    // Sheets pane
    ['#p_sheet .grp:nth-child(1) .gc', 'Sheet Management'],
    ['#shNew', '+ New'],
    ['#p_sheet .grp:nth-child(2) .gc', 'Content & Captures'],
    ['#shQuick', 'Quick Sheet'],
    ['#shFinal', 'Final A1 Board'],
    ['#shThemeLbl', 'Board colour style (all views)'],
    ['#shThemes [data-th="white"]', 'Architectural white'],
    ['#shThemes [data-th="fn"]', 'Functions'],
    ['#shThemes [data-th="mat"]', 'Materials'],
    ['#shShot', 'Capture View'],
    ['#shAddM', 'Add Element to Sheet ▾'],
    ['#p_sheet .grp:nth-child(3) .gc', 'Page Setup'],
    ['#shLand', 'Landscape'],
    ['#shPort', 'Portrait'],
    ['#shFrame', 'Sheet Border'],
    ['#shAuto', 'Auto Arrange'],
    ['#p_sheet .grp:nth-child(4) .gc', 'Export & Print'],
    ['#shExpDlg', 'Export PDF / Images / 3D'],
    ['#shDelS', 'Delete'],
    ['#shClear', 'Clear'],

    // Facades Studio pane
    ['#facScopeGrp .gc', 'Target Scope & Quick Presets'],
    ['#facScopeSel', 'Selected Mass'],
    ['#facScopeAll', 'All Masses'],
    ['#facScopeZone', 'By Zone'],
    ['#facBlockLbl', 'Mass'],
    ['#facZoneLbl', 'Zone'],
    ['[data-fp="officeGlass"]', 'Glass Curtain'],
    ['[data-fp="solarSouth"]', 'Solar Louvers'],
    ['[data-fp="heritageMash"]', 'Mashrabiya'],
    ['[data-fp="resBalcony"]', 'Balconies'],
    ['#facSystemGrp .gc', 'Facade System & Parameters'],
    ['#facSidesLbl', 'Active Elevations'],
    ['#facAutoBtn', '⚡ Auto Climate Facade (by orientation)'],
    ['#facGrLbl', 'Ground-Floor Element'],
    ['#facGrSidesLbl', 'On Side'],
    ['#facGrTypes [data-fg=""]', 'None'],
    ['#facGrTypes [data-fg="colon"]', 'Colonnade'],
    ['#facGrTypes [data-fg="entry"]', 'Canopy Entrance'],
    ['#facSpacingLbl', 'Bay Spacing'],
    ['#facWwrLbl', 'Window Ratio'],
    ['#facDepthLbl', 'Projection'],
    ['#facToneLbl', 'Frame Tone'],
    ['#facPreviewGrp .gc', 'Elevation Preview & Performance'],
    ['#facKpiWwrLbl', 'WWR'],
    ['#facKpiAreaLbl', 'Glazing Area'],
    ['#facKpiAreaUnit', 'm²'],
    ['#facKpiShadeLbl', 'Shading'],
    ['#facApplyAllBtn', 'Apply to All'],
    ['#facClearBtn', 'Clear Facade'],

    // Architectural Analysis Studio pane
    ['#anNavTitle', 'Architectural Analysis Studio'],
    ['#anTabGeom', 'Massing'],
    ['#anTabEnv', 'Environment'],
    ['#anTabZones', 'Zones'],
    ['#anTabMorph', 'Evolution'],
    ['#anTabCode', 'Regulations'],
    ['#anCodeTitle', 'Regulation Checks (approximate)'],
    ['#anCode3dBtn', 'Colour escape distances in 3D'],
    ['#anCodeParkBtn', '🅿 Add the missing parking automatically'],
    ['#anCodeCoreBtn', '🧭 Suggest stair / lift cores automatically'],
    ['#anCodeEscTitle', 'Escape distance per block (to nearest core)'],
    ['#anCodeOptTitle', 'Criteria used'],
    ['#anCodeParkLbl', 'One space per (m² floor area)'],
    ['#anCodeEscLbl', 'Max escape distance (m)'],
    ['#anCodeLiftLbl', 'One lift per (m² upper floors)'],
    ['#anCodeHint', 'Common guideline values — match them to the code your supervisor uses. Distance is measured as right-angle corridors to the nearest core (joint material or circulation function) of two floors or more.'],
    ['#massOverlayGrp .gc', '3D Analytical Viewport Mode'],
    ['#massOvNone', 'Off'],
    ['#massOvHeight', 'Height'],
    ['#massOvSvr', 'S/V'],
    ['#massOvDay', 'Light'],
    ['#massOvIssues', 'Clash'],
    ['#massKpiGrp .gc', 'Volumetric & Compactness KPIs'],
    ['#massKpiVolLbl', 'Total Volume'],
    ['#massKpiVolUnit', 'm³'],
    ['#massKpiEnvLbl', 'Envelope Area'],
    ['#massKpiEnvUnit', 'm²'],
    ['#massKpiSvrLbl', 'S/V Ratio'],
    ['#massKpiCompLbl', 'Compactness'],
    ['#massKpiCompSub', 'Form Index'],
    ['#massKpiDayLbl', 'Daylight Reach'],
    ['#massKpiHeightLbl', 'Peak Height'],
    ['#massKpiHeightUnit', 'm'],
    ['#massChartGrp .gc', 'Interactive Mass Comparison'],
    ['#massMetVol', 'Volume'],
    ['#massMetH', 'Height'],
    ['#massMetSvr', 'S/V'],
    ['#massMetDay', 'Light'],
    ['#massDiagGrp .gc', 'Spatial & Clash Diagnostics'],
    ['#massListGrp .gc', 'Mass Breakdown Schedule'],
    ['#anEnvCtrlTitle', 'Site & Climate Analysis'],
    ['#anEnvSolar', 'Sun'],
    ['#anEnvWind', 'Wind'],
    ['#anEnvNoise', 'Noise'],
    ['#anEnv3dBtn', 'Show 3D in Viewport'],
    ['#anEnvSiteBtn', 'Site Setup'],
    ['#anEnvDiagTitle', 'Environmental Diagram & KPIs'],
    ['#anEnvListTitle', 'Mass Environmental Rating'],
    ['#anZonesTitle', 'Zones & Bubble Diagram'],
    ['#anBubModeZones', 'By Zones'],
    ['#anBubModeMass', 'By Masses'],
    ['#anZones3dBtn', 'Show 3D Zones & Links'],
    ['#anBubbleHint', 'Click any bubble to select in 3D · Thick line = direct adjacency'],
    ['#anZoneListTitle', 'Privacy Gradient & Area Share'],
    ['#anMorphTitle', 'Massing Evolution (How It Was Formed)'],
    ['#anPartiKicker', 'Dominant Parti Concept'],
    ['#anMorphPrev', '‹ Prev'],
    ['#anMorphNext', 'Next ›'],
    ['#anMorph3dBtn', 'Isolate Step in 3D'],
    ['#anMorphStepsTitle', 'Morphological Sequence'],

    // Sheet element modifier pane
    ['#shSel .gc', 'Selected Element'],
    ['#shSel .fld:nth-of-type(3) .fld-lbl', 'Color / Stroke'],
    ['#shScaleBox .fld-lbl', 'Scale'],
    ['#shLen .fld-lbl:nth-of-type(2)', 'Length'],
    ['#shLen', 'm'],
    ['#shCrop', 'Crop View'],
    ['#shTrim', 'Trim Margins'],
    ['#shDupB', 'Duplicate'],
    ['#shFront', 'Bring Front'],
    ['#shBack', 'Send Back'],
    ['#shDel', 'Delete Element'],
    ['#shArr .gc', 'Arrange & Align'],
    ['[data-al="r"]', '⇥ Right'],
    ['[data-al="c"]', '↔ Center'],
    ['[data-al="l"]', '⇤ Left'],
    ['[data-al="t"]', '⤒ Top'],
    ['[data-al="m"]', '↕ Middle'],
    ['[data-al="b"]', '⤓ Bottom'],
    ['#shDistH', '⋯ Dist. H'],
    ['#shDistV', '⋮ Dist. V'],
    ['#shSame', '⇔ Match Size'],
    ['#shGrp', 'Group'],
    ['#shUngrp', 'Ungroup'],
    ['#shDone', 'Done Editing'],

    // Areas pane
    ['#occTitle', 'Area Distribution'],
    ['#occColorBtn span', 'Colors'],
    ['#occPalSubPre', 'Preset Palettes'],
    ['#occPalSubZones', 'Functional Categories'],
    ['#occPalSubOcc', 'Occupancy Slices'],
    ['#occColorReset', 'Reset Defaults'],
    ['#occModeSite', 'Site Ground'],
    ['#occModeProg', 'Capacity'],
    ['#occModeZones', 'Zones'],
    ['#fnGrp .gc', 'Areas by Function (+25% Circulation)'],
    ['#progGrp .gc', 'Functional Program & Reports'],
    ['#bProg', 'Program & Space Allocation'],
    ['#bReport', 'Full Area Report'],
    ['#bCompare', 'Compare Designs'],

    // Left tool rail & cam HUD
    ['#tSel span', 'Select'],
    ['#tDraw span', 'Draw'],
    ['#tCut span', 'Cut'],
    ['#tMeas span', 'Measure'],
    ['#bMulti span', 'Multi'],
    ['#bPlan span', 'Plan 2D'],
    ['#qShot span', 'Snapshot'],
    ['#camHud [data-v="iso"] span', 'Iso'],
    ['#camHud [data-v="top"] span', 'Plan'],
    ['#camHud [data-v="front"] span', 'Front'],
    ['#camHud [data-v="side"] span', 'Side'],
    ['#camHud [data-v="eye"] span', 'Eye'],

    // Sheet zoom bar & tour
    ['#shZfit', 'Fit'],
    ['#shGuides', 'Snap Guides'],
    ['#shSnapOpt', 'Capture Options'],
    ['#tourSkip', 'Skip'],
    ['#tourPrev', '← Prev'],

    // Modals
    ['#mIO .hint', 'Copy JSON to save or share, or paste design data and click "Import".'],
    ['#ioCopy', 'Copy'],
    ['#ioImport', 'Import'],
    ['#mShot .hint', 'Right-click the image → Save Image As (or long-press on mobile).'],
    ['#mCrop .hint', 'Drag the frame corners to crop, or drag inside to reposition.'],
    ['#cropOk', 'Apply Crop'],
    ['#cropAll', 'Reset Crop'],
    ['#repCSV', 'Download Table (Excel / CSV)'],
    ['#mExport .expsec:nth-child(1) > b', 'Current Sheet'],
    ['#mExport .expsec:nth-child(1) .fld', 'Format  Resolution'],
    ['#shFmt option[value="pdf"]', 'PDF (Print Ready)'],
    ['#shFmt option[value="png"]', 'PNG (Lossless)'],
    ['#shFmt option[value="jpg"]', 'JPG (Compact)'],
    ['#shDown', 'Download Sheet'],
    ['#shAll', 'All Sheets as PDF'],
    ['#shExport', 'Preview'],
    ['#mExport .expsec:nth-child(2) > b', '3D Model'],
    ['#mExport .expsec:nth-child(2) > .hint', '(Single ZIP Package)'],
    ['#mExport .expgrid .qchk:nth-child(1)', '— IFC'],
    ['#mExport .expgrid .qchk:nth-child(2)', '— DXF'],
    ['#mExport .expgrid .qchk:nth-child(3)', '— DXF 2D'],
    ['#mExport .expgrid .qchk:nth-child(4)', '— DAE'],
    ['#mExport .expgrid .qchk:nth-child(5)', '(Blender / Rhino / 3ds Max)'],
    ['#mExport .expgrid .qchk:nth-child(6)', '— CSV'],
    ['#mExport .expgrid .qchk:nth-child(3) b', 'AutoCAD Plan'],
    ['#mExport .expgrid .qchk:nth-child(6) b', 'Mass Schedule'],
    ['#exp3D', 'Download 3D Model'],
    ['#mExport .expsec:nth-child(2) > div:last-child .hint', 'Units: Meters'],

    // Notes modal
    ['#ntPull', 'Refresh'],
    ['#ntCopy', 'Copy as Text'],
    ['#ntSend', 'Save Notes File'],
    ['#ntImp', 'Import Notes'],

    // Program modal
    ['#pgPreset option[value="medEdu"]', 'Preset: Medical Educational & Training Center (my project)'],
    ['#pgPreset option[value="general"]', 'Preset: Mixed-Use Project'],
    ['#pgPreset option[value="edu"]', 'Preset: Educational / Cultural'],
    ['#pgPreset option[value="res"]', 'Preset: Residential Complex'],
    ['#pgPreset option[value="office"]', 'Preset: Commercial & Office'],
    ['#pgPreset option[value="med"]', 'Preset: Healthcare / Medical'],
    ['#pgPreset option[value="empty"]', 'Preset: Blank (Custom)'],
    ['#pgFns', 'Suggest Block Functions'],
    ['#pgAuto', 'Auto Allocate'],
    ['#pgAdd', '+ Space'],
    ['#pgFilt', 'Unallocated Only'],
    ['#mProg .fld', 'Efficiency'],
    ['#pgSheet', 'Add to Sheet'],
    ['#pgClear', '↺ Clear Allocation'],
    ['#pgReset', '⟲ Load Preset'],
    ['#mProg .pgWrap > div:nth-child(1) > b', 'Spaces'],
    ['#mProg .pgWrap > div:nth-child(1) > .hint', '(Name · m² · Block/Floor)'],
    ['#mProg .pgWrap > div:nth-child(2) > b', 'Block & Floor Capacity'],
    ['#mProg .pgWrap > div:nth-child(2) > .hint', '(Area × Efficiency)'],

    // Input & Auth modals
    ['#inpOk', 'OK'],
    ['#mAuth .hint', 'Save your designs, sheets, review links, and notes to your cloud account to access them from any device.'],
    ['#mAuth .fld:nth-of-type(1) .fld-lbl', 'Username'],
    ['#mAuth .fld:nth-of-type(2) .fld-lbl', 'Password'],
    ['#auIn', 'Sign In'],
    ['#auNew', 'Create Account'],

    // Quick sheet modal
    ['#mQuick > .fld:nth-of-type(1)', 'Design'],
    ['#mQuick > b:nth-of-type(1)', 'Views'],
    ['#mQuick > b:nth-of-type(2)', 'Options'],
    ['#mQuick > div:nth-of-type(3) .qchk:nth-child(1)', 'Site Ground Plane'],
    ['#mQuick > div:nth-of-type(3) .qchk:nth-child(2)', 'Color by Function'],
    ['#mQuick > div:nth-of-type(3) .qchk:nth-child(3)', 'Real Sun Shadows'],
    ['#mQuick > div:nth-of-type(3) .qchk:nth-child(4)', 'Function Legend'],
    ['#mQuick > div:nth-of-type(3) .qchk:nth-child(5)', 'Title Block'],
    ['#mQuick > div:nth-of-type(3) .qchk:nth-child(6)', 'Mass Labels on Views'],
    ['#mQuick > div:nth-of-type(3) .qchk:nth-child(7)', 'North Arrow on Plan'],
    ['#mQuick > div:nth-of-type(3) .qchk:nth-child(8)', 'Calibrated Plan Scale Bar'],
    ['#mQuick > .fld:nth-of-type(2)', 'Size  Orientation  Layout'],
    ['#qOrient option[value="land"]', 'Landscape'],
    ['#qOrient option[value="port"]', 'Portrait'],
    ['#qLayout option[value="big"]', 'Hero View + Supporting Views'],
    ['#qLayout option[value="grid"]', 'Uniform Grid'],
    ['#mQuick > .fld:nth-of-type(3)', 'Sheet Title'],
    ['#qGo', 'Generate Sheet'],
    ['#mClose', 'Close']
  ];

  const TITLE_MAP = [
    ['#cloudSt', 'Cloud Sync — Click to sync or sign in'],
    ['#bLogout', 'Log out (click twice to confirm)'],
    ['#qUndo', 'Undo Ctrl+Z'],
    ['#qRedo', 'Redo Ctrl+Y'],
    ['#qSave', 'Quick Save'],
    ['#qHelp', 'User Guide'],
    ['#bEdge', 'Enable smart snapping & alignment guides for block edges and centers'],
    ['#qExp', 'Export Model & Sheets'],
    ['#inspToggle', 'Show / Hide Inspector Panel'],
    ['#tSel', 'Select & Move (V)'],
    ['#tDraw', 'Draw Mass (B)'],
    ['#tCut', 'Cut Mass'],
    ['#tMeas', 'Measure Distance (M)'],
    ['#bMulti', 'Multi-Select'],
    ['#bPlan', '2D Plan Mode'],
    ['#qShot', 'Save Snapshot'],
    ['#camHud [data-v="iso"]', 'Isometric View (click to cycle)'],
    ['#camHud [data-v="top"]', 'Top Plan View'],
    ['#camHud [data-v="front"]', 'Front / Back Elevation'],
    ['#camHud [data-v="side"]', 'Left / Right Elevation'],
    ['#camHud [data-v="eye"]', 'Eye-Level Perspective'],
    ['#shEditT', 'Edit inline on sheet'],
    ['#shSw', 'Stroke / Border thickness (mm)'],
    ['#shRot', 'North angle (°)'],
    ['[data-al="r"]', 'Align Right'],
    ['[data-al="c"]', 'Align Horizontal Center'],
    ['[data-al="l"]', 'Align Left'],
    ['[data-al="t"]', 'Align Top'],
    ['[data-al="m"]', 'Align Vertical Middle'],
    ['[data-al="b"]', 'Align Bottom'],
    ['#shHQ', 'Re-render model views at print DPI'],
    ['#pgPreset', 'Choose a building type to load a starter program']
  ];

  const PH_MAP = [
    ['#metaTitle', 'e.g. Cultural Center / Housing Complex'],
    ['#metaDesigner', 'Designer name'],
    ['#metaOrg', 'Studio / University / Firm'],
    ['#metaLoc', 'City / District'],
    ['#dname', 'New design name'],
    ['#shTxt', 'Text'],
    ['#shLenL', 'Auto'],
    ['#qTitle', '(Auto-filled from design name)']
  ];

  const HELP_AR_HTML = `<button class="sm pri2" id="bTour" style="margin-bottom:8px">بدء الجولة التعريفية</button><br>
    <b>التحديد والتحريك</b><br>• النقر على الكتلة = تحديد (دون تحريك غير مقصود)، وبعد التحديد اسحبها لتحريكها<br>• المربعات البرتقالية على الحواف لتمديد الكتلة، والمخروط الأزرق لتغيير عدد الطوابق<br>• Shift + نقر = تحديد أكثر من كتلة · النقر بالزر الأيمن = قائمة أوامر سريعة<br>
    <b>الكاميرا والرسم</b><br>• السحب في الفراغ = تدوير، الزر الأيمن = تحريك، العجلة = تقريب/تبعيد<br>• <b>وضع المسقط</b>: إسقاط عمودي بدون منظور للرسم الدقيق<br>• اختر الشكل والمادة والوظيفة والطوابق من اللوحة الجانبية ثم اسحب أداة الرسم على الأرض<br>
    <b>التحليل واللوحات والتصدير</b><br>• يمكنك تخصيص بيانات المشروع والموقع والمدينة والرياح من تبويبي "ملف" و"الشمس والرياح"<br>• تبويب "اللوحات" يوفّر لوحة سريعة A4–A1 مع جدول عنوان ومقياس رسم وتصدير PDF/PNG/JPG<br>• تصدير النموذج ثلاثي الأبعاد بصيغ Revit (IFC)، AutoCAD (DXF 2D/3D)، SketchUp (DAE)، OBJ، وCSV<br>
    <b>الاختصارات</b><br>V تحديد · B رسم · M قياس · Ctrl+C / Ctrl+V نسخ ولصق · Ctrl+D تكرار · R تدوير 90° · Shift+R تدوير 15° · L قفل · H إخفاء · Delete حذف · الأسهم تحريك · PageUp/PageDown طوابق · Ctrl+Z تراجع`;

  const HELP_EN_HTML = `<button class="sm pri2" id="bTour" style="margin-bottom:8px">Start Guided Tour</button><br>
    <b>Select &amp; Transform</b><br>• Click a mass to select (prevents accidental drags), then drag it to move<br>• Drag orange edge handles to resize dimensions, and the blue cone handle to adjust floors<br>• Shift + Click = multi-select · Right-click = quick context menu<br>
    <b>Camera &amp; Modeling</b><br>• Drag empty space = orbit, Right-drag = pan, Scroll = zoom<br>• <b>Plan 2D Mode</b>: true orthographic top view for accurate massing<br>• Pick default shape, material, zone, and floors from the Modeling inspector, then drag Draw on the ground<br>
    <b>Analysis, Sheets &amp; Export</b><br>• Customize project metadata, city coordinates, sun path, and wind direction in File &amp; Sun/Wind tabs<br>• Sheets tab builds A4–A1 presentation boards with title block, scale bar, and PDF/PNG/JPG export<br>• Export 3D model to Revit (IFC), AutoCAD (DXF 2D/3D), SketchUp (DAE), OBJ, and CSV schedule<br>
    <b>Shortcuts</b><br>V Select · B Draw · M Measure · Ctrl+C / Ctrl+V Copy/Paste · Ctrl+D Duplicate · R Rotate 90° · Shift+R Rotate 15° · L Lock · H Hide · Delete Remove · Arrows Nudge · PageUp/PageDown Floors · Ctrl+Z Undo`;

  function applyDOM() {
    applyRoot(lang);
    const lb = document.getElementById('langBtn');
    if (lb) {
      lb.textContent = lang === 'en' ? 'عربي' : 'EN';
      lb.title = lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English';
    }
    TEXT_MAP.forEach(([sel, en]) => {
      document.querySelectorAll(sel).forEach(el => setTextKeepChildren(el, en));
    });
    TITLE_MAP.forEach(([sel, en]) => {
      document.querySelectorAll(sel).forEach(el => setAttr(el, 'title', en));
    });
    PH_MAP.forEach(([sel, en]) => {
      document.querySelectorAll(sel).forEach(el => setAttr(el, 'placeholder', en));
    });
    const mh = document.getElementById('mHelp');
    if (mh) {
      const tourFn = document.getElementById('bTour') && document.getElementById('bTour').onclick;
      mh.innerHTML = lang === 'en' ? HELP_EN_HTML : HELP_AR_HTML;
      const bt = document.getElementById('bTour');
      if (bt && tourFn) bt.onclick = tourFn;
    }
  }

  function setLang(next) {
    lang = next === 'en' ? 'en' : 'ar';
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    window.MC3D_I18N.lang = lang;
    applyDOM();
    if (typeof window.onLangChange === 'function') window.onLangChange(lang);
  }

  function toggle() {
    setLang(lang === 'en' ? 'ar' : 'en');
  }

  const EN_DICT = {
    fns: {
      main: 'Primary Spaces',
      pub: 'Public & Lobby',
      spec: 'Specialized Zone',
      adm: 'Admin & Services',
      circ: 'Circulation & Cores',
      '': 'Unassigned'
    },
    cities: {
      baghdad: 'Baghdad',
      basra: 'Basra',
      erbil: 'Erbil',
      riyadh: 'Riyadh',
      jeddah: 'Jeddah',
      dubai: 'Dubai',
      cairo: 'Cairo',
      amman: 'Amman',
      beirut: 'Beirut',
      kuwait: 'Kuwait City',
      doha: 'Doha',
      istanbul: 'Istanbul',
      london: 'London',
      custom: 'Custom (Manual Coordinates)'
    },
    mats: {
      brick: 'Brick',
      glass: 'Glass',
      concrete: 'Concrete',
      stone: 'Stone',
      white: 'White Stucco',
      joint: 'Core / Connector',
      green: 'Landscape / Courtyard',
      paving: 'Paving / Plaza',
      asphalt: 'Street / Asphalt',
      water: 'Water Feature',
      context: 'Surrounding Context'
    },
    shapes: {
      box: 'Box / Rectangle',
      poly: 'Free Polygon',
      cyl: 'Cylinder',
      tri: 'Triangle',
      L: 'L-Shape',
      U: 'U-Shape',
      vault: 'Vault',
      pyr: 'Pyramid',
      ring: 'Ring',
      court: 'Courtyard Block',
      gate: 'Portal / Gate Block',
      gable: 'Gable Roof',
      shed: 'Shed Roof',
      riwaq: 'Colonnade (Riwaq)',
      tree: 'Tree',
      person: 'Person (Scale)',
      car: 'Car'
    },
    facs: {
      '': 'None',
      win: 'Window Grid',
      curtain: 'Curtain Wall',
      fins: 'Vertical Fins',
      hfins: 'Horizontal Fins',
      grid: 'Egg-Crate Grid',
      mash: 'Mashrabiya',
      balcony: 'Balconies',
      ribbon: 'Ribbon Window',
      slit: 'Vertical Slits'
    },
    modals: {
      io: 'Copy / Paste JSON Design',
      shot: 'Model Snapshot',
      help: 'User Guide',
      crop: 'Crop Snapshot',
      quick: 'Quick Sheet — Choose Views & Options',
      report: 'Area & Massing Report',
      export: 'Export — Choose Format',
      input: '',
      auth: 'Cloud Account',
      notes: 'Block Review Notes',
      prog: 'Functional Program Allocation',
      rvinfo: 'Share for Review'
    },
    qv: {
      iso: 'Isometric',
      isoB: 'Isometric (Opposite)',
      top: 'Site / Roof Plan',
      front: 'Front Elevation',
      side: 'Side Elevation',
      eye: 'Eye-Level Perspective'
    },
    vname: {
      iso: ['Iso — South-East', 'Iso — South-West', 'Iso — North-West', 'Iso — North-East'],
      front: ['Front Elevation (South)', 'Rear Elevation (North)'],
      side: ['Side Elevation (East)', 'Side Elevation (West)']
    }
  };

  window.L = function (ar, en) {
    return lang === 'en' ? en : ar;
  };

  window.MC3D_I18N = {
    lang,
    isEn: () => lang === 'en',
    setLang,
    toggle,
    applyDOM,
    en: EN_DICT,
    dn(group, key, fallback) {
      if (lang === 'en' && EN_DICT[group] && EN_DICT[group][key] !== undefined) return EN_DICT[group][key];
      return fallback;
    }
  };
})();
