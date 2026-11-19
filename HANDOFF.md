# essence.crew — Project Handoff

**Date:** 2026-11-19  
**Status:** Members page complete, rest of site is placeholder  
**Active file:** `content/members.html`  
**Dev server:** `node serve.js` → `http://localhost:55178/members.html`

---

## What this is

Landing/members page for a Portuguese car modification crew brand. Single HTML file with a scroll-driven cinematic 3D garage scene built in Three.js. No build step, no framework — raw HTML + ES modules via importmap from CDN.

---

## Project structure

```
essence_crew/
├── serve.js                  ← static file server, port 55178
├── HANDOFF.md                ← this file
└── content/
    ├── members.html          ← THE active page (all work is here)
    ├── index.html            ← old prototype, ignored
    └── *.html                ← earlier iterations, ignored
```

---

## Running it

```bash
node serve.js
# open http://localhost:55178/members.html
```

serve.js root path: `//wsl.localhost/kali-linux/home/joelt/Desktop/essence_crew/content`

---

## Tech stack

| Concern | Solution |
|---------|----------|
| 3D engine | Three.js r160 via CDN importmap |
| GLB model | Ferrari 458 from `https://threejs.org/examples/models/gltf/ferrari.glb` |
| Draco decoder | `https://www.gstatic.com/draco/versioned/decoders/1.5.6/` |
| Post-processing | `EffectComposer` → `UnrealBloomPass(0.65, 0.6, 0.48)` → `OutputPass` |
| Tone mapping | `ACESFilmicToneMapping`, exposure `0.68` |
| Car reflections | `RoomEnvironment` PMREM |
| No build step | everything inline, CDN only |

---

## Scene architecture

### Camera

- **Hero state** (scroll=0): tight close-up on back wall, `position(0, 1.8, -6)`, `lookAt(0, 1.6, -14.5)`, FOV 42
- **Showcase state** (scroll=100vh): wide bird's-eye of parked cars, `position(camX, 2.5, 10.0)`, `lookAt(0, 0, -1.5)`, FOV 48
- Two-phase pull-back: phase A (0–45% hero scroll) = garage depth reveal, phase B (45–100%) = showcase position
- Mouse parallax applies only in showcase phase (`mxPar * hB`)

### Scroll layout

```
HERO_VH  = 100  → first 100vh is hero/camera pull-back
STEP_VH  = 120  → 120vh gap between each member section
SECT_VH  = 160  → each member's reveal takes 160vh
N        = 4    → 4 members / 4 cars
```

Total scroll height: `100 + (4-1)*120 + 160 + 20 = 740vh`

### Car animation

Each car has a **sectP** value (−∞ to 1+) driven by scroll position:

| sectP | state |
|-------|-------|
| ≤ 0 | parked at SPOT position |
| 0 → PA (0.42) | pulls out of bay, moves to `Z_LANE=-1.5` via bezier |
| PA → 1.0 | slides sideways from `PRESENT_X=-3.5` to x=16 (exits right) |
| ≥ 1.0 | fully offscreen |

**Physics:**
- `curP` smoothed via spring-damper: `curPVel*0.78 + (p-curP)*0.032`
- Body roll: `clamp(-arcDvX[i]*14, -0.055, 0.055)`
- Weight-transfer pitch on accel/brake
- Wheel spin with direction reversal support

**Parking spots (desktop):**
```js
{x:-4.0, z:-4.8, ry:0.38}  // car 0 — red BMW
{x:-1.3, z:-4.8, ry:0.38}  // car 1 — blue Nissan
{x: 1.4, z:-4.8, ry:0.38}  // car 2 — orange Honda
{x: 4.1, z:-4.8, ry:0.38}  // car 3 — green Mazda
```

`PARK_RY=0.38` — herringbone angle, front faces viewer's side.  
`MODEL_ROT_Y=PI` — Ferrari GLB has rear at +Z; inner mesh rotated PI to fix.

**Reversal fix:** when `p < pp` (scrolling back), heading vector is negated so car front never spins 180°.

**Collision system:** oriented-ellipse pairwise separation, 8 iterations/frame. Parked cars (curP < 0.012) are immovable. Semi-axes: `a=2.25` (length), `b=1.1` (width).

### GLB loading fix

```js
gltf.scene.updateMatrixWorld(true);  // REQUIRED before Box3
const box = new THREE.Box3().setFromObject(proto);
```

Without this, stale matrices give wrong `sb.min.y` → car floats off floor.

---

## Lighting

### Sources

| Light | Position | Purpose |
|-------|----------|---------|
| `AmbientLight` | global | `0x060608`, ramps `0.02→0.07` with heroRaw |
| `projectorLight` SpotLight | `(0, 3.2, -7)` → wall | hero state only, dims to 0 at heroRaw=0.6 |
| 4× `SpotLight` overhead | y=3.5, z=-1.5 and z=-5.5 | `FIXTURE_ON=[true,true,false,true,true,false]` — 4 of 6 active |
| 5× `SpotLight` uplighters | y=-0.78, z=-14.1 | graze back wall upward, ramp `4.0→8.0` |
| 5× `PointLight` bar lights | y=-0.95, z=-14.0 | base of back wall, ramp `2.0→4.5` |

### Bloom-only geometry (no lights)

| Mesh | Purpose |
|------|---------|
| `PlaneGeometry(0.09, 16)` × 2 | perimeter floor strips at x=±9 |
| `PlaneGeometry(0.12, 16)` × 3 | ceiling LED strips at x=-5.5, 0, 5.5 |
| `PlaneGeometry(18, 0.055)` | back wall base bar |

`MeshBasicMaterial` white exceeds bloom threshold → `UnrealBloomPass` blooms them as continuous bars. No PointLights needed.

### Wall logo emissive ramp

```js
wallTitleMesh.material.emissiveIntensity = lerp(0.35, 0.90, easeOut(heroRaw));
```

Keeps logo readable as camera pulls back and wall receives less direct light.

---

## Wall logo (canvas texture 2048×512)

Rendered once at load, reused as both `map` and `emissiveMap`.

```
ESSENCE   — italic bold Impact, ~52% canvas height, warm white #f0ece4
            + 2 dark horizontal slice lines at ~38% and ~54% of cap height
CREW      — bold Impact, ~18.5% height, wide letter-spacing, #d8d2c4
            + flanking lines left and right
```

Both slice lines on ESSENCE and flanking lines on CREW also appear in the CSS nav/footer logo via `::before`/`::after` pseudo-elements.

---

## Materials

| Variable | Type | Usage |
|----------|------|-------|
| `floorMat` | MeshStandard | polished concrete floor, metalness 0.24 |
| `pillarMat` | MeshStandard | concrete pillars |
| `ceilMat` | MeshStandard | ceiling + beams |
| `concreteMat` | MeshStandard | back wall |
| `ochreBaseMat` | MeshStandard | pillar base band, dark ochre |
| `ductMat` | MeshStandard | HVAC ducts, near-black |
| `pipeMat` | MeshStandard | sprinkler pipes, dark red |

All procedural — `mkConcreteMap()`, `mkRoughMap()`, `mkFloorMap()` generate canvas textures with noise/stains/tire tracks.

Car paint: `MeshPhysicalMaterial` with `clearcoat:1.0`, `clearcoatRoughness:0.03`.

---

## Contact shadow blobs

```js
// Radial gradient canvas → alphaMap on MeshBasicMaterial
PlaneGeometry(4.2, 2.0)   // 4.2:2.0 = car-shaped oval
renderOrder = 2
depthWrite = false
position.y = -0.997       // just above floor at y=-1.0
```

Each blob tracks its car's `cv.x`, `cv.z`, `cv.ry` every frame.

---

## Garage geometry

| Element | Geometry | Notes |
|---------|----------|-------|
| Floor | `PlaneGeometry(50,40)` | y=-1.0 |
| Ceiling | `PlaneGeometry(50,40)` | y=3.6 |
| Back wall | `PlaneGeometry(50,7)` | z=-14.5 |
| Pillars | `BoxGeometry(0.6,5.0,0.6)` × 4 | x=±8.5, z=3.5 and z=-9.5 |
| Cross beams | `BoxGeometry(20,0.26,0.50)` | at each pillarZ |
| Long beams | `BoxGeometry(0.36,0.22,13.5)` | along pillarX, center z=-3.0 |
| HVAC ducts | Box | 4 pieces near ceiling |
| Sprinkler pipes | Cylinder | 2 runs, red |

**Pillar z placement rationale:**  
- Front row `z=3.5` — in front of camera pull-back zone, frames the opening  
- Rear row `z=-9.5` — behind parked cars at z=-4.8, never intersects arc path at z=-1.5  
- Cars at `Z_LANE=-1.5` with `PARK_RY=0.38` extend body ~1m sideways, so pillars at x=±8.5 never collide

---

## Members data (placeholder)

| # | Name | Car |
|---|------|-----|
| 01 | João Silva | BMW E30 1988 |
| 02 | Miguel Costa | Nissan Silvia S15 2000 |
| 03 | Rui Ferreira | Honda Civic EK9 1998 |
| 04 | Ana Rodrigues | Mazda RX-7 FD 1993 |

Info panels are fixed-positioned, opacity driven by scroll (`infoPanels[i].style.opacity`).

---

## What's left / TODO

### Immediate

- [ ] Replace placeholder member data with real crew info + photos
- [ ] Replace Ferrari GLB with actual crew member car models (or stylised stand-ins)
- [ ] Mobile layout polish (info panels at bottom, touch scroll feel)

### Site sections (currently stub-only)

- [ ] **Eventos** — event calendar/gallery
- [ ] **Merch** — product grid
- [ ] **Parcerias** — sponsor/partner logos
- [ ] **Contacto** — form or social links

### Infrastructure

- [ ] Git repo: `https://github.com/Parz1val6g/essence-crew-prototype`
- [ ] Vercel deploy (static, no server needed — just serve `content/` as root)
- [ ] Consider Next.js scaffold if site grows beyond static pages

### Nice-to-have 3D

- [ ] Custom car models per member (Blender → GLB export)
- [ ] Image-to-3D workflow: Blender Python scripts + reference photos per car
- [ ] Garage props: oil drums, tool cart, tire stacks

---

## Known issues / decisions

| Issue | Decision |
|-------|----------|
| Car floating after GLB load | Fixed: `gltf.scene.updateMatrixWorld(true)` before Box3 |
| Magic spin on reverse park | Fixed: negate heading vector when `reversingStateArr[i]` is true |
| Blob shadows = black rectangle | Fixed: radial gradient canvas as `alphaMap` |
| Bar lights appear as dots | Fixed: removed PointLights from strips, MeshBasicMaterial blooms as bar |
| Pillars blocking car path | Fixed: moved to z=3.5 and z=-9.5 (clear of Z_LANE=-1.5) |
| Wall logo dims as camera pulls back | Fixed: uplighter ramp inverted + emissiveIntensity ramp |

---

## Research & Decision Log

Full trail of every question asked, what was tried, why it failed, what solved it.

---

### R1 — Initial brief: cinematic automotive portfolio

**Asked:** How to make a high-end cinematic scroll experience for a car crew brand.

**Requirements stated:**
- Typography on raw concrete back wall, clearly legible
- Grazing uplights at wall base
- Smooth camera pull-back revealing pillars, floor, full architectural scale
- Cars resting solidly on floor (no floating)
- Slide-out animations with organic physics, weight-transfer

**Decisions made:**
- Three.js r160 (browser importmap, no build) — fastest iteration, no npm
- Single HTML file — entire project is one page, no routing needed
- ACESFilmic tone mapping at 0.68 exposure — cinematic film look without blowing highlights
- FogExp2 — exponential fog reads better in a dark industrial space than linear
- RoomEnvironment PMREM — gives car paint plausible reflections without HDR file
- UnrealBloomPass — required for the LED bar glow effect found later
- Two-phase camera pull-back (phase A: depth reveal, phase B: showcase) — one smooth motion feels more cinematic than a cut

---

### R2 — Logo redesign

**Asked:** Replace plain "ESSENCE" text with branded logo: italic sliced ESSENCE + flanked CREW underneath.

**Design spec resolved:**
- ESSENCE: bold italic Impact, two dark horizontal slice lines cutting through mid-glyph
- CREW: wide letter-spacing Impact, flanking lines left and right
- Same logo in CSS (nav + footer) using `::before`/`::after` pseudo-elements for slice lines
- Same logo on 3D wall via 2048×512 CanvasTexture

**Key canvas math:**
```
capTop = essY - essH*0.72*0.5    // 0.72 = Impact cap-height ratio
lineY1 = capTop + capH*0.38      // first slice
lineY2 = capTop + capH*0.54      // second slice
```
The 0.72 ratio was empirically tuned — Impact's actual cap height relative to font-size.

**Wall legibility problem found later (R5) — see below.**

---

### R3 — Bar lights: dots vs bars

**Asked:** Add bar lights near floor close to walls to make logo easier to read and give more "destaque" to cars.

**First attempt:** PointLights spaced every ~3.5m along back wall base.

**Problem:** PointLights produce spherical bloom halos → appear as separate glowing dots, not a continuous bar.

**Research:** UnrealBloomPass blooms any fragment that exceeds the threshold. MeshBasicMaterial emits at full brightness regardless of scene lighting. If a MeshBasicMaterial white plane is in the scene, it will bloom as a solid bar.

**Fix:** Removed all PointLights from perimeter and ceiling strips. Kept only 5 PointLights for the back-wall base (where actual light cast on the wall matters). Added `MeshBasicMaterial` white `PlaneGeometry` strips — these bloom as continuous bars.

**Result:** perimeter floor strips (x=±9), ceiling strips (x=-5.5, 0, 5.5), back wall base bar — all bloom correctly.

**Lesson:** For visual-only light bars in a bloom pipeline, geometry beats lights.

---

### R4 — Car floating

**Asked:** Cars still floating in the air after GLB load.

**Root cause investigation:**
- Ferrari GLB children have transforms baked into their matrices but `gltf.scene.updateMatrixWorld()` is not called automatically before we do `Box3.setFromObject()`
- Stale world matrices → `sb.min.y` reads a wrong (smaller) value → `yOff = -1.0 - sb.min.y` overcorrects → car floats

**Fix:**
```js
gltf.scene.updateMatrixWorld(true); // before Box3
const box = new THREE.Box3().setFromObject(proto);
```

**Why `true`?** Forces recursive update of all children's matrixWorld, not just the root.

---

### R5 — Contact shadows: black rectangle

**Asked:** Shadows are black boxes, not adaptive to the 3D car shape.

**Root cause:** `MeshBasicMaterial` with no texture = fully opaque rectangle.

**Research options considered:**
1. Three.js `ContactShadows` from drei — not available without React Three Fiber
2. Projected shadow map from a low camera — complex, doesn't track car rotation
3. Radial gradient canvas `alphaMap` — simple, works with any mesh shape

**Fix:** Canvas radial gradient (256×256) → `CanvasTexture` → `alphaMap` on `MeshBasicMaterial`. Geometry is `PlaneGeometry(4.2, 2.0)` — the 4.2:2.0 aspect ratio stretches the circular gradient into a car-shaped oval.

```
colorStop 0    → rgba(0,0,0, 0.90)   // dense center
colorStop 0.35 → rgba(0,0,0, 0.65)   // body shadow
colorStop 0.70 → rgba(0,0,0, 0.22)   // soft penumbra
colorStop 1    → rgba(0,0,0, 0)      // transparent edge
```

`renderOrder=2`, `depthWrite=false` — prevents z-fighting with floor.

---

### R6 — Pillars blocking cars

**Asked:** Cars are hitting the concrete pillars (postes de betão). Move pillars or make cars pass in front.

**Analysis:**
- Car arc runs at `Z_LANE = -1.5`
- Car body half-width at `PARK_RY = 0.38` ≈ 1.0 scene units lateral extent
- Original `pillarZs = [-0.5, -7.0]` — front row at z=-0.5, only 1.0 unit from Z_LANE
- At `ry = PI/2` (exiting sideways) car extends ~2.25 units in Z → definitely hits z=-0.5

**Fix options considered:**
- Push pillars further in Z (chosen) — no visual impact on composition
- Move cars in front of pillars (change Z_LANE) — would put cars closer to camera, changes feel

**Chosen:** `pillarZs = [3.5, -9.5]`
- Front row z=3.5 — in front of camera pull-back zone, frames the garage entrance
- Rear row z=-9.5 — behind parked cars at z=-4.8, never intersects z=-1.5 path

---

### R7 — Magic spin on reverse parking

**Asked:** When scrolling back, car parks rear-to-screen, then "by magic" spins 180° to face front. That's bad.

**Root cause investigation — two separate bugs:**

**Bug 1:** ry snap on `p <= 0`
```js
// BAD — was:
else if(p<=0){ curP[i]=0; curPVel[i]=0; cv.ry=sp.ry; }
//                                        ↑ instant snap to parking angle
```
When car reversed back to p=0, `cv.ry` was hard-set to `sp.ry` in one frame → visible ~π rotation.

**Fix:** Remove ry snap at `p<=0`. Let the smooth lerp settle it naturally.

**Bug 2:** Heading tracked reverse direction as forward
```js
// The arc gives velocity vector (dvx, dvz)
// When reversing, dvx/dvz point backward along the arc
// Math.atan2(dvx, dvz) gives the rear-of-car heading
// Car's model front was then pointing backward
```

**Fix:** Negate velocity when `reversingStateArr[i]` is true:
```js
const hdx = reversingArr[i] ? -dvx : dvx;
const hdz = reversingArr[i] ? -dvz : dvz;
cv.ry += (Math.atan2(hdx, hdz) - cv.ry) * 0.25;
```

**Reversal detection:** `if(p < pp) reversingStateArr[i] = true; else if(p > pp) reversingStateArr[i] = false;`

---

### R8 — Wall logo dims as camera pulls back

**Asked (implicit):** As camera pulls back from wall, the logo should stay legible.

**Problem:** Uplighters were ramping *down* with heroRaw (following the same dim pattern as projector). At full pull-back, wall received very little light.

**Fix — two parts:**
1. Invert uplighter ramp: `lerp(4.0, 8.0, easeOut(heroRaw))` — more output as camera retreats
2. Add emissive ramp on wall material: `emissiveIntensity = lerp(0.35, 0.90, easeOut(heroRaw))` — logo self-illuminates increasingly as PBR light contribution drops

---

### R9 — 3D model generation (research, not implemented)

**Asked:** Can you generate realistic 3D models? Can you generate from pictures?

**Research findings:**

**Option A — Blender MCP (mcp-for-blender plugin)**
- Already installed in this Claude Code session (`mcp__plugin_mcp-for-blender_blender__*` tools available)
- Requires Blender to be open and running with the MCP addon active
- `generate_3d` tool: text or image → one textured GLB model (1–3 min, may cost a credit)
- `execute_blender_code` tool: full Python/bpy scripting inside live Blender
- **Blocker:** User does not have Blender installed → tools can't connect

**Option B — Image-to-3D (Blender Python + reference photos)**
- Workflow: reference photos (front/side/rear) → Blender as canvas → model by hand or via AI mesh generation
- Tools like Meshy.ai, CSM.ai, Tripo3D accept photos → output GLB
- Quality depends on photo coverage (need minimum 3 angles, ideally 8+)
- **Decision:** Deferred — user interested but no Blender, no photos yet

**Option C — GLB assets from libraries**
- Sketchfab, Poly Haven, Poly Pizza — `import_asset` via blender MCP or direct download
- Best for now: use Three.js example Ferrari as placeholder, swap per-car later

**Current state:** All 4 cars use the same Ferrari 458 GLB, differentiated only by paint color. Real per-member car models are a future task.

---

### R10 — Project location

**Asked:** Where is the code saved? Can you move it to `\\wsl.localhost\kali-linux\home\joelt\Desktop\essence_crew`?

**Source:** `C:\Users\joelt\AppData\Local\Temp\brainstorm-essence`

**Action taken:**
- `Copy-Item -Recurse -Force` from temp to Desktop WSL path
- Updated `serve.js` root path from Windows temp to WSL UNC path
- Verified with HTTP 200 on `http://localhost:55178/members.html`

**Note:** Old server process may still be running from temp dir. If port 55178 conflicts, kill all node processes and restart from new location.

---

## Color palette

```
#e8d898  — primary gold/cream text
#c4612a  — accent orange-rust
#7a3818  — dark rust (stroke, shadow)
#0a0806  — near-black background
#f0ece4  — bright off-white (wall logo)
#d8d2c4  — muted white (CREW text)
```

---

## CDN dependencies (no npm)

```
three@0.160.0  — https://cdn.jsdelivr.net/npm/three@0.160.0/
Draco 1.5.6    — https://www.gstatic.com/draco/versioned/decoders/1.5.6/
Ferrari GLB    — https://threejs.org/examples/models/gltf/ferrari.glb
```
