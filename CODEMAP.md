# members.html — Code Map

> Índice de navegação rápida. Actualizar sempre que linhas estruturais mudarem significativamente.
> Última actualização: 2026-11-19

---

## CSS (linhas 8–88)

| Selector / regra | Linha |
|---|---|
| `#hero` height + dvh fallback | ~29 |
| `.info-panel` base | ~38 |
| `.m-name`, `.m-desc`, `.m-tags`, `.tag` | ~44–55 |
| `.site-section`, `.section-title` | ~58–62 |
| `footer`, `.footer-links` | ~63–67 |
| `nav`, `.nav-links` | ~68–72 |
| **`@media(max-width:768px)`** início | 76 |
| — `nav` padding + `.nav-links` hide | 77–78 |
| — `.info-panel` mobile + padding | 79–80 |
| — `.m-name` / `.m-desc` / `.m-tags` / `.tag` | 81–84 |
| — `.site-section` / `.section-title` | 85–86 |
| — `footer` / `.footer-links` | 87–88 |

---

## JS Setup (linhas 169–240)

| Símbolo | Linha |
|---|---|
| `const isMobile` | 169 |
| `N`, `HERO_VH`, `STEP_VH`, `SECT_VH` | 170 |
| `sectP()`, `totalVH`, scroll-track height | 178–182 |
| `const PARK_RY`, `const SPOTS` mobile/desktop | 187–197 |
| Renderer init + `setPixelRatio` (DPR cap) | ~207–210 |
| Camera init `position.set(0,1.8,-6)` | 215 |
| `const bloom` (UnrealBloomPass, isMobile strength) | ~226–230 |
| Resize handler (renderer + composer + scroll-track) | ~234–239 |
| `const spotLights = []` | 253 |
| Spotlight loop — shadow map sizes (isMobile?512:1024) | ~260–276 |

---

## Wall Title Texture — `mkWallTitleTex()` (linhas 435–520)

| Subsecção | Linha |
|---|---|
| Canvas dims `W=isMobile?1240:2048, H=isMobile?480:661` | 436 |
| ESSENCE auto-fit (measureText + actualBoundingBox) | 443–450 |
| **Vertical centring** — `crewH`, `gapH`, `totalH`, `essY`, `crewY` | 454–458 |
| **Horizontal centring** — `_essDrawX` italic correction | 460–464 |
| ESSENCE draw (shadow + fill + specular) | 466–473 |
| Slice lines through ESSENCE | 476–489 |
| CREW font + draw | 492–497 |
| Flanking lines around CREW | 499–506 |
| Speckle noise | 509–513 |
| `wallTitleMesh` (PlaneGeometry, visible=false) | 519–526 |

---

## Hanging Sign + Chain Physics (linhas 528–662)

| Símbolo / secção | Linha |
|---|---|
| `SIGN_W` / `SIGN_H` (isMobile?3.1:9.3 / isMobile?1.2:3.0) | 529 |
| `CHAIN_X`, `CHAIN_N=7`, `LINK_L` | 530–532 |
| `RAIL_Z0`, `RAIL_Z1`, `RAIL_Y=3.5` | 533 |
| Rail cylinder geometry (2×) | 536–542 |
| Slider brackets (sliderL / sliderR) | 545–549 |
| `chainLinkMesh` (InstancedMesh, 2×(CHAIN_N-1)) | 552–558 |
| `_signFrontMat` / `_signEdgeMat` / `_signBackMat` | 561–564 |
| `signMesh` (BoxGeometry multi-material [edge×4, front, back]) | 566–569 |
| `_mkChain()` Verlet state init | 574–581 |
| **`tickChain(heroRaw)`** | 585–655 |
| — Rail lerp `rz` + `effL` shrink | 586–587 |
| — Pin node 0 (encodes rail velocity) | 590–591 |
| — Verlet + gravity + drag `DK=0.72` | 593–601 |
| — Constraint loop `IT=8` (length + sign-width rigid) | 603–625 |
| — Sign transform (pos + rotation.z + rotation.x clamped ±0.25) | 628–635 |
| — Slider positions | 637–638 |
| — InstancedMesh matrices | 641–652 |
| `projectorLight` (SpotLight, tracks sign) | 657–662 |

---

## Scene Geometry (linhas 664–880)

| Secção | Linhas aprox. |
|---|---|
| Pillars (`pillarXs` isMobile?[-4.5,4.5]:[-8.5,8.5]) | 668–690 |
| Ceiling panels | 691–710 |
| Floor grid / markings | 712–730 |
| Cars (BoxGeometry placeholders, SPOTS loop) | ~740–800 |

---

## Animate Loop — `animate()` (linhas 896–)

| Passo | Linha |
|---|---|
| `const heroRaw` (scroll / vh(HERO_VH)) | 902 |
| `tickChain(heroRaw)` | 903 |
| `hA`, `hB` split at 0.45 | 908–909 |
| Camera pullback (camX/Y/Z lerp) | ~910–921 |
| Camera FOV ramp | ~924 |
| Spot lights flicker + intensity ramp | 1059 |
| `signMesh.material[4].emissiveIntensity` ramp | 1065 |
| `projectorLight.target.position.copy(signMesh.position)` | 1066 |

---

## Regras de manutenção

1. **Antes de editar** → `Read CODEMAP.md` (< 1 s, ~60 linhas)
2. **Localizar** → `Read members.html offset=X limit=20` apenas nas linhas relevantes
3. **Editar** com `Edit`
4. **Actualizar** esta tabela se a linha mudar > 10 linhas ou a secção mudar de estrutura
