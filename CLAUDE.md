# Maket (ماكيت): context for Claude

This is an architecture graduation project tool. The project is the Medical Educational & Training Center (المركز التعليمي والتدريبي الطبي), Bab al-Muadham, Baghdad. It belongs to Wasit University, Architecture Dept., and the student is Abdullah Mohsen.

The tool is an in-browser 3D massing modeller with sheets (A4–A1) and exports.

## Talking to the user
- Reply in **Arabic, Iraqi dialect**. Keep it short and practical. He is an architecture student, not a programmer.
- Keep his email private. Do not put it anywhere.
- When a change is done, rebuild, commit and push. The live site updates by itself, usually within 1–2 minutes.

## Layout
- **`src/head.html`:** `<head>` and all CSS.
- **`src/body.html`:** markup.
  - Title bar and ribbon tabs: ملف، الرئيسية، عرض، الموقع، الشمس، مقطع، اللوحات، المساحات.
  - Contextual tabs: `mod` (تعديل الكتلة) and `shmod` (تنسيق اللوحة).
  - The `#modal` sections.
- **`src/app.src.js`:** all logic, one file. It uses no framework: three.js r128 from cdnjs plus OrbitControls from jsdelivr. The placeholders `__INIT__`, `__SK2__`, `__SK3__` and `__SK4__` are filled from the sketch JSONs.
- **`src/*.json`:** the student's original sketches.
- **`build.py`:** run `python3 build.py`. It writes:
  - `index.html` and `app.js` (the public site);
  - `dist/claude-artifact.html` (the single-file version used inside Claude).
- **Do not edit `index.html` or `app.js` by hand.** They are generated, so edit `src/` and rebuild.

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
There is no test suite. At minimum:
- run `node --check app.js` after building;
- open `index.html` through a local server (`python3 -m http.server`) and click through the ribbon with the console open.
