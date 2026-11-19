# Mobile Optimisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `content/members.html` fully responsive and performant on mobile phones without breaking the desktop cinematic experience.

**Architecture:** All changes live inside the single `content/members.html` file. CSS fixes go into the `<style>` block (extending the existing `@media(max-width:768px)` rule). JS performance tweaks go inside the existing `<script type="module">` block.

**Tech Stack:** Vanilla HTML/CSS/JS, Three.js r160 CDN, no build step.

---

## File Map

| File | What changes |
|------|-------------|
| `content/members.html` lines 8–78 | Extend `<style>` with mobile media queries |
| `content/members.html` lines 192–196 | Renderer pixel ratio cap for mobile |
| `content/members.html` lines 257–266 | Shadow map sizes for mobile |
| `content/members.html` lines 218–220 | Bloom pass strength for mobile |

---

## Identified Mobile Bugs (Red Cases)

Before fixing, these are the observable breakages on a 390px-wide viewport (iPhone 14 size):

| # | Bug | Where |
|---|-----|-------|
| B1 | Nav overflows right: `padding:16px 48px` leaves nav-links cramped/cut off | `nav` rule |
| B2 | Info panels have no padding — text butts against screen edge | `.info-panel` mobile rule |
| B3 | `.section-title` `letter-spacing:6px` overflows viewport at 390px | `.section-title` rule |
| B4 | `.site-section` `padding:80px 48px` leaves only 294px of content width on 390px screen | `.site-section` rule |
| B5 | Footer `padding:60px 48px 40px` same horizontal squeeze | `footer` rule |
| B6 | 3D: `devicePixelRatio` goes to 2–3 on mobile → 4× pixel budget; shadow maps 1024×1024 × 4 lights → GPU pressure | renderer setup |
| B7 | `height:100vh` on `#hero` measures the full viewport including browser chrome on iOS Safari → hero cuts off scroll hint | `#hero` rule |

---

## Task 1 — Nav mobile layout

**Files:**
- Modify: `content/members.html` — `<style>` block, `@media(max-width:768px)` rule (line 76)

- [ ] **Step 1: Verify the red case in DevTools**

Open Chrome DevTools → Toggle device toolbar → set to 390×844 (iPhone 14).
Expected: nav-links text is cramped, possibly touches logo or overflows off-screen.

- [ ] **Step 2: Add nav mobile overrides inside the existing media query**

Find the `@media(max-width:768px){` block (currently line 76–78) and extend it:

```css
@media(max-width:768px){
  .info-panel{right:5vw;width:calc(100vw - 10vw);top:auto;bottom:12vh;transform:none;}
  nav{padding:14px 20px;}
  .nav-links{display:none;}
}
```

Hiding nav-links on mobile is intentional: the page is a one-page scroller with no real routing yet; the TODO in HANDOFF says these sections are stubs. The logo alone reads fine.

- [ ] **Step 3: Verify green case**

DevTools 390px: nav shows only logo, no overflow. Desktop 1024px: nav-links still visible.

---

## Task 2 — Info panel mobile readability

**Files:**
- Modify: `content/members.html` — `@media(max-width:768px)` rule

- [ ] **Step 1: Verify the red case**

DevTools 390px, scroll to a member reveal. Expected: info panel text (`m-desc`, `m-name`) presses against screen edges with no padding; on small phones the panel may be unreadably small.

- [ ] **Step 2: Add info panel mobile overrides**

Inside `@media(max-width:768px)`, add after the `.info-panel` rule:

```css
  .info-panel{right:5vw;width:calc(100vw - 10vw);top:auto;bottom:10vh;transform:none;padding:0 4px;}
  .m-name{font-size:clamp(1.6rem,8vw,2.8rem);}
  .m-desc{font-size:.75rem;line-height:1.65;}
  .m-tags{gap:5px;}
  .tag{font-size:.44rem;padding:3px 7px;}
```

(This replaces the existing `.info-panel` mobile rule — keep only one.)

- [ ] **Step 3: Verify green case**

DevTools 390px: member name fits in one or two lines without overflow; description text is legible; tags don't overflow. Desktop unchanged.

---

## Task 3 — Sections and footer padding

**Files:**
- Modify: `content/members.html` — `@media(max-width:768px)` rule

- [ ] **Step 1: Verify red case**

DevTools 390px, scroll past 3D section to `#rest`. Expected: `EVENTOS` / `MERCH` titles may overflow right; footer links and copy may wrap awkwardly with 48px horizontal padding leaving very little width.

- [ ] **Step 2: Add section and footer mobile overrides**

Inside `@media(max-width:768px)`:

```css
  .site-section{padding:60px 20px;}
  .section-title{letter-spacing:3px;}
  footer{padding:40px 20px 28px;}
  .footer-links{gap:14px;flex-wrap:wrap;}
```

- [ ] **Step 3: Verify green case**

DevTools 390px: "EVENTOS" and "MERCH" section titles are fully visible; footer stacks cleanly. Desktop unchanged.

---

## Task 4 — iOS 100vh hero fix

**Files:**
- Modify: `content/members.html` — `<style>` block, `#hero` rule (line 29)

- [ ] **Step 1: Understand the problem**

iOS Safari's `100vh` = full viewport height including the hidden browser chrome. When the user first loads, the chrome is visible → the hero is taller than the screen → scroll hint is clipped below the fold.

`100dvh` (dynamic viewport height) = visible area only. It's supported on iOS 15.4+ and Chrome 108+.

- [ ] **Step 2: Add dvh fallback**

Find the `#hero` rule:
```css
#hero{height:100vh;...}
```

Change to:
```css
#hero{height:100vh;height:100dvh;...}
```

CSS processes both declarations; browsers that understand `dvh` override with it; older ones keep `100vh`.

- [ ] **Step 3: Verify green case**

On an iOS device or Safari DevTools responsive simulation: scroll hint is visible without scrolling. Desktop unaffected.

---

## Task 5 — 3D renderer mobile performance

**Files:**
- Modify: `content/members.html` — `<script type="module">` block

- [ ] **Step 1: Identify the hot paths**

Lines 193–196:
```js
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
```
Mobile phones have DPR 2–3. At DPR 2, a 390×844 screen renders at 780×1688 pixels. Three.js renders the full 3D scene at that resolution every frame. On mobile GPU this is expensive.

Lines 261–262:
```js
sp.shadow.mapSize.width=1024; sp.shadow.mapSize.height=1024;
```
4 active spotlights × 1024×1024 shadow map = 4MB shadow texture budget. Mobile GPUs have far less VRAM than desktop.

Lines 218–219:
```js
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.65,0.6,0.48);
```
UnrealBloomPass renders the scene multiple times at half-res. On mobile, any reduction helps.

- [ ] **Step 2: Cap pixel ratio and reduce shadow map on mobile**

`isMobile` is already declared at line 177. Use it.

Change line 193:
```js
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
```

Inside the `hangPositions.forEach` callback (lines 244–266), change the shadow map lines:
```js
sp.shadow.mapSize.width  = isMobile ? 512 : 1024;
sp.shadow.mapSize.height = isMobile ? 512 : 1024;
```

Change bloom construction (line 218):
```js
const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  isMobile ? 0.55 : 0.65,
  0.6,
  0.48
);
```

- [ ] **Step 3: Verify green case**

On a mid-range Android phone (or Chrome DevTools CPU throttle 4×, mobile preset), the animation should run at a stable 30+ fps. Desktop: shadows sharp, bloom unchanged.

- [ ] **Step 4: Sanity-check that isMobile is declared before use**

`isMobile` is declared at line 177 (`const isMobile = innerWidth < 768;`). The renderer is created at line 192, `hangPositions.forEach` at line 244, bloom at line 218. All are after line 177. ✓

---

## Task 6 — Scroll-track height uses innerHeight; needs resize update

**Files:**
- Modify: `content/members.html` — `<script type="module">` block, resize handler (line 222–228)

- [ ] **Step 1: Spot the bug**

Line 171: `document.getElementById('scroll-track').style.height = totalVH + 'vh';`

This is set once at load. The resize handler at line 222 updates `totalScroll` but not the DOM `scroll-track` height. On mobile, rotating the device changes `innerHeight`, so `totalScroll` becomes stale relative to the actual scroll-track DOM height.

- [ ] **Step 2: Add scroll-track DOM update to resize handler**

Find the resize handler:
```js
window.addEventListener('resize',()=>{
  renderer.setSize(innerWidth,innerHeight);
  composer.setSize(innerWidth,innerHeight);
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  totalScroll=totalVH*innerHeight/100;
});
```

Add one line:
```js
window.addEventListener('resize',()=>{
  renderer.setSize(innerWidth,innerHeight);
  composer.setSize(innerWidth,innerHeight);
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  totalScroll=totalVH*innerHeight/100;
  document.getElementById('scroll-track').style.height = totalVH + 'vh';
});
```

- [ ] **Step 3: Verify green case**

On mobile, rotate phone portrait→landscape→portrait. Scroll animation should still cover the full 740vh range after rotation. No drift between cars' positions and their info panels.

---

## Final verification checklist

After all tasks, verify on DevTools at 390×844 (iPhone 14):

- [ ] Nav: logo only visible, no overflow
- [ ] Hero scroll hint is fully visible on first load (dvh fix)
- [ ] Scroll through all 4 member reveals: info panels readable, no edge clipping
- [ ] `#rest` sections: titles fully visible, no letter-spacing overflow
- [ ] Footer: stacks cleanly with readable text
- [ ] 3D scene loads and animates without obvious stutter (DPR 1.5, 512 shadow maps)
- [ ] Rotate to landscape and back: scroll positions still correct

Desktop (1280px wide): verify nothing broke — nav links visible, sections padded, shadow maps still 1024.
