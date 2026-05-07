# Ocean Explorer — Design System

The site's voice is editorial, deliberate, and quietly ocean-themed. It reads as a magazine about a person who lives in two places: under the water and above the trail. This document captures the rules that produce that voice. Treat them as defaults; deviate only with reason.

## Type stack

Three families, each with a single role. Never substitute.

| Family | Role | CSS variable |
|---|---|---|
| Fraunces Variable | Display: headings, hero, pull quotes, the hero CTA | `var(--font-display)` |
| General Sans | Body copy, paragraph text, metadata sentences | `var(--font-body)` |
| JetBrains Mono | Eyebrows, depth/zone labels, captions, the meta utility class | `var(--font-mono)` |

### Fraunces weights

The headline rule is two weights, no more.

- **300** for display-size headings (≥48px on desktop): hero H1, all section H2s on the homepage, the blog index hero, the post hero. Keeps the top of the page airy and editorial.
- **400** for medium-size headings (<48px on desktop): post-card titles in MidnightZone, achievement titles in AbyssZone, post row titles in IndexList. Adds a second axis of hierarchy so size doesn't have to do the whole job.

Fraunces' axes are tuned per heading. Hero uses `'SOFT' 80, 'WONK' 0`. Section H2s use `'SOFT' 30`. Abyss H2 uses `'SOFT' 80, 'WONK' 18` for an organic finish at the deepest point of the page. Adjust thoughtfully — these are tuning, not decoration.

### Italic Fraunces

Reserved for two cases: (1) the lede paragraph beneath a post hero or blog index hero, (2) the hero CTA "Read the writing →". Italic carries voice, not emphasis — don't sprinkle it into body copy.

### `meta` utility

`.meta` is the canonical eyebrow/caption style: JetBrains Mono, `text-xs`, wide tracking, uppercase, muted. Use it for every eyebrow, every caption, every piece of inline metadata. Never reinvent.

## Color: depth-driven palette

The page descends through five zones. Each zone has its own palette and the colors interpolate continuously on the homepage as the user scrolls.

| Zone | --d-bg | --d-fg | --d-accent | Mood |
|---|---|---|---|---|
| Sunlit (epipelagic) | `#A6DDF0` light blue | `#062538` deep navy | `#F4D27A` warm gold | Surface light, kelp shadows |
| Twilight (mesopelagic) | `#1B5E7E` muted teal | `#E8F1F5` off-white | `#7BD8E0` cyan | Photography zone |
| Midnight (bathypelagic) | `#0A1628` near-black | `#D6DCE5` soft gray | `#7BFFB1` bioluminescent green | Writing zone |
| Abyss (abyssopelagic) | `#03060B` true black | `#E0DAC8` warm cream | `#7BFFB1` bioluminescent green | Achievements |
| Surface | `#F4EDE0` warm cream | `#1A1410` dark brown | `#F4D27A` warm gold | Resurface, footer |

Tokens live in `src/styles/tokens.css`. On the homepage, `<PaletteScroll>` interpolates them as the user scrolls. On every other page, set `<html data-zone="...">` to pin one palette.

**Always use tokens, never hex.** If you write `color: #062538` in a component, you've broken the palette interpolation. Use `var(--d-fg)`, `var(--d-bg)`, etc.

## Spacing rhythm

Zones use `pin-zone` (`relative w-full min-h-screen`) plus generous vertical padding: `py-32` (128px) for content sections, `py-40` (160px) for the deepest section (Abyss). Column gaps are `gap-12` to `gap-16`. Don't break the rhythm with arbitrary values — extend the scale instead.

## Zone structure pattern

Every homepage zone follows the same skeleton:

```astro
<section
  class="pin-zone py-32 overflow-hidden"
  data-zone-name="<name>"
  id="zone-<name>"
>
  <div class="container mx-auto px-6">
    <p class="meta mb-4"><depth-range> · <Zone Name></p>
    <h2 class="font-display font-light leading-[0.95] tracking-tightish"
        style="font-size: clamp(...); font-variation-settings: '...';">
      <!-- two-line headline with manual <br/> -->
    </h2>
    <p class="mt-6 text-lg" style="color: var(--d-fg-muted);">
      <!-- one editorial sentence -->
    </p>
    <!-- zone-specific content -->
  </div>
</section>
```

The `data-zone-name` and `id` are required — `useDepthZone` and the smooth-scroll jump targets depend on them.

## Eyebrow microcopy rules

Eyebrows are the connective tissue. One pattern per role:

| Context | Pattern | Example |
|---|---|---|
| Section eyebrow (homepage zones) | `<depth-range> · <Zone>` | `200–1000m · Twilight` |
| Hero eyebrow | Single line of brand voice | `Field notes from above and below the surface` |
| Blog index/year header | Single year, sticky | `2025` |
| Post card meta (homepage MidnightZone) | `<Category> · <Date> [· <ReadTime>]` | `Marine Biology · 2025 · 5 min read` |
| Post row meta (blog index) | `<dot> <Category>` then `<Date>` | colored dot + category, then formatted date |
| Photo caption (homepage TwilightZone) | `<Location> · <Depth>` | `Catalina · 18m` |
| Achievement meta (AbyssZone) | `<Organization> · <Date>` | `PADI · 2025` |
| Post body figcaption | Free-form, kept short | — |

When in doubt, pick the pattern that gives the most semantic value to the reader. For an underwater photo, depth means more than date. For an achievement, organization matters more than location.

## RevealOnScroll usage rules

`<RevealOnScroll>` is for slide-in motion only. Its initial state is `{ y: 24 }`, **not** `{ opacity: 0, y: 24 }`. Reasoning: opacity-0 + `client:visible` produced empty-looking sections on first load (FINDING-002). Content must be visible by default; the animation is a secondary cue, not a gate.

- Use it around `posts.map` / `photos.map` items for staggered slide-in.
- Set `delay={i * 0.05}` (or similar) for stagger.
- Don't wrap section headings in it — those should never depend on scroll to appear.

`<ParallaxImage client:visible>` is fine inside RevealOnScroll because the image renders the source `<img>` server-side; the parallax is the enhancement.

## Auto-fading top nav

The homepage uses `<HomeNav>`, a fixed top header that's hidden at scroll 0 and fades in past 0.9 viewports. The hero stays cinematic; navigation appears the moment the user starts moving down. Other pages (`/blog`, `/blog/[id]`, `/contact`) use `<BlogNav>`, which is visible from the start with a soft surface fill that strengthens after scrolling 80px.

Both navs share the same layout: `Rithvik Madhan` on the left in Fraunces, `HOME WRITING CONTACT` on the right in JetBrains Mono uppercase.

## DepthMeter widget scope

The fixed bottom-right depth widget belongs to the cinematic homepage only. It's mounted in `DiveHero.astro` and nowhere else. Don't promote it to `Layout.astro` — on routes without depth-zoned scrolling (`/blog`, `/blog/[id]`), it's noise, not signal.

## Motion principles

- Curves: `cubic-bezier(0.19, 1, 0.22, 1)` for entrances; `cubic-bezier(0.2, 0.8, 0.2, 1)` for hover micro-motion.
- Durations: 280–700ms for UI; 1.6–2.4s for ambient effects (descend bob, abyss pulse).
- Stagger: 80ms between letters in the hero name; 50–80ms between list items.
- Always honor `prefers-reduced-motion`. Global override in `global.css` clamps animation/transition durations to 0.001ms when set.

Animate `transform` and `opacity` only. Never animate layout properties (`width`, `height`, `top`, `left`).

## What this site does NOT do

- No purple/violet gradient backgrounds.
- No 3-column icon-in-colored-circle feature grid.
- No `text-align: center` on every heading. Center is reserved for the hero name and the Resurface farewell.
- No uniform bubbly border-radius. Photos and post images use `rounded-sm` (2px) — editorial, not bubbly.
- No emoji as design elements.
- No system-ui as a primary display font.
- No happy talk. The site never welcomes you or tells you how great its writing is.
