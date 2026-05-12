# Handoff: Hylift — First-Launch Onboarding

## Overview
A 3-screen onboarding sequence shown **once on first install** of Hylift, a bilingual (FR/EN) fitness, health & nutrition mobile app. The three screens autoplay sequentially with **no skip, no nav arrows, no swipe**. The user watches passively, like a brand teaser. Only the third screen has an actionable CTA. Tapping it marks onboarding complete and drops the user into the main app — no login flow, no account step.

Total runtime: **8 seconds of passive viewing**, then indefinite hold on screen 3 until the user taps the CTA.

## About the Design Files
The file in this bundle is a **design reference created in HTML** — a prototype showing intended look and behavior, **not production code to copy directly**. The task is to **recreate this design in the target codebase's existing environment** (React Native + Expo is recommended for this app, but any mobile framework works) using its established patterns and libraries.

This is the **Futurist direction** — dark HUD aesthetic: glassmorphic cards, neon glow, mesh gradient backgrounds, scanlines, monospace data callouts, photo hero with duotone treatment, animated CTA shimmer.

## Fidelity
**High-fidelity.** Exact hex values, typography, spacing, and timing are specified. Recreate pixel-perfectly using the codebase's libraries and patterns. The HTML mocks use CSS `backdrop-filter`, web SVG, and CSS animations — port these to platform-native equivalents (see "Stack notes" below).

## Stack notes (recommended for React Native + Expo)
- **expo-linear-gradient** — mesh backgrounds, CTA gradient
- **expo-blur (`BlurView`)** — glass cards on S2 (intensity ~30, tint `'dark'`)
- **react-native-svg** — HUD ring, trajectory chart, illustrations (paths/attrs port 1:1 from HTML SVG)
- **react-native-reanimated v3** — autoplay progress fills, CTA shimmer sweep, eyebrow pulse, orbit rotation
- **@expo-google-fonts/inter** — Inter 400/600/700/800
- **i18n-js + expo-localization** — FR/EN bilingual strings
- **@react-native-async-storage/async-storage** — flag `hasSeenOnboarding=true` so the flow only runs on first install

## Screens / Views

### Screen 1 — Welcome
**Purpose:** Brand introduction. First impression.
**Background:** Full-bleed dark with mesh gradient:
- `radial-gradient(120% 80% at 50% 0%, rgba(45,127,249,0.30), transparent 60%)`
- `radial-gradient(80% 60% at 100% 100%, rgba(45,127,249,0.20), transparent 70%)`
- Base linear: `#061227 → #02060F` top-to-bottom
- Scanline overlay: `repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)`

**Components (top → bottom):**
- **Status bar** (system, transparent over dark) — white time/icons
- **Progress bar zone** at y=56px from top. Three segments, 4px height, 4px gap. Active segment fills linearly over 4s with a blue→light-blue gradient and a 8px box-shadow glow `#2D7FF9`. Track color: `rgba(255,255,255,0.12)`. On S1: seg 1 filling, segs 2 & 3 empty.
- **HUD corner brackets** — 4 small L-shapes (14×14px, 1px border `rgba(139,179,255,0.55)`) in the corners of the content area (top/left/bottom/right insets: 60/16/30/16).
- **Background numeral "01"** — top-right, font: JetBrains Mono 700, 120px, transparent fill with 1px stroke `rgba(139,179,255,0.18)`.
- **Hero (centered):**
  - Outer dashed orbit: 280×280px circle, 1px border `rgba(139,179,255,0.12)`, with two blue dots on the ring (top center and bottom-right).
  - Inner circular masked photo: 220×220px diameter, athletic shot (Unsplash placeholder `photo-1571019613454-1cb2f99b2d8b` — replace with a licensed asset in production), filtered `grayscale(1) contrast(1.15) brightness(0.85)`, with a blue duotone overlay (`linear-gradient(135deg, rgba(45,127,249,0.55), rgba(10,31,68,0.85))` at `mix-blend-mode: color`).
  - Ring: `box-shadow: 0 0 0 1px rgba(139,179,255,0.35), 0 0 60px rgba(45,127,249,0.55)`.
  - Dashed border ring at `inset: -8px` rotating slowly (`spin 22s linear infinite`).
- **Eyebrow chip:** small pill, `[• SYSTEM ONLINE]`. Pulsing 5px blue dot (1.4s ease-in-out, opacity 1→0.3→1). JetBrains Mono 9px 700 uppercase, letter-spacing 0.18em, color `#8BB3FF`. Border `1px rgba(139,179,255,0.35)`, bg `rgba(45,127,249,0.06)`, radius 3, padding 4×8.
- **Headline:** "Welcome to **Hylift**" — H1, Inter 800 32pt uppercase, letter-spacing -2%, color `#FFFFFF`. The word "Hylift" uses a gradient text fill: `linear-gradient(90deg, #2D7FF9, #8BB3FF)`.
- **Subtitle:** "Your fitness OS — adaptive, intelligent, always synced." — Inter 400 17pt, line-height 1.4, color `rgba(199,211,230,0.85)`.
- **CTA zone:** empty on S1.
- **Home indicator** (system).

### Screen 2 — Telemetry
**Purpose:** Communicate tracking power.
**Background:** Same mesh + scanlines as S1.
**Progress:** seg 1 full, seg 2 filling, seg 3 empty.
**Background numeral:** "02".

**Components:**
- **HUD ring (hero, top):** SVG 240×240, max-width 230px. Concentric rings:
  - Outer dashed track: r=100, stroke `rgba(139,179,255,0.18)` 1px, dasharray `2 6`.
  - Mid track: r=80, stroke `rgba(255,255,255,0.06)` 8px.
  - Mid progress: r=80, stroke `#2D7FF9` 6px, dasharray `422 503`, rotated -90°. Add a 4px-wider glow copy underneath at 0.7 opacity using a Gaussian blur filter (stdDeviation 3).
  - Inner track: r=56, stroke `rgba(255,255,255,0.06)` 4px.
  - Inner progress: r=56, stroke `#8BB3FF` 4px, dasharray `218 352`, rotated -90°.
  - 4 tick marks at cardinal positions.
  - Center text stack: "TODAY" (mono 9px `#8BB3FF` 2px tracking), "1,847" (Inter 800 28px white), "/ 2,200 KCAL" (mono 8px `rgba(199,211,230,0.7)`).
- **Glass card stack:** 2 cards, gap 10px, padding 10×12.
  - Card style: `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(139,179,255,0.18)`, `backdrop-filter: blur(14px)` (use `BlurView intensity={30} tint="dark"` in RN), `border-radius: 14`, `box-shadow: 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`.
  - **Card 1:** 36×36 image thumbnail (radius 9, grayscale 0.4 contrast 1.1), "BREAKFAST" (white, Inter 700 10.5px uppercase, 0.04 tracking), "Avocado toast" (mono 9px `rgba(199,211,230,0.7)`), value "420" right-aligned (mono 11px 700 `#2D7FF9`, text-shadow `0 0 8px rgba(45,127,249,0.6)`).
  - **Card 2:** dumbbell glyph icon (36×36, blue gradient bg, `#8BB3FF` stroke), "PUSH DAY" / "52 min · 8 sets", value "+312".
- **Headline:** "Live **telemetry**" (gradient accent on "telemetry").
- **Subtitle:** "Calories, lifts, sleep — synced in real time."
- **CTA zone:** empty on S2.

### Screen 3 — Trajectory (with CTA)
**Purpose:** Final emotional payoff + entry point to the app.
**Background:** Same mesh as S1/S2 (slightly stronger blue glow at top).
**Progress:** All three segments full.
**Background numeral:** "03".

**Components:**
- **Floating glass badge (top of hero):** 150×30px rounded rect (radius 6), `rgba(45,127,249,0.12)` bg, `rgba(139,179,255,0.35)` border. Contains a checkmark in a soft circle and the text "+18% THIS WEEK" (Inter 700 11px white, 0.6 tracking).
- **Trajectory chart (SVG 240×220):**
  - Grid: 3 horizontal lines at y=100/140/180, stroke `rgba(139,179,255,0.08)`. Goal line at y=60 dashed.
  - Vertical scan line at x=170 from y=55 to y=200, stroke `rgba(139,179,255,0.25)` dasharray `2 3`.
  - Area fill below path: linear gradient `#2D7FF9` 0.55 → 0 alpha vertically.
  - Glow line: 8px stroke `#2D7FF9` blurred (Gaussian stdDeviation 4) at 0.55 opacity.
  - Main line: 2.5px stroke `#8BB3FF`, points `(30,175) (65,162) (100,148) (135,125) (170,100) (215,70)`.
  - Data dots: 3px white at the intermediate points, 4px white + 8px ring at x=170, larger glowing 6px blue + 4px white at x=215 (the peak).
  - "PEAK" tag at top-right peak: 38×16 rect, fill `#2D7FF9`, mono 8px 700 white.
- **Eyebrow chip:** "[• GOAL · SYNCED]" (same style as S1).
- **Headline:** "Built **for you**" (gradient accent on "for you").
- **Subtitle:** "Adaptive recommendations tuned to your trajectory every day."
- **CTA button:** "Initialize"
  - Width: full (16px horizontal screen padding), height 56pt.
  - Background: `linear-gradient(135deg, #2D7FF9 0%, #4F95FF 100%)`
  - Box-shadow: `0 6px 18px rgba(45,127,249,0.55), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.25)`
  - Border-radius: 10
  - Label: white, Inter 700 17pt uppercase, 0.06 tracking
  - Shimmer animation: a 30%-wide white gradient swipe (`linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`) skewed -20deg, animating left position from -30% → 130% over 3.4s ease-in-out infinite. In RN: use `Animated.View` translateX + `MaskedView` or just an absolutely-positioned overlay.
  - **States:** Default (above); Pressed (background `#2872DF` solid, `scale 0.98`); Disabled (`opacity: 0.4`).

## Interactions & Behavior

### Autoplay state machine
```
INSTALL → S1 (4000ms) → slide-left 400ms ease-in-out → S2 (4000ms) → slide-left 400ms → S3 (hold)
                                                                                          ↓
                                                                                       (300ms wait)
                                                                                          ↓
                                                                                       CTA fade-in 300ms
                                                                                          ↓
                                                                                       (hold until tap)
                                                                                          ↓
                                                                                       Tap CTA → setHasSeenOnboarding(true) → navigate to MainApp
```

- Use a chained `setTimeout` or a `useReducer` FSM. **Do not use `setInterval`** — it drifts.
- The slide-left transition: wrap all three screens in a horizontal flex row of `screen-width * 3` and animate `translateX` from `0 → -W → -2W`. Reanimated `withTiming(target, { duration: 400, easing: Easing.inOut(Easing.ease) })`.
- The progress-bar fill is a **separate animation** from the screen transition. When a screen becomes active, its segment animates `width: 0% → 100%` over 4000ms linear. Previous segments stay at 100%, future segments stay at 0%.

### Per-element animations
- **Eyebrow pulse dot:** opacity loop `1 → 0.3 → 1` over 1.4s.
- **Orbit ring (S1):** continuous 360° rotation, 22s linear, infinite.
- **CTA shimmer (S3):** translateX skewed band, 3.4s ease-in-out infinite (only when CTA is visible).
- **CTA press feedback:** `scale: 0.98` + darker color, 120ms ease.

### Interruption handling
- The flow is **not interruptible**. No back gesture, no skip. If the user backgrounds and returns, restart from S1 (or continue — pick one; spec says "watch passively", so restart is acceptable).

## State Management
- Local component state for the FSM: `currentSlide: 1 | 2 | 3`, `progress: number` (0–1 for the active segment).
- Persisted state: `hasSeenOnboarding: boolean` in AsyncStorage. Read on app boot; if `true`, skip onboarding entirely and route to main app.
- Locale: read from `expo-localization.getLocales()[0].languageCode`. If FR → French strings; else English.

## Design Tokens

### Colors
```ts
export const colors = {
  white: '#FFFFFF',
  blue: '#2D7FF9',        // primary, CTA, accents
  bluePressed: '#2872DF', // CTA pressed (10% darker)
  blueLight: '#8BB3FF',   // futurist accent (light blue for HUD strokes, gradient endpoints)
  blueBright: '#4F95FF',  // CTA gradient endpoint
  navy: '#0A1F44',        // deep base
  navyDeep: '#061227',    // S1/S2/S3 bg top
  navyAbyss: '#02060F',   // bg bottom
  soft: '#E8F1FE',        // illustration fills (v2 only)
  muted: '#4A5A7A',       // body text (v2 only)
  tintOnDark: '#C7D3E6',  // subtitle on navy
  tintOnDarkSoft: 'rgba(199,211,230,0.85)',
  hudStroke: 'rgba(139,179,255,0.18)',
  hudStrokeStrong: 'rgba(139,179,255,0.55)',
  hudGrid: 'rgba(255,255,255,0.04)',
  scanline: 'rgba(255,255,255,0.025)',
  glassBg: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(139,179,255,0.18)',
};
```

### Typography
```ts
export const type = {
  h1:       { family: 'Inter_800ExtraBold', size: 32, letterSpacing: -0.64, lineHeight: 33, textTransform: 'uppercase' },
  body:     { family: 'Inter_400Regular',   size: 17, letterSpacing: 0,     lineHeight: 24 },
  cta:      { family: 'Inter_700Bold',      size: 17, letterSpacing: 1.02,  textTransform: 'uppercase' },
  eyebrow:  { family: 'JetBrainsMono_700Bold', size: 9,  letterSpacing: 1.6, textTransform: 'uppercase' },
  monoData: { family: 'JetBrainsMono_700Bold', size: 11, letterSpacing: 0 },
  progress: { family: 'Inter_500Medium',    size: 13 },
};
```

### Spacing & radii
- Screen horizontal padding: 22pt (port from CSS `padding: 0 22px` in `.screen-body`)
- Hero min-height: 280pt
- Progress bar: 4pt segment height, 4pt gap, 24pt horizontal inset, 56pt from screen top
- CTA: 56pt height, radius 10, 16pt horizontal margin
- Glass card radius: 14pt
- Panel/section radius: 6pt (sharp, structural)

### Shadows
```ts
ctaShadow:    '0 6px 18px rgba(45,127,249,0.55)' // + insets handled separately
glassShadow:  '0 8px 24px rgba(0,0,0,0.35)'      // + inset highlight
hudGlow:      '0 0 0 1px rgba(139,179,255,0.35), 0 0 60px rgba(45,127,249,0.55)'
```

## Bilingual strings

```json
// en.json
{
  "s1.eyebrow": "System online",
  "s1.title":   "Welcome to {brand}",
  "s1.brand":   "Hylift",
  "s1.sub":     "Your fitness OS — adaptive, intelligent, always synced.",
  "s2.title":   "Live {accent}",
  "s2.accent":  "telemetry",
  "s2.sub":     "Calories, lifts, sleep — synced in real time.",
  "s2.today":   "TODAY",
  "s2.goal":    "/ 2,200 KCAL",
  "s2.meal":    "Breakfast",
  "s2.mealDesc": "Avocado toast",
  "s2.workout": "Push Day",
  "s2.workoutDesc": "52 min · 8 sets",
  "s3.eyebrow": "Goal · synced",
  "s3.badge":   "+18% THIS WEEK",
  "s3.peak":    "PEAK",
  "s3.title":   "Built {accent}",
  "s3.accent":  "for you",
  "s3.sub":     "Adaptive recommendations tuned to your trajectory every day.",
  "s3.cta":     "Initialize"
}
```

```json
// fr.json
{
  "s1.eyebrow": "Système en ligne",
  "s1.title":   "Bienvenue sur {brand}",
  "s1.brand":   "Hylift",
  "s1.sub":     "Votre OS fitness — adaptatif, intelligent, toujours synchronisé.",
  "s2.title":   "Télémétrie {accent}",
  "s2.accent":  "en direct",
  "s2.sub":     "Calories, séances, sommeil — synchronisés en temps réel.",
  "s2.today":   "AUJOURD'HUI",
  "s2.goal":    "/ 2 200 kcal",
  "s2.meal":    "Petit-déjeuner",
  "s2.mealDesc": "Avocado toast",
  "s2.workout": "Push day",
  "s2.workoutDesc": "52 min · 8 exercices",
  "s3.eyebrow": "Objectif · synchronisé",
  "s3.badge":   "+18% CETTE SEMAINE",
  "s3.peak":    "PIC",
  "s3.title":   "Conçu {accent}",
  "s3.accent":  "pour vous",
  "s3.sub":     "Des recommandations adaptées à votre trajectoire chaque jour.",
  "s3.cta":     "Commencer"
}
```

## Assets
- **Hero photo (S1)** and **meal thumbnail (S2)** in the HTML use Unsplash placeholder URLs (`images.unsplash.com/photo-1571019613454-1cb2f99b2d8b`, `photo-1525351484163-7529414344d8`). **Replace with licensed/owned assets for production.** Recommended specs:
  - S1 hero: 600×600+, athletic silhouette or motion shot, will be blue-duotoned at runtime.
  - S2 meal thumb: 200×200, square-cropped food photo.
- **Icons:** dumbbell, plate, checkmark, flame — all inline SVG in the HTML. Re-export as `react-native-svg` components or use `lucide-react-native`.
- **Fonts:** Inter + JetBrains Mono via `@expo-google-fonts/inter` and `@expo-google-fonts/jetbrains-mono`.

## Suggested file structure
```
src/
  screens/
    Onboarding/
      index.tsx                 // FSM, autoplay controller, layout
      Slide1Welcome.tsx
      Slide2Telemetry.tsx
      Slide3Trajectory.tsx
      ProgressBar.tsx           // 3-segment animated progress
      HudCorners.tsx            // 4 L-shaped brackets
      BackgroundNumeral.tsx     // big outlined 01/02/03
      MeshBackground.tsx        // reusable mesh + scanlines wrapper
  components/
    HudRing.tsx                 // S2 concentric ring SVG
    TrajectoryChart.tsx         // S3 line chart SVG
    GlassCard.tsx               // BlurView + border + shadow
    EyebrowChip.tsx             // pulsing dot + label
    ShimmerButton.tsx           // CTA with animated sweep
  theme/
    colors.ts
    typography.ts
    spacing.ts
  i18n/
    index.ts
    en.json
    fr.json
  storage/
    onboarding.ts               // hasSeenOnboarding flag
```

## Implementation order
1. Theme tokens + fonts loaded
2. `MeshBackground` + `HudCorners` + `BackgroundNumeral` (reusable shell)
3. `ProgressBar` with 3-segment Reanimated fill
4. `Slide1Welcome` (simplest — image + orbit + copy)
5. `Slide2Telemetry` — `HudRing` + `GlassCard`
6. `Slide3Trajectory` — `TrajectoryChart` + `ShimmerButton`
7. `Onboarding/index.tsx` — FSM stitching everything together with horizontal slide
8. AsyncStorage gate at app boot
9. i18n wiring

## Files in this bundle
- `Hylift Onboarding v3 Futurist.html` — the design spec. Open it in a browser to see the 3 phone frames (S1/S2/S3) side-by-side with annotations, plus a sidebar of tokens, timing, and layout grid.
- `README.md` — this document.
