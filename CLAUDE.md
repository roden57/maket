# Maket (ماكيت): context for Claude

This is an architecture graduation project tool. The project is the Medical Educational & Training Center (المركز التعليمي والتدريبي الطبي), Bab al-Muadham, Baghdad. It belongs to Wasit University, Architecture Dept., and the student is Abdullah Mohsen.

The tool is an in-browser 3D massing modeller with sheets (A4–A1) and exports.

## Talking to the user
- Reply in **Arabic, Iraqi dialect**. Keep it short and practical. He is an architecture student, not a programmer.
- Keep his email private. Do not put it anywhere.
- When a change is done, rebuild and commit locally. **Do not push to GitHub until he explicitly asks** (his instruction, 2026-11-20). When he asks, push everything; the live site then updates by itself, usually within 1–2 minutes.
- Never test in a browser window where he is signed in to his account (sync would upload test edits). Test on `http://127.0.0.1:8000`, a different origin from `localhost`.

## Layout
- **`src/head.html`:** `<head>` and all CSS.
- **`src/body.html`:** markup.
  - Title bar and ribbon tabs: ملف، الرئيسية، عرض، الموقع، الشمس، مقطع، اللوحات، المساحات.
  - Contextual tabs: `mod` (تعديل الكتلة) and `shmod` (تنسيق اللوحة).
  - The `#modal` sections.
- **`src/app.src.js`:** the main logic. It uses no framework: three.js r128 from cdnjs, OrbitControls from jsdelivr, d3 7.9.0 from cdnjs. The placeholders `__SK2__`, `__SK3__` and `__SK4__` are filled from the sketch JSONs and feed `sketchOrig(1|2|3)`, behind the buttons `bOrig1-3` (group "مخططاتي الأصلية" in the File tab, next to the generic templates `bSketch*`). `__INIT__` is no longer used.
- **Helper modules at the repo root** (`areas-logic.js`, `shadow-heatmap-logic.js`, `section-logic.js`, `site-logic.js`, `facade-logic.js`, `mass-logic.js`, `analysis-studio-logic.js` (also `computeCirculation`: schematic visitor / student / service routes), `code-check-logic.js` (regulation checks: parking, escape distance to cores, lifts, stairs), `massing-anim-logic.js` (timeline of the massing film: title → site → steps with blocks dropping/growing in → relationships → climate → final; the 3D player is the "MASSING ANIMATION STUDIO" section of app.src.js, opened from `bAnimStudio` / `anMorphFilm`), `snap-guides-logic.js`, `i18n.js`, `occupancy-chart.js`, `unsaved-logic.js`): hand-edited sources, each with a `*.test.js`. Their load order is the `MODULES` list in `build.py`; a new module must be added there, not as a `<script>` in `body.html`.
- **`src/*.json`:** the student's original sketches.
- **`build.py`:** run `python build.py`. It writes:
  - `index.html` and `app.js` (the public site; module tags get a cache-busting `?v=`);
  - `dist/claude-artifact.html` (the single-file version used inside Claude, with modules inlined).
- **Do not edit `index.html` or `app.js` by hand.** They are generated, so edit `src/` and rebuild. (A Nov 2026 AI Studio update edited them directly and `src/` went stale; that was repaired by copying them back into `src/`.)
- The user's machine (Windows) has Git, Python 3.12 (`python`, not `python3`) and Node (installed 2026-11-19 at `C:\Program Files\nodejs`; a session started before that may need the full path).
- `build.py` refuses to overwrite `index.html`/`app.js` if they changed since the last build (fingerprints in `.build-hash.json`, committed); `--force` overrides. With Node available it also runs `node --check` and `node --test` and exits non-zero on failure.
- `og.jpg`, `icon-192.png`, `icon-512.png` are the link-preview image and icons referenced from `src/head.html`.

## Main concepts in app.src.js
- **Block:** `{id,name,shape,mat,fn,x,z,w,d,f,y0,ry,rot,pts?,hidden,lock,t?,gw?,gf?,rh?,fac?}`.
  - Shapes are in `SHAPES`, materials in `MATS`, and functions in `FNS` (with program targets).
  - `ensureIds()` gives deterministic ids `k0,k1…`.
- **State:** `{site,fh,blocks,sun,img,notes?,prog?}`.
  - Designs live in `designs{}` (localStorage `mc3d_designs`) and autosave.
  - Undo snapshots are `{s:state,n:curName}`.
- **Rendering:** everything goes through `draw(cam)`. It applies the sky and fog, and SSAO through EffectComposer when `RQ.ao`.
  - `RQ = {tex, ao, sky}` holds the render-quality toggles.
  - Captures use `prepRender()` and `endRender()`. The HQ sheet export re-renders the saved cameras.
- **Sheets:** sheets v3, with separate undo (`sHist`/`sRedoS`). The quick-undo buttons route by context.
  - Analysis images on sheets carry `it.an` (bubble, prog, solar, wind, noise, morph, sections); 2D ones redraw on sheet open, `morph`/`sections` (3D-based) when added again. `finalBoard()` builds the A1 board; `applySheetTheme(white|fn|mat)` re-renders every 3D shot through `hqPass` plus the 3D-based diagrams.
- **Notes:** `state.notes`. Each note is anchored to a block id, shown as DOM pins (`pinsBuild`/`pinsUpd`), and managed in the notes modal.
- **Program allocation:** `state.prog = {eff, sp:[{id,n,a,fn,bid,fl}]}`. The UI is the `prog` modal (`renderProg`, `progAuto`).
- **Cloud:**
  - Inside Claude, it uses `claude.use('db')`.
  - On the public site, it uses Supabase through a Firestore-like adapter (`sbCollection`), so `reconcile()` is shared.
  - Each person has an account (username + password). The `user_signup` and `user_login` RPCs handle it, and data lives under `u/<username>/`. The title bar shows 👤 name and a logout button. Logout syncs first, then clears the device.
- **Review:**
  - The student publishes with `review_put`, and the link is `https://roden57.github.io/maket/?r=<id>`.
  - The loader in `index.html` fetches the review and sets `window.MC3D_REVIEW` (`REV`), then loads `app.js`.
  - Review mode is a simplified UI with locked blocks. Reviewer notes are inserted straight into the `notes` table, and `pullNotes()` brings them to the student.
- **Exports:** IFC2X3, DXF (3D and 2D), DAE, OBJ, CSV in a ZIP, and sheets as PDF, PNG or JPG. They go through `DL.save`; outside Claude this is an `<a download>` fallback.

## Supabase (project `maket`, ref `kwoftzpxtytcgahsgjro`, eu-central-1)
- **Tables:**
  - `users(username, hash)`: one row per person.
  - `kv(path,id,data)`: private, with paths `u/<username>/…`. Reach it only through RPCs that check the user's password.
  - `reviews`: has an `owner` column. Public read.
  - `notes`: public read and insert, only for an existing review.
- **RPCs:** each takes `u`, `k` (username and password), and each is `security definer` and checks them through `_uok`.
  - `user_signup`, `user_login`
  - `kv_get`, `kv_list`, `kv_set`, `kv_del`
  - `review_put`, `review_del`, `review_list`
  - `note_del`
- The schema is kept in `src/supabase.sql` for reference.
- The publishable key in `build.py` is meant to be public.

## User preferences (keep these)
- The main ribbon layout stays as it is. Do not reorganise it into galleries.
- No glass blocks in his designs. Joints use the opaque blue `joint` material.
- Elevations are true orthographic. Captures include a ground plinth.
- Iso and eye views cycle to a new angle on each click.

## Testing
- `python build.py` runs the syntax checks and all `*.test.js` (`npm test` runs the tests alone). Add tests next to any helper module you change.
- Then open the site through a local server (`python -m http.server`, or the "python" entry in `.claude/launch.json`) and click through the ribbon with the console open.
