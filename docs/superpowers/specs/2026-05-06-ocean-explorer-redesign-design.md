# Ocean Explorer — Site Redesign Design Spec

**Date:** 2026-05-06
**Status:** Approved by user, pending spec review
**Owner:** Rithvik

## 1. Vision

A cinematic personal site that descends through the ocean. Each scroll takes the visitor deeper into both the ocean and the person — diver → marine biologist → Eagle Scout → quiet personal core. Cinematic enough to feel expensive, weird enough to feel human, restrained enough to feel earned.

The current site reads as a generic "tropical portfolio." The redesign replaces that with a single signature concept (the dive) executed precisely, supported by a real visual language and selectively delightful interactions.

## 2. Goals & Non-Goals

### Goals
- Establish a distinctive visual identity that doesn't read as AI-generated or template-driven.
- Deliver a memorable first impression via a scroll-driven cinematic descent on the home page.
- Replace generic typography (Inter + Merriweather) and palette with a deliberate system.
- Make the site feel premium, performant, and accessible across all entry points.
- Apply the new design language consistently to home, contact, blog index, individual blog posts, and 404.

### Non-Goals
- Re-authoring blog post *content*. The five existing posts are migrated to the new layout but their text/images stay unchanged.
- New CMS or content collections. The current per-post `.astro` files are preserved structurally.
- Adding new pages beyond the existing set + a new 404.
- Backend or API work. This is a static-site visual + interaction overhaul.

## 3. Visual Language

### 3.1 Palette (depth-driven)

The home page interpolates between palettes as the visitor scrolls. Other pages each pin to one palette.

| Zone | Background | Foreground | Accent | Notes |
|---|---|---|---|---|
| **Sunlit (0–200m)** | `#A6DDF0` → `#E8F6FB` (sun-side gradient) | `#062538` | `#F4D27A` (warm sun) | Light, optimistic. Used on home hero + contact page. |
| **Twilight (200–1000m)** | `#1B5E7E` → `#0E3F58` | `#E8F1F5` | `#7BD8E0` (cool teal) | Photographic, muted. |
| **Midnight (1000–4000m)** | `#0A1628` → `#06101D` | `#D6DCE5` | `#7BFFB1` (faint cyan-green bioluminescence) | First bioluminescent points appear. |
| **Abyss (4000m+)** | `#03060B` | `#E0DAC8` | `#7BFFB1` + `#F4D27A` (warm bioluminescent gold for scouting) | Deepest, most personal. |
| **Surface (footer)** | `#F4EDE0` (dawn cream) | `#1A1410` | `#F4D27A` | Re-brightening; emotional resolution. |

All palette values are CSS custom properties in `src/styles/tokens.css` and animated via GSAP rather than swapping classes.

### 3.2 Typography

| Role | Family | Source | Notes |
|---|---|---|---|
| Display | **Fraunces** (variable) | self-hosted via `@fontsource-variable/fraunces` | Vary `softness` and `wonk` axes per zone — sharper in Twilight (research), softer in Abyss (personal). |
| Body | **General Sans** | self-hosted from Fontshare | Quiet, well-crafted, doesn't fight Fraunces. |
| Mono / metadata | **JetBrains Mono** | self-hosted | Depth meter, image captions, post metadata. |

Inter and Merriweather are removed entirely.

### 3.3 Motion principles

- Easing defaults: `expo.out` for entrances, `power3.inOut` for scroll-driven transitions. Linear is forbidden except for shader uniforms.
- Durations: 600–1200ms for component reveals; scroll-driven animations follow the scroll velocity, not fixed timing.
- One signature interaction per zone. Never two competing for attention.
- Every animation has a `prefers-reduced-motion` static fallback that is intentionally laid out, not just "the same thing without animation."

## 4. Tech Stack

### 4.1 Existing (preserved)
- Astro 5.12.9
- React 19.1.1 (for interactive islands)
- Tailwind CSS 3.4.3 (config rewritten with new tokens)
- MDX (already installed, used for blog where applicable)
- TypeScript

### 4.2 New dependencies

```
gsap                          // scroll-driven timelines + tweening
@studio-freight/lenis         // smooth scroll
three                         // WebGL bioluminescence + caustics
framer-motion                 // React-island microinteractions
@fontsource-variable/fraunces // self-hosted Fraunces
```

General Sans and JetBrains Mono are self-hosted as static woff2 files in `public/fonts/`.

### 4.3 Performance gating

All heavy animation code is loaded via dynamic `import()`. The orchestrator checks the following before instantiating any WebGL scene or Lenis instance:

```ts
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
const saveData = (navigator as any).connection?.saveData === true;
const useFullExperience = !reduceMotion && !lowMemory && !saveData;
```

If `useFullExperience` is false: WebGL scenes are not loaded, Lenis is disabled (native scroll), the cursor falls back to system, and palette transitions become CSS `transition` instead of GSAP.

### 4.4 Bundle budget

- Initial route HTML/CSS: < 50kb gzipped.
- Initial JS (chrome + Lenis + GSAP core): < 80kb gzipped.
- Lazy WebGL bundle (Three.js + scenes): < 200kb gzipped, loaded only when entering Twilight zone.
- Total page weight on home (excluding images): < 400kb gzipped.
- Lighthouse targets: ≥90 desktop performance, ≥80 mobile.

## 5. File Structure

### 5.1 New + modified files

```
src/
  components/
    hero/
      DiveHero.astro              [NEW] orchestrator, replaces Hero.astro
      DiveHero.client.tsx         [NEW] React island: WebGL + scroll timeline
      DepthMeter.tsx              [NEW] floating "current depth" readout
      CursorFish.tsx              [NEW] custom cursor, hero only
      zones/
        SunlitZone.astro          [NEW]
        TwilightZone.astro        [NEW]
        MidnightZone.astro        [NEW]
        AbyssZone.astro           [NEW]
        ResurfaceZone.astro       [NEW] footer transition
    chrome/
      Nav.astro                   [REPLACES Header.astro]
      Footer.astro                [REWRITE existing]
    blog/
      BlogIndex.astro             [NEW] editorial magazine layout
      BlogCard.astro              [NEW] reusable, category-tinted
      BlogPostLayout.astro        [NEW] long-form editorial wrapper
      BlogPreview.astro           [DELETE] superseded by BlogIndex
    photography/
      Lightbox.tsx                [NEW] React island
      PhotoCard.astro             [REWRITE existing]
    motion/
      Bioluminescence.client.tsx  [NEW] Three.js particle scene
      Caustics.client.tsx         [NEW] shader-driven light caustics
      KelpCorner.astro            [NEW] hand-drawn SVG corner ornaments
      ScrollProgress.tsx          [NEW] thin top depth-meter line
    fx/
      RevealOnScroll.tsx          [NEW] reusable wrapper
      ParallaxImage.tsx           [NEW]
    Welcome.astro                 [DELETE] legacy
  layouts/
    Layout.astro                  [EXTEND] add theme + motion providers
    BlogLayout.astro              [NEW] for individual blog posts
  pages/
    index.astro                   [REWRITE] composition of zones
    contact.astro                 [REWRITE] surfaced calm form
    404.astro                     [NEW] "lost at sea" easter egg
    blog/
      index.astro                 [NEW] editorial magazine
      1.astro–5.astro             [MIGRATE] wrap with new BlogLayout
  styles/
    global.css                    [REWRITE]
    tokens.css                    [NEW] CSS custom properties for zones
  lib/
    motion/
      lenis.ts                    [NEW] smooth scroll instance
      gsap.ts                     [NEW] shared GSAP setup
      depth.ts                    [NEW] scroll-position → depth-zone map
    hooks/
      useDepthZone.ts             [NEW]
      useReducedMotion.ts         [NEW]
public/
  fonts/                          [NEW] self-hosted woff2 files
tailwind.config.mjs               [REWRITE] new tokens
package.json                      [UPDATE] new deps
```

### 5.2 Deletions

- `src/components/Hero.astro` (replaced by `hero/DiveHero.astro`)
- `src/components/Header.astro` (replaced by `chrome/Nav.astro`)
- `src/components/BlogPreview.astro` (superseded by `blog/BlogIndex.astro` + `BlogCard.astro`)
- `src/components/Welcome.astro` (legacy, unused)

## 6. Page-by-Page Treatment

### 6.1 Home (`/`)

A five-zone scroll-driven descent. The page is one continuous scroll; Lenis manages smooth scroll velocity; GSAP ScrollTrigger pins/animates within each zone.

#### Zone 1 — Sunlit (0–200m)
- Full viewport. Background: sunlit gradient with shader-driven light caustics rippling subtly.
- Center: name "Rithvik" set in ~14vw Fraunces (variable, soft). Letters reveal staggered over 1.2s on load.
- Below name: single line of identity copy in General Sans (e.g., "Marine biology student. Scuba diver. Eagle Scout. Field notes from the surface and below.").
- After 2s idle: small "↓ Descend" prompt fades in at bottom.
- **CursorFish** active here only. Disappears as the visitor scrolls past the zone.

#### Zone 2 — Twilight (200–1000m)
- Featured underwater photography portfolio.
- Layout: scroll-pinned section title (large Fraunces) on the left while a 3-column staggered photo grid scrolls past on the right.
- Each photo enters desaturated/blue-tinted, blooms to full color when 60% in viewport.
- Click photo → Lightbox.
- Background interpolates from Sunlit gradient to Twilight palette during transition.

#### Zone 3 — Midnight (1000–4000m)
- Research + writing.
- Three featured blog posts as large editorial cards (image left, Fraunces title + 2-line excerpt + metadata right).
- First bioluminescent particles begin drifting in the background (Three.js scene mounted at zone entry).
- Background near-black `#0A1628`.

#### Zone 4 — Abyss (4000m+)
- Eagle Scout achievements + most personal content.
- Each achievement appears as a single bioluminescent point at scroll. Hovering or focusing the point expands it into a card with title, organization, date, and description.
- Particle density at peak. Warm gold `#F4D27A` accents on scout-related items contrast against the cyan-green ambient bioluminescence.
- Hand-drawn `KelpCorner` ornaments in the four corners (SVG, static, never tiled).

#### Zone 5 — Resurface (footer)
- Background interpolates back up to dawn cream `#F4EDE0`.
- Quiet contact CTA, social links, copyright.
- **Easter egg:** clicking the `©` glyph triggers a small bobbing buoy SVG that drifts in from the right and out the left over ~6s.

#### Persistent chrome on home
- **Nav** (top, transparent over hero, gains backdrop-blur on scroll past Sunlit). Links: About / Photography / Writing / Contact. Logo is a small wave glyph.
- **DepthMeter** (bottom-right, fixed). Shows current depth in meters + zone name in JetBrains Mono. Click to jump to a zone.
- **ScrollProgress** (top, 2px tall thin glowing line, color matches current zone accent).

### 6.2 Blog index (`/blog`)

Editorial magazine layout, single palette (Twilight by default, with category tints).

- **Hero:** featured (latest) post takes ~60vh. Large Fraunces title, 2-line excerpt, hero image. Hover image: subtle parallax.
- **Filter row:** category tabs as quiet underline tabs (not pills). Default "All".
- **Grid:** 2-column responsive grid. Each `BlogCard` shows hero image, category pill (color = category), title (Fraunces), 2-line excerpt, date + read time in mono.
- Category color tints (subtle background gradient on hover):
  - Marine Biology: teal `#1B5E7E`
  - Diving: deep blue `#0E3F58`
  - Conservation: sea-green `#1F6B5C`
  - Scouting: warm gold-brown `#7A5A2E`

### 6.3 Individual blog post (`/blog/[N]`)

Long-form editorial.

- Centered text column, `max-width: 680px`. Generous line-height (1.7) on body.
- Fraunces drop cap on first paragraph (CSS `::first-letter`).
- Pull quotes set in larger italicized Fraunces, indented and accented with a left border in the post's category color.
- One or two **immersive moments** per post: a full-bleed image breaking out of the column with a caption underneath. Author marks these with a `<FullBleedImage>` component (or equivalent Astro pattern).
- Reading-progress indicator: thin glowing line at top, color-matched to category.
- "Back to blog" link at top returns to `/blog`, not home (fixes existing inconsistency).
- Existing 5 posts (`1.astro` through `5.astro`) keep their content but are wrapped in the new `BlogLayout`.

### 6.4 Contact (`/contact`)

Surfaces back up — calm sunlit palette. Provides relief after the home descent.

- Center-aligned column.
- Heading: "Say hi." (Fraunces, large, warm).
- Brief copy paragraph in General Sans.
- Three-field form: Name, Email, Message.
- Submit button labeled "Send" with a subtle wave-line underline animating on hover.
- No depth meter, no cursor fish, no bioluminescence. Just typography + breathing room.

### 6.5 404 (`/404.astro`)

- Abyss palette, near-black.
- Center: a single bobbing buoy SVG with a slow vertical sway (CSS, ~3s loop).
- Heading: "You've drifted off the map."
- Subtext: "There's nothing here but cold water."
- Single link: "Resurface →" returning to `/`.
- Functions as the home of the "lost at sea" easter egg family.

## 7. Signature Interactions (Detailed)

### 7.1 CursorFish
- **Where:** home Sunlit zone only.
- **What:** small SVG fish (~24px) follows cursor with 200ms spring delay. Grows to ~32px and "wags" tail when hovering interactive elements.
- **Hides on:** touch devices, scroll past Sunlit zone, `prefers-reduced-motion`.
- **Implementation:** `CursorFish.tsx`, framer-motion springs.

### 7.2 Depth-scroll color shift
- **Where:** entire home page.
- **What:** background color, foreground text color, and accent palette all interpolate continuously as scroll progresses.
- **Implementation:** GSAP ScrollTrigger drives CSS custom properties on `:root`. Tokens defined in `src/styles/tokens.css`.

### 7.3 Bioluminescence (WebGL)
- **Where:** Midnight zone (faint) + Abyss zone (peak).
- **What:** drifting glowing particles with subtle bloom. Density tied to scroll depth.
- **Implementation:** Three.js scene in `Bioluminescence.client.tsx`. Lazy-loaded via dynamic import when Twilight zone enters viewport. Uses `THREE.Points` with custom shader for bloom and slow Perlin-noise drift.
- **Mobile:** reduced particle count (200 vs 800 on desktop).

### 7.4 Caustics (WebGL shader)
- **Where:** Sunlit zone background.
- **What:** subtle shader-driven light caustics (the rippling light pattern seen on shallow ocean floors).
- **Implementation:** `Caustics.client.tsx`. WebGL fragment shader, fullscreen quad. Cheap (no geometry, just a frag shader).
- Optional: replaces with a static SVG/blurred PNG fallback on low-power devices.

### 7.5 Hand-drawn KelpCorner
- **Where:** Abyss zone (all four corners) + 404 page.
- **What:** static SVG ornaments, line-drawn kelp/seaweed style. Never tiled, never animated, only at corners.
- **Implementation:** inline SVG in `KelpCorner.astro`.

### 7.6 Easter eggs (lost-at-sea family)
- **Footer `©` click** → bobbing buoy drifts across screen.
- **404 page** → permanent buoy with sway.
- **Konami code (anywhere)** → small shark silhouette swims across screen once.
- All easter eggs respect `prefers-reduced-motion` (they appear but don't animate).

## 8. Accessibility

- All zones meet WCAG AA contrast (verified per zone — text on Abyss `#03060B` uses `#E0DAC8`, ratio 14.6:1).
- Keyboard navigation works in all zones; DepthMeter zones are keyboard-jumpable via `Tab` + `Enter`.
- ARIA landmarks (`<main>`, `<nav>`, `<footer>`) preserved.
- All decorative SVGs marked `aria-hidden="true"`.
- Photo lightbox is fully keyboard navigable (arrow keys, `Esc`).
- `prefers-reduced-motion`:
  - No GSAP scroll animation (palette becomes static per-zone via CSS `transition`).
  - No Lenis smooth scroll.
  - No WebGL particle motion (particles render as static dots if rendered at all).
  - CursorFish disabled.
  - Easter egg animations replaced with instant state changes.

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| WebGL scenes janky on mobile or low-end devices | `useFullExperience` gating + reduced particle counts; static fallback assets prepared |
| Smooth scroll (Lenis) interferes with anchor links / browser navigation | Lenis configured with anchor-link handlers; native scroll preserved when reduced-motion is on |
| Self-hosted fonts cause FOUC | Use `font-display: optional` for body, `font-display: swap` for display; preload critical font files in `<head>` |
| Depth-zone interpolation produces ugly intermediate colors | Interpolate in OKLCH color space (CSS `color-mix(in oklch, …)`) rather than RGB |
| Existing blog posts break under new layout | Migration is additive (wrap, don't rewrite) — content stays; only layout chrome changes |
| Bundle size creeps past budget | All heavy code dynamic-imported; CI/build check on bundle size before merge |
| Pexels placeholder photos undermine "expensive" feel even with stylization | User has confirmed real photos are in place; design assumes real photography |

## 10. Build Sequence

1. **Foundation** — install dependencies, set up self-hosted fonts, rewrite `tailwind.config.mjs` with new tokens, write `tokens.css`, scaffold `lib/motion/` infrastructure (Lenis + GSAP), write `useReducedMotion` and `useDepthZone` hooks.
2. **Hero — Sunlit + Twilight** — implement `DiveHero` orchestrator, `SunlitZone`, `TwilightZone`, `CursorFish`, `Caustics`, `DepthMeter`, `ScrollProgress`. Verify scroll-driven palette interpolation works end-to-end.
3. **Midnight + Abyss + WebGL** — `MidnightZone`, `AbyssZone`, `Bioluminescence`, `KelpCorner`. Verify lazy-loading, particle density curves, performance.
4. **Resurface + Chrome** — `ResurfaceZone`, `Nav`, `Footer`, footer easter egg.
5. **Blog system** — `BlogIndex` (`/blog`), `BlogCard`, `BlogLayout`, migrate posts 1–5.
6. **Contact + 404** — `contact.astro` rewrite, `404.astro` new.
7. **Polish & QA** — full reduced-motion audit, mobile audit, Lighthouse run, browser test (Chromium + Safari + Firefox), final visual QA. Fix issues. Run `npm run build` and verify dist output.

Each step should be a testable checkpoint — the site must build and run correctly at the end of each phase, even if not all zones are populated.

## 11. Open Questions / Future Work

- Real underwater photography for Twilight zone — user has confirmed initial set; may add more later.
- Search functionality (mentioned in `CLAUDE.md` as "planned") is **out of scope** for this redesign.
- Comment system (Giscus) — out of scope.
- Newsletter signup — out of scope.
- Astro Content Collections migration for blog — out of scope for this redesign; existing per-page `.astro` files are preserved.
