# Crypto-Mood: Full Premium UI Revamp

## 1. Design Read (Taste Skill §0)

> **Reading this as:** crypto sentiment dashboard + marketing landing for traders and quant developers, with a dark tech / military-terminal-meets-premium-consumer language, leaning toward a custom dark design system with emerald accent, glass cards, and industrial noise texture.

### Tone: Dark Industrial Premium

The existing DNA (dark `#050505`, emerald accent, monospace terminal flavor) is a strong foundation. We **amplify** it — not replace it. The conceptual direction is:

> **"What if Bloomberg Terminal designed a stealth fighter's heads-up display?"**

- Brutally dark, deeply layered backgrounds
- Precision typography with extreme size contrast
- Nested cards with physical depth (double-bezel architecture)
- Repeating geometric patterns as section dividers (the `HorizontalScale`)
- Subtle noise texture for materiality
- Motion that serves comprehension, not decoration

### Differentiation
The `HorizontalScale` repeating gradient dividers become a **signature graphic device** — used consistently across all pages as section separators, creating a cohesive visual rhythm.

---

## 2. The Three Dials (Taste Skill §1)

| Dial | Value | Rationale |
|------|-------|-----------|
| `DESIGN_VARIANCE` | **8** | Asymmetric bento grids, offset columns, staggered card heights, grid-breaking overlaps |
| `MOTION_INTENSITY` | **7** | Scroll-triggered staggers, spring-physics gauge, hover card lift, pattern is static (texture, not motion) |
| `VISUAL_DENSITY` | **5** | Data-dashboard DNA requires moderate density, but cards breathe with generous padding (`p-6/p-8`) |

---

## 3. Color System & CSS Variables

### Token Map

```css
/* globals.css additions */
:root {
  /* Backgrounds */
  --bg-deep:     #050505;  /* page body */
  --bg-surface:  #0C0C0E;  /* card surface */
  --bg-elevated: #141416;  /* hovered cards */

  /* Pattern (for HorizontalScale) */
  --pattern: rgba(255, 255, 255, 0.06);
  --pattern-accent: rgba(16, 185, 129, 0.15);

  /* Glows */
  --glow-emerald: rgba(16, 185, 129, 0.08);
  --glow-rose:    rgba(244, 63, 94, 0.08);
  --glow-white:   rgba(255, 255, 255, 0.04);

  /* Borders */
  --border-subtle:  rgba(255, 255, 255, 0.05);
  --border-default: rgba(255, 255, 255, 0.08);
  --border-hover:   rgba(255, 255, 255, 0.15);

  /* Typography */
  --font-size-hero:     clamp(2.5rem, 6vw, 5rem);    /* 40px → 80px */
  --font-size-display:  clamp(2rem, 4vw, 3.5rem);     /* 32px → 56px */
  --font-size-title:    clamp(1.25rem, 2vw, 1.75rem); /* 20px → 28px */
  --font-size-body:     clamp(0.8125rem, 1vw, 0.9375rem); /* 13px → 15px */
  --font-size-small:    0.75rem;  /* 12px — mono labels, badges */

  /* Spacing rhythm */
  --section-gap: 6rem;     /* py-24 */
  --card-pad:    1.5rem;   /* p-6 */
  --card-radius: 1rem;     /* rounded-2xl */
}
```

### Accent Color: Existing Emerald (#10B981) — Refined, Not Replaced
- Primary buttons: `bg-emerald-500`
- Sentiment positive: `text-emerald-400` / `bg-emerald-500/10 border-emerald-500/20`
- Sentiment negative: `text-rose-400` / `bg-rose-500/10 border-rose-500/20`
- Neutral: `text-zinc-400` / `bg-zinc-900 border-white/5`

**No purple. No blue default. No warm beige.** The cold dark + emerald is the brand identity.

---

## 4. Component Architecture

### 4.1 `HorizontalScale` (NEW — Signature Graphic Device)

```tsx
// app/components/HorizontalScale.tsx
// Usage: <HorizontalScale /> or <HorizontalScale pattern="rgba(16,185,129,0.12)" />

Props:
  className?: string        — additional classes
  pattern?: string          — CSS color for the repeating diagonal lines (default: var(--pattern))

Implementation:
  h-12 w-full
  bg-[repeating-linear-gradient(315deg,var(--pattern)_0,var(--pattern)_1px,transparent_1px,transparent_50%)]
  border-y border-[var(--pattern)]
  bg-[size:12px_12px]

Purpose:
  Used between every major section on every page.
  Creates visual rhythm — the user learns "new section coming."
```

### 4.2 `MaskGradient` (NEW — Gradient Text)

```tsx
// app/components/MaskGradient.tsx
// Usage: <MaskGradient as="h1" from="from-white" via="via-zinc-300" to="to-zinc-500">Heading</MaskGradient>

Props:
  children:  React.ReactNode
  className?: string
  from?: string     — gradient start stop (default: "from-white")
  via?: string      — gradient midpoint  (default: "via-zinc-300")
  to?: string       — gradient end stop   (default: "to-zinc-500")
  as?: "h1"|"h2"|"h3"|"span"|"p"  — wrapper tag (default: "span")

Implementation:
  bg-gradient-to-r from-[from] via-[via] to-[to] bg-clip-text text-transparent

Purpose:
  Used on all primary H1s across the app for premium feel.
  Bigger font sizes than current (text-5xl→text-7xl on landing, etc.)
```

### 4.3 `GrainOverlay` (NEW — Material Texture)

```tsx
// app/components/GrainOverlay.tsx
// Usage: mount once in layout.tsx

Implementation:
  fixed inset-0 z-[60] pointer-events-none opacity-[0.025]
  backgroundImage: SVG fractal noise (inline data URI)
  backgroundRepeat: repeat
  backgroundSize: 256px 256px

Purpose:
  Subtle analog texture over the entire app.
  Visually differentiates from flat "AI dark mode" default.
```

### 4.4 `GlowCard` (NEW — Premium Card Container)

```tsx
// app/components/GlowCard.tsx
// Usage: <GlowCard accent="emerald">content</GlowCard>

Props:
  children:   React.ReactNode
  className?: string
  accent?: "emerald"|"rose"|"blue"|"amber"|"zinc"  (default: "zinc")
  as?: "div"|"section"|"article"

Implementation (per accent):
  rounded-2xl border bg-[#0C0C0E]/80 backdrop-blur-sm
  shadow-[0_0_15px_-5px_var(--glow-{accent})]
  border-[accent]-500/10 hover:border-[accent]-500/25
  transition-all duration-500

Purpose:
  Upgraded container that supplements DoubleBezel.
  Used for: 4-layer dashboard cards, feature cards, section wraps.
  Glow intensifies on hover for interactive cards.
```

### 4.5 `SectionEyebrow` (NEW — Section Labels)

```tsx
// app/components/SectionEyebrow.tsx
// Usage: <SectionEyebrow icon={<Pulse size={10}/>}>LIVE TELEMETRY</SectionEyebrow>

Props:
  children:   React.ReactNode
  className?: string
  icon?:      ReactNode  — optional Phosphor icon

Implementation:
  inline-flex items-center gap-1.5
  px-3 py-1 rounded-full
  border border-white/5 bg-[#0C0C0E]
  text-[11px] uppercase tracking-[0.2em] font-mono text-zinc-500 font-bold

Purpose:
  Consistent section label across all pages.
  Replaces inline HTML patterns duplicated across 7 pages.
  Count is gated by taste skill rule: max 1 per 3 sections.
```

---

## 5. Page-by-Page Specification

### 5.1 `globals.css` — Foundation Layer

**Changes:**
1. Replace `@theme inline {}` block — keep Geist vars, add `--pattern` and `--glow-*` custom properties
2. Add `@media (prefers-reduced-motion: reduce)` block disabling all animations
3. Add keyframe for subtle breathing glow (used on active elements):
   ```css
   @keyframes glow-pulse {
     0%, 100% { box-shadow: 0 0 8px -3px var(--glow-emerald); }
     50%      { box-shadow: 0 0 20px -5px var(--glow-emerald); }
   }
   ```
4. Add `.scrollbar-thin` utilities for scrollable log feeds
5. Keep `body` background/color but remove `font-family: Arial` fallback (Geist already set)
6. Import `GrainOverlay` in layout — no global CSS change needed for it

### 5.2 `layout.tsx` — Shell

**Current:** mounts `<GlobalNav />` + children with `bg-[#050505]`

**Changes:**
1. Import and mount `<GrainOverlay />` as a sibling before `{children}`
2. Body: `bg-[#050505] text-zinc-100` (more specific than `text-[#ECECED]`)
3. Wrap children in `<main>` with scroll-smooth
4. No structural changes to the HTML hierarchy

### 5.3 `GlobalNav.tsx` — Navigation

**Current:** pill-shaped floating nav, 7 links, "LAUNCH TERMINAL" button

**Changes:**
1. **Container:** Replace raw border with `<GlowCard accent="zinc" as="header">` for subtle glow
2. **Logo:** Bigger badge (`w-6 h-6` → `w-7 h-7`), bigger text (`text-xs` → `text-sm tracking-[0.3em]`)
3. **Nav links:** Bigger padding (`px-5 py-2`), bigger text (`text-xs` → `text-sm`), bigger icons (`size={12}` → `size={14}`)
4. **Active indicator:** Stronger glow — `shadow-[inset_0_0_8px_rgba(255,255,255,0.06)]` on active pill
5. **LAUNCH TERMINAL:** Button-in-button pattern for the arrow icon (nested circle wrapper)
6. **Mobile:** Keep scrollable pill bar but bigger pills (`px-4 py-1.5 text-xs`)
7. Add `hover:shadow-[0_0_20px_-8px_var(--glow-emerald)]` transition to the whole nav

### 5.4 `page.tsx` — Landing Page

**Current:** 4 sections (Hero, Trust Strip, Feature Bento, Newsletter CTA). `text-5xl md:text-7xl` headline.

**Changes:**

**Hero Section:**
- **Eyebrow:** Use `<SectionEyebrow icon={<Pulse size={10}/>}>LIVE TELEMETRY ACTIVE</SectionEyebrow>`
- **Headline:** `text-[var(--font-size-hero)]` — "Ingesting panic." on line 1, `<MaskGradient from="from-emerald-400 via-emerald-300 to-emerald-500">Quantifying greed.</MaskGradient>` on line 2
- **Subtext:** `text-sm md:text-base` (was `text-base text-xs` — fix inconsistent sizing), `max-w-[55ch]`
- **CTAs:** "LAUNCH TERMINAL" — button-in-button arrow (`group-hover:translate-x-1 group-hover:-translate-y-[1px]`). "METHODOLOGY" — ghost button with `hover:bg-white/5`
- **Right column (sentiment preview):** Wrap in `<GlowCard accent="emerald">` instead of raw `DoubleBezel`
- **Ticker rows:** Bigger padding (`p-4`), bigger text (`text-sm` for name, `text-xs` for score)
- **Add `whileInView` stagger:** section fades up with `opacity: 0, y: 24 → opacity: 1, y: 0`, `duration: 0.7`, stagger children

**After Hero:**
- `<HorizontalScale />` — first appearance

**Trust Strip:**
- Bigger label: `text-[10px]` → `text-xs tracking-[0.25em]`
- Source names: bigger (`text-xs` → `text-sm`), more spacing (`gap-16`)
- Add subtle `hover:text-emerald-400/60` transition on each source

**Feature Bento (4-layer cards):**
- **Current:** 4 equal cards in `grid-cols-4`
- **New:** **Asymmetric layout**: L1 (Flash) spans full width, L2+L3 share a row, L4 spans full width
- **Or alternative bento (preferred):** 2+1+1 — L1 width `lg:col-span-2`, L2 `lg:col-span-1`, L3+L4 stacked in a right column
- Each card uses `<GlowCard accent="emerald">` with bigger icons (`size={24}`→`size={28}`), bigger labels (`text-xs`→`text-sm`), bigger body (`text-xs`→`text-sm`)
- Hover: card lifts `-translate-y-1` with glow intensification

**After Bento:**
- `<HorizontalScale pattern="rgba(16,185,129,0.12)" />` — accent variant

**Newsletter CTA:**
- Wrap in `<GlowCard accent="emerald">` with bigger padding (`p-10`)
- Bigger icon (`size={32}`→`size={40}`)
- Bigger heading (`text-lg`→`text-xl`)
- Bigger input (`py-3.5`→`py-4`, `text-xs`→`text-sm`)
- Button: emerald gradient `bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500`
- Submit button: nested pill with arrow icon

**Mobile collapse:**
- All asymmetric bento collapses to `grid-cols-1` below `md:`
- HorizontalScale stays full-width (it's already fluid)
- Hero stacks vertically (already done)

### 5.5 `Dashboard.tsx` — Main Telemetry View

**Current:** Local nav + 4-layer gauge left + bento cards right + chart + log feed

**Changes:**

**Nav Bar (replaces local nav at top):**
- If GlobalNav is visible (e.g., this is rendered inside dashboard/page.tsx which uses layout), remove duplicate nav
- Asset toggles: bigger pills (`px-5 py-2`), bigger text
- Search input: bigger (`w-56`, `py-2`, `text-sm`)

**Left Column — Gauge:**
- SVG gauge: `w-48 h-48` → **`w-64 h-64`** (bigger, more impactful)
- Score readout: `text-3xl` → **`text-5xl font-bold`**
- Needle: thicker `strokeWidth="3"`
- Center dot: bigger radius (`r="4"`→`r="5"`)
- Blended components label: `text-xs` 
- Wrap entire gauge in `<GlowCard accent="emerald">` with `p-8`

**Right Column — 4-Layer Bento:**
- Each card: `<GlowCard accent="emerald">` instead of raw `border border-white/5 bg-[#0C0C0E]`
- Card heights: allow auto-height (remove fixed `h-44`) for content flexibility
- Score display: bigger (`text-sm`→`text-xl font-bold`)
- Layer label: `text-xs`→`text-sm tracking-[0.15em]`
- Detail rows: `text-[10px]`→`text-xs`
- The Fear & Greed card loses the `animate={{ scale: [1, 1.01, 1] }}` breathing (banned by creation-gotchas — no looping attention-seeking motion). Replace with static glow

**Middle Divider:**
- `<HorizontalScale />` between the bento section and the chart section

**Chart Section:**
- Container: bigger padding (`p-6`→`p-8`)
- Chart takes 60% (already `lg:col-span-7`)
- Log feed: 40% (already `lg:col-span-5`)

**Log Feed (right of chart):**
- Bigger text entries (`text-[10.5px]`→`text-xs`)
- Bigger source tags `[SOURCE]`
- Bigger score values
- Expandable details: bigger font for reasoning text
- Container height: `h-[320px]` (was `h-[280px]`)

**Error Banner:**
- Keep `<AnimatePresence>` with Jakub's enter recipe (opacity + translateY + blur)
- Exit subtler (just opacity + translateY -12px)

**Skeleton Loader:**
- Match new card sizes and shapes
- Keep pulse animation (gated behind `prefers-reduced-motion` at CSS level)

### 5.6 `SentimentChart.tsx` — SVG Timeline

**Current:** 500x150 SVG, pathLength animation, hover scrubber

**Changes:**
1. **ViewBox:** Keep `0 0 500 150` but scale display bigger in parent
2. **Line stroke:** `strokeWidth="2"`→**`strokeWidth="3"`** with stronger glow (`filter: drop-shadow(0 0 6px rgba(16,185,129,0.4))`)
3. **Hover dot:** `r="4"`→**`r="6"`** with white stroke `strokeWidth="2"`
4. **Hover scrubber line:** thicker (`strokeWidth="1"`→**`strokeWidth="1.5"`**)
5. **Area fill:** stronger opacity (`stopOpacity: 0.15`→**`0.25`**, `0.0`→**`0.02`**)
6. **Header labels:** `text-xs`→**`text-sm`**, score hover popup `text-sm`→**`text-lg font-bold`**
7. **No-data state:** `text-sm`→**`text-base`**
8. **Grid lines:** slightly more visible (`opacity 0.03`→**`0.05`**)
9. Reduce `pathLength` animation duration: `0.8s`→**`0.6s`** (Emil's speed rule — under 300ms ideal, but chart draw is a one-time entry, so 600ms is acceptable)

### 5.7 `methodology/page.tsx` — Algorithm Transparencv

**Changes:**
1. **H1:** `<MaskGradient from="from-white via-zinc-200 to-zinc-400">How MoodMetrics Works</MaskGradient>` — `text-4xl`→**`text-5xl md:text-6xl`**
2. **Subtext:** `text-sm`→**`text-base`**, wider tracking
3. **Formula section:** Bigger formula (`text-2xl`→**`text-3xl`**), wrap weights in their accent colors
4. **Layer cards:** Replace `DoubleBezel` with `<GlowCard accent="emerald" as="section">` for each L1-L4
5. **Layer headers:** Bigger icons (`size={16}`→**`size={20}`**), bigger titles (`text-sm`→**`text-base`**)
6. **Layer body:** `text-xs`→**`text-sm leading-relaxed`**
7. **Interpretation cards (bottom section):** `<GlowCard accent="emerald|zinc|rose">` per state, `h-72`→**`min-h-[18rem]`** (flexible height)
8. **Add `<HorizontalScale />`** between formula section and layers, and again before interpretation cards
9. **Scroll-reveal:** `whileInView` on each layer card with stagger

### 5.8 `roadmap/page.tsx` — Future Timeline

**Changes:**
1. **H1:** `<MaskGradient>Future Enhancements</MaskGradient>` — `text-4xl`→**`text-5xl md:text-6xl`**
2. **Subtext:** `text-sm`→**`text-base`**
3. **Timeline dots:** `w-16 h-16`→**`w-20 h-20`**, bigger icons (`size={20}`→**`size={24}`**)
4. **Timeline cards:** Replace `DoubleBezel` with `<GlowCard accent={phase.accent}>`
5. **Phase titles:** `text-sm`→**`text-lg`**
6. **Status badges:** bigger (`text-[9px]`→**`text-xs`**), `px-2 py-0.5`→**`px-3 py-1`**
7. **Bullet list:** `text-xs`→**`text-sm`**, wider `gap-3` (was `gap-2`)
8. **Timeline line:** thicker `w-[1px]`→**`w-[2px]`**
9. **Add `<HorizontalScale />`** after header before timeline content
10. **Scroll-reveal:** each phase entry animates in with fade-up + stagger

### 5.9 `feed/page.tsx` — Raw Ingestion

**Changes:**
1. **H1:** `<MaskGradient>System Ingestion Feed</MaskGradient>` — bigger
2. **H1 subtext:** `text-sm`→**`text-base`**
3. **Filter tabs container:** `<GlowCard accent="zinc">` wrapping the filter area
4. **Filter pills:** bigger text (`text-[10.5px]`→**`text-xs`**), bigger padding
5. **Feed items:** `<GlowCard accent="zinc" as="article">` wrapping each post
6. **Item title:** `text-xs`→**`text-sm`**, bigger leading
7. **Item content:** `text-[11px]`→**`text-sm`**, `line-clamp-3`→**`line-clamp-4`**
8. **Item metadata:** `text-[9px]`→**`text-xs`**, bigger spacing
9. **Source badges:** bigger text, more padding
10. **Add `<HorizontalScale />`** between header and filters
11. **Empty state:** bigger text, bigger padding

### 5.10 `news/page.tsx` — Publication Feed

**Changes:** (Mirror feed patterns)
1. **H1:** `<MaskGradient>Traditional News Feed</MaskGradient>` — bigger
2. **H1 subtext:** `text-sm`→**`text-base`**
3. **Filter tabs:** `<GlowCard accent="zinc">` wrapping
4. **Article cards:** `<GlowCard accent="zinc" as="article">`, `h-72`→**`min-h-[18rem]`**
5. **Publisher tag:** bigger
6. **Article title:** `text-xs`→**`text-sm`**
7. **Article content:** `text-[11px]`→**`text-sm`**
8. **Metadata footer:** bigger font
9. **Add `<HorizontalScale />`** after header
10. **Empty state:** bigger

### 5.11 `markets/page.tsx` — Quantitative Board

**Changes:**
1. **H1:** `<MaskGradient>Market Intelligence</MaskGradient>` — bigger
2. **H1 subtext:** `text-sm`→**`text-base`**
3. **Asset rows:** `<GlowCard accent="zinc">` wrapping each row
4. **Asset symbol box:** `w-6 h-6`→**`w-8 h-8`**, bigger text
5. **Asset name:** `text-xs`→**`text-sm`**
6. **Price:** `text-sm`→**`text-lg`**
7. **Metric labels:** `text-[10px]`→**`text-xs`**
8. **Vol momentum:** `text-sm`→**`text-lg`** with glow on surge/decline
9. **Community metrics:** bigger text
10. **Add `<HorizontalScale />`** between header and data rows
11. **Grid spacing:** `gap-6`→**`gap-8`** between rows

### 5.12 `simulator/page.tsx` — Weight Workshop

**Changes:**
1. **H1:** `<MaskGradient>Weight Simulator</MaskGradient>` — bigger
2. **H1 subtext:** `text-sm`→**`text-base`**
3. **Sliders panel:** `<GlowCard accent="emerald">` wrapping
4. **Slider labels:** `text-xs`→**`text-sm font-bold`**
5. **Slider values:** bigger font
6. **Range input styling:** custom track with `h-2` (was `h-1`), bigger thumb
7. **Chart container:** bigger (`p-6`→**`p-8`**)
8. **Chart labels:** bigger
9. **Hover breakdown card:** `<GlowCard accent="emerald">` with bigger layer labels
10. **Add `<HorizontalScale />`** between header and main content
11. **Layer contribution grid:** bigger text (`text-[9px]`→**`text-xs`**, `text-xs`→**`text-sm`**)

---

## 6. Motion Choreography (Design Motion Principles)

### Designer Weighting

| Designer | Weight | Role |
|----------|--------|------|
| **Jakub Krehel** | Primary | Production polish — enter/exit recipes, blur + opacity + translateY, spring with `bounce: 0` |
| **Emil Kowalski** | Secondary | Speed gate — keep animations under 300-600ms, no animation on frequently triggered UI |
| **Jhey Tompkins** | Selective | Only for the gauge needle spring (playful moment in an otherwise serious app) |

### The Frequency Gate (Emil)

| Element | Frequency | Decision |
|---------|-----------|----------|
| Gauge needle update | On data refresh (~30s) | Animate (200ms spring) |
| Layer cards hover | User-initiated | Animate (150ms CSS transition) |
| Nav link hover | User-initiated | Animate (150ms) |
| Chart draw | Once per page load | Animate (600ms) |
| Section scroll-reveal | Once per scroll | Animate (700ms stagger) |
| News feed items | Scrolling | Animate entry (300ms each) |
| Error banner | Rare | Animate entry, subtle exit |
| Search/Fetch refresh | User-initiated | No animation — instant is better |
| Log feed items | On data load | Animate (200ms stagger) |
| Pattern (HorizontalScale) | Every section | **Static** — no animation, pure texture |

### Enter/Exit Recipe (Jakub)

Standard recipe used across all enters:
```tsx
initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
viewport={{ once: true, amount: 0.3 }}
transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
```

Exit recipe (subtler):
```tsx
exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
```

### Stagger Pattern

```tsx
// Parent container
<motion.div variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
  {items.map((item, i) => (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

### Custom Easing

All motion uses: `cubic-bezier(0.16, 1, 0.3, 1)` — the "emerald ease" (Jakub's preferred production curve — fast start, smooth deceleration, no overshoot).

Spring configurations:
- **Gauge needle:** `{ type: "spring", stiffness: 100, damping: 15, mass: 0.8 }`
- **Card hover lift:** CSS `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)` — not JS
- **CTA button press:** `whileTap={{ scale: 0.97 }}` — 150ms CSS transition

### Reduced Motion

All Motion components use `useReducedMotion()`:
```tsx
const reduce = useReducedMotion();
if (reduce) return <StaticVersion />;
```

At CSS level, globals.css includes:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 7. Typography Scale

| Element | Current | New | Component |
|---------|---------|-----|-----------|
| Landing H1 | `text-5xl md:text-7xl` | `text-5xl sm:text-6xl md:text-7xl lg:text-8xl` | `page.tsx` |
| Page H1 | `text-4xl` | `text-4xl md:text-5xl lg:text-6xl` | All inner pages |
| Section H2 | `text-3xl` | `text-2xl md:text-3xl` | Bento headers |
| Card title | `text-xs` | `text-sm font-bold` | All cards |
| Card body | `text-xs` | `text-sm leading-relaxed` | All cards |
| Mono label | `text-[10px]` | `text-xs` | Layer labels |
| Data value | `text-sm` | `text-lg font-bold` | Scores, prices |
| Badge text | `text-[9px]` | `text-[10px]` | Status badges |
| Nav text | `text-xs` | `text-sm` | GlobalNav |
| Footer/empty | `text-xs` | `text-sm` | Empty states |

---

## 8. Layout Architecture

### Section Spacing
- **Between sections:** `py-24` (6rem) — double the current `py-12`/`py-20`
- **Card padding:** `p-6` → `p-8` for primary cards
- **Page padding:** `px-6` kept, `py-12` → `py-16` for page tops
- **Gap between grid items:** `gap-6` → `gap-8`

### Asymmetric Bento Patterns

**Landing page feature section (4 layers):**
```
Desktop (lg+):
┌──────────────────────┬──────────────────────┐
│    L1 — Flash (40%)  │    L2 — Reddit (30%) │
│    col-span-7        │    col-span-5        │
├──────────────────────┼──────┬───────────────┤
│    L3 — Funding(15%) │  L4  │   (empty)     │
│    col-span-5        │  :3  │               │
└──────────────────────┴──────┴───────────────┘

Mobile (<768px): single column stack
```

**Dashboard 4-layer bento:**
```
Desktop (lg+):
┌──────────────────────┬──────────────────────┐
│    L1 — Flash (40%)  │    L2 — Reddit (30%) │
│    h-auto            │    h-auto            │
├──────────────────────┼──────────────────────┤
│    L3 — Funding(15%) │    L4 — F&G (15%)   │
│    h-auto            │    h-auto            │
└──────────────────────┴──────────────────────┘

Mobile (<768px): single column, 4 rows
```

---

## 9. Mobile Collapse Strategy

### Universal Rules (Applied to Every Page)
1. All `lg:grid-cols-*` layouts collapse to `grid-cols-1` below `md:`
2. All `col-span-*` overrides reset to `col-span-1` on mobile
3. No overlapping or rotated elements (touch targets must be rectangular and non-overlapping)
4. No `h-screen` → use `min-h-[100dvh]` everywhere
5. Section padding: `py-24` on desktop → `py-16` on mobile
6. Card padding: `p-8` on desktop → `p-5` on mobile
7. HorizontalScale: full width always (already fluid)
8. Nav: 7 links collapse to horizontal scroll pills (already done, just bigger pills)

### Mobile-Specific Overrides
- **Landing hero:** Stack vertically, center text, reduce headline `md:text-8xl`→`text-4xl` on mobile
- **Dashboard gauge:** `w-64`→`w-48` on mobile
- **News/Feed cards:** `h-72`→`min-h-[14rem]` on mobile (content determines height)
- **Markets rows:** 4 columns → 2 columns on tablet, single column on mobile
- **Simulator:** Side-by-side → stacked (sliders on top, chart below)

---

## 10. Implementation Order (Dependency-Aware)

| Step | Files | Depends On |
|------|-------|------------|
| 1 | `lib/utils.ts` (create `cn()`) | Nothing |
| 2 | `app/components/HorizontalScale.tsx` | `cn()` |
| 3 | `app/components/MaskGradient.tsx` | `cn()` |
| 4 | `app/components/GrainOverlay.tsx` | Nothing |
| 5 | `app/components/GlowCard.tsx` | `cn()` |
| 6 | `app/components/SectionEyebrow.tsx` | `cn()` |
| 7 | `app/globals.css` | Nothing (but co-depends on layout) |
| 8 | `app/layout.tsx` | `GrainOverlay` |
| 9 | `app/components/GlobalNav.tsx` | `GlowCard` |
| 10 | `app/page.tsx` | `HorizontalScale`, `MaskGradient`, `GlowCard`, `SectionEyebrow` |
| 11 | `app/components/SentimentChart.tsx` | Nothing |
| 12 | `app/components/Dashboard.tsx` | `HorizontalScale`, `GlowCard`, `SentimentChart` |
| 13 | `app/methodology/page.tsx` | `HorizontalScale`, `MaskGradient`, `GlowCard` |
| 14 | `app/roadmap/page.tsx` | `HorizontalScale`, `MaskGradient`, `GlowCard` |
| 15 | `app/feed/page.tsx` | `HorizontalScale`, `MaskGradient`, `GlowCard` |
| 16 | `app/news/page.tsx` | `HorizontalScale`, `MaskGradient`, `GlowCard` |
| 17 | `app/markets/page.tsx` | `HorizontalScale`, `MaskGradient`, `GlowCard` |
| 18 | `app/simulator/page.tsx` | `HorizontalScale`, `MaskGradient`, `GlowCard` |
| 19 | `context.md` | All of the above |
| 20 | `npm run lint && npm run build` | All of the above |

---

## 11. Verification Plan

### Automated
1. `npm run lint` — zero ESLint errors
2. `npm run build` — zero TypeScript errors, successful compilation

### Manual (click through all routes)
| Route | Verify |
|-------|--------|
| `/` | Hero mask text, asymmetric bento, HorizontalScale dividers, grain visible |
| `/dashboard` | Bigger gauge, glow cards, pattern divider, chart draw animation |
| `/methodology` | Masked H1, glow layer cards, HorizontalScale between sections |
| `/roadmap` | Masked H1, bigger timeline dots, glow cards |
| `/feed` | Masked H1, glow feed items, filter in glow container |
| `/news` | Masked H1, glow article cards |
| `/markets` | Masked H1, glow data rows, bigger metrics |
| `/simulator` | Masked H1, glow slider panel, bigger chart |

### Reduced Motion
- Enable `prefers-reduced-motion: reduce` in browser DevTools
- Verify all sections render without animation jank
- Verify HorizontalScale (static texture) still renders

---

## 12. Files Summary

### 6 New Files
| File | Lines (est.) |
|------|-------------|
| `app/components/HorizontalScale.tsx` | ~15 |
| `app/components/MaskGradient.tsx` | ~25 |
| `app/components/GrainOverlay.tsx` | ~20 |
| `app/components/GlowCard.tsx` | ~45 |
| `app/components/SectionEyebrow.tsx` | ~25 |
| `lib/utils.ts` | ~5 |

### 9 Modified Files
| File | Changes |
|------|---------|
| `app/globals.css` | +CSS variables, +reduced-motion, +keyframes |
| `app/layout.tsx` | +GrainOverlay mount |
| `app/components/GlobalNav.tsx` | GlowCard container, bigger type, button-in-button |
| `app/page.tsx` | MaskGradient, HorizontalScale, GlowCard, asymmetric bento, scroll reveals |
| `app/components/Dashboard.tsx` | GlowCard cards, bigger gauge, bigger type, HorizontalScale |
| `app/components/SentimentChart.tsx` | Thicker line, bigger dots, bigger labels |
| `app/methodology/page.tsx` | MaskGradient, GlowCard, HorizontalScale, bigger type |
| `app/roadmap/page.tsx` | MaskGradient, GlowCard, bigger timeline |
| `app/feed/page.tsx` | MaskGradient, GlowCard, bigger type |
| `app/news/page.tsx` | MaskGradient, GlowCard, bigger type |
| `app/markets/page.tsx` | MaskGradient, GlowCard, bigger metrics |
| `app/simulator/page.tsx` | MaskGradient, GlowCard, bigger sliders/chart |
| `context.md` | Reflect all new/changed files |
