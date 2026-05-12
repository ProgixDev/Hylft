# Home — Historique / Accueil Tabs

**Date:** 2026-05-12
**Status:** Approved — ready for implementation plan
**Scope:** `src/app/(tabs)/home.tsx`, `src/app/(tabs)/profile.tsx`, new components under `src/components/ui` and `src/components/home`

## Goal

Below the existing **MES SEANCES** section on the home tab, render an animated segmented control with two tabs:

- **Historique** — reverse-chronological list of the user's completed workout sessions, fetched from Supabase via the existing backend.
- **Accueil** — everything currently rendered below MES SEANCES on the home page (challenge section and onwards). Unchanged.

Switching tabs swaps the view in place with the same animated indicator used by the **Jour / Semaine / Mois** segmented control on the Profile screen.

## Non-goals (v1)

- Session detail screen / expandable rows.
- Pagination beyond the initial 90-day window.
- History filters by routine type or period.
- Schema changes to `workout_logs`.

## UX

### Segmented control

- Two pills inside an iOS-glass track: **Historique**, **Accueil**.
- Default selection: **Accueil** (preserves current UX so existing users don't lose their landing view).
- Animated `BlurView` indicator with `withTiming(280ms)` translation, matching `PeriodSegment` in `src/app/(tabs)/profile.tsx:93-169`.
- Item width recalibrated for 2 segments (vs. the profile's 3) while keeping the same vertical proportions, padding, and active text color (`PERIOD_ACTIVE_NAVY = "#0A1628"`).

### Historique view

- Compact row per session:
  - Leading icon (dumbbell / fitness glyph from Ionicons).
  - Primary line: routine `name`.
  - Secondary line: `DD MMM · {duration_minutes}min · {nExercises}ex · {calories_burned} kcal`.
  - Date formatted via i18n locale.
- States:
  - **Loading:** 3 skeleton rows (reuse existing skeleton primitive if present, otherwise a local shimmer block).
  - **Error:** inline error with retry button.
  - **Empty:** centered illustration/icon + title (`history.emptyTitle`) + message (`history.emptyMessage`) + CTA button (`history.emptyCta`) that navigates to the workout tab.
- Tap on a row: no-op for v1 (room reserved for a future detail sheet).

### Accueil view

- Renders the existing JSX that today lives in `home.tsx` below the MES SEANCES carousel (Challenge section and everything after), wrapped in `{homeTab === "home" && (...)}`. No styling changes.

## Components

### `src/components/ui/SegmentedTabs.tsx` (new)

Extracted from `PeriodSegment` in `profile.tsx`. Generic, reusable.

Props:

```ts
type SegmentedTabsProps<T extends string> = {
  value: T;
  onChange: (next: T) => void;
  items: { value: T; label: string }[];
  themeType: "dark" | "light";
  itemWidth?: number; // default 92
};
```

- Internally owns the Reanimated shared value + indicator animation.
- Profile screen migrates to use this component (passing `items=[{value:"daily",label:"Jour"}, ...]`); behavior and visuals stay identical.

### `src/components/home/TrainingHistoryView.tsx` (new)

Self-contained:

- Calls `api.getWorkoutsRange(start, end)` on mount and on pull-to-refresh, with `start = today - 90d`, `end = today`.
- Maintains local `status: "idle" | "loading" | "ready" | "error"`, `sessions: WorkoutLog[]`.
- Sorts sessions desc by `(date, start_time)`.
- Derives `nExercises` from `exercises.length` (handles `null`/missing as 0).
- Renders rows, loading skeletons, error/empty states described above.

### `src/app/(tabs)/home.tsx` (modified)

- Add `const [homeTab, setHomeTab] = useState<"history" | "home">("home");`.
- Right after the MES SEANCES `AnimatedSection` (around `home.tsx:959`), insert `<SegmentedTabs ... />`.
- Wrap the existing JSX from the Challenge section through end of the existing content in `{homeTab === "home" && (...)}`.
- Render `{homeTab === "history" && <TrainingHistoryView />}` beside it.

## Data

### Source

- Table: `workout_logs` (already exists, written by `ActiveWorkoutContext.saveWorkout` via `POST /health/workouts`).
- Read endpoint: `GET /health/workouts/range?start=&end=` (already exists, exposed as `api.getWorkoutsRange`).

### Columns used

`name`, `date`, `start_time`, `duration_minutes`, `calories_burned`, `exercises` (jsonb array).

### Type (client)

```ts
type WorkoutLog = {
  id: string;
  name: string;
  date: string;            // YYYY-MM-DD
  start_time: string | null;
  duration_minutes: number;
  calories_burned: number;
  exercises: { name: string; sets: { kg: string; reps: string; completed: boolean }[] }[] | null;
};
```

A shared type is added in `src/services/api.ts` (or a `types/` sibling) and reused by `TrainingHistoryView`.

## i18n

New keys under `home.history.*`:

- `tabHistory` — "Historique" / "History"
- `tabHome` — "Accueil" / "Home"
- `emptyTitle` — "Aucune séance pour le moment" / "No sessions yet"
- `emptyMessage` — "Commencez votre première séance pour la voir ici." / "Start your first session to see it here."
- `emptyCta` — "Démarrer une séance" / "Start a session"
- `errorLoading` — "Impossible de charger l'historique." / "Couldn't load history."
- `units.min` — "min"
- `units.ex` — "ex"
- `units.kcal` — "kcal"

## Error handling

- Network or backend error from `getWorkoutsRange`: catch, set `status="error"`, render error state with retry. Existing API layer already throws on non-2xx.
- Malformed row (missing required field): skip the row and log a warn; don't crash the list.

## Testing

- Manual: empty state renders for a fresh account; switching tabs animates; saving a workout via `ActiveWorkoutContext` causes the new row to appear in the history list after navigating back to Home (or pull-to-refresh).
- Unit (optional v1): `TrainingHistoryView` sort + derived `nExercises` against a fixture of `WorkoutLog[]`.

## Risks / open questions

- **Item-width math for 2-tab segmented control**: the existing `PERIOD_ITEM_WIDTH = 92` was tuned for 3 segments. With 2 tabs the track will be narrower; we'll keep `92` as a default and let the parent override via `itemWidth` prop if visual balance needs adjustment after first render.
- **90-day window**: users with >90 days of history won't see older sessions in v1. Acceptable per scope; "load more" deferred.
- **Pull-to-refresh wiring**: if the home screen already has a `RefreshControl`, the history view subscribes to the same refresh signal via a prop; otherwise refresh is triggered only on mount + tab switch. To be confirmed during planning.
