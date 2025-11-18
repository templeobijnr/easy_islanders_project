## Goals
- Align ChatPage and ExplorePage with the HIMS palette and shared primitives
- Eliminate Tailwind ambiguous duration warnings
- Standardize pills/toggles on PillButton/CategoryPill
- Resolve structural inconsistency by removing full ExplorePage from ChatPage and introducing a lightweight ExploreStrip

## Duration Warning Fixes
- Replace `duration-[var(--transition-base)]` with `duration-200` (or `duration-300` for smoother motion):
  - `frontend/src/features/chat/ChatPage.tsx:159`
  - `frontend/src/components/ui/pill-button.tsx:82`
  - Verify `frontend/src/components/ui/category-pill.tsx` already uses `duration-200`

## Pills: Categories & Subcategories
- Refactor to shared primitives and tokens:
  - Categories → use `CategoryPill` with `active` state and ocean/sand tokens
    - Replace inline classes in `frontend/src/features/explore/components/CategoryPillButtons.tsx:45-49`
  - Subcategories → use `PillButton` (`variant='primary'` for selected, `'secondary'`/`'ghost'` for unselected)
    - Replace inline classes in `frontend/src/features/explore/components/SubcategoryPillButtons.tsx:40-61`
  - Ensure hover/focus rings use `[hsl(var(--ocean-500))]` and radius matches `var(--radius-lg)`

## ViewToggle Standardization
- Replace gradient `from-brand-500 to-cyan-500` with ocean tokens and shared primitives:
  - Wrap each option with `PillButton` (selected → `primary`, unselected → `ghost`)
  - Update `frontend/src/features/explore/components/ViewToggle.tsx:35-39`
  - Keep icons; unify focus/disabled states via PillButton

## GlobalSearchBar Token Alignment
- Map grays/lime to sand/ocean tokens:
  - Container ring/border: `ring-[hsl(var(--ocean-500))]/30`, `border-[hsl(var(--sand-300))]`, hover `border-[hsl(var(--ocean-300))]`
    - `frontend/src/features/explore/components/GlobalSearchBar.tsx:133-135`
  - Text: `text-[hsl(var(--sand-900|700|500))]` replacing `text-slate-*`
    - Inputs and labels: `148-159`, `206-219`, `258-269`, `281-289`
  - Quick actions: use ocean tokens instead of lime
    - Buttons/icons: `162-171`, `173-180`, `186-193`
  - Keep `glass` surface (white/95 + blur) unchanged

## HorizontalLane Buttons
- Keep scroll buttons glass style; swap lime accent for ocean
  - `frontend/src/features/explore/components/HorizontalLane.tsx:59-75`
- Convert “View All” to a shared `Button` (`variant='link'` or `ghost` with ocean tokens)
  - `frontend/src/features/explore/components/HorizontalLane.tsx:91-105`
- Map header `text-slate-*` to sand tokens
  - `50-52`

## ChatHeader (not currently used)
- If re-enabled, update to HIMS glass + tokens:
  - Container: glass card with `[hsl(var(--sand-200))]` border
  - Buttons: shared `Button` (`variant='ghost'`/`outline`), remove `text-ink-700`, `bg-white`
  - References: `frontend/src/features/chat/components/ChatHeader.tsx:109-116, 123, 129`

## Routing & Composition
- Remove full `ExplorePage` from `ChatPage` and introduce `ExploreStrip`:
  - Create `frontend/src/features/explore/components/ExploreStrip.tsx` with:
    - Lightweight header (emoji + title), optional category pills
    - A single `HorizontalLane` section (e.g., Trending or Gems)
    - No `min-h-screen`, no global `ListingDetailModal`
    - Uses `useExplore` for data, but isolates side-effects (no analytics/modal opens)
  - Update `frontend/src/features/chat/ChatPage.tsx:257-260` to render `ExploreStrip` instead
  - Keep standalone routing intact:
    - `frontend/src/app/routes.tsx:56-59` remains `/explore → ExplorePage`

## Implementation Steps
1) Fix Tailwind duration warnings in ChatPage and PillButton; re-run build to confirm warnings cleared
2) Refactor CategoryPillButtons/SubcategoryPillButtons to use CategoryPill/PillButton and ocean/sand tokens
3) Wrap ViewToggle options with PillButton variants; remove brand→cyan gradient
4) Align GlobalSearchBar colors to sand/ocean; replace lime and slate usages
5) Standardize HorizontalLane “View All” via Button and swap lime accents to ocean; update header text colors
6) Introduce `ExploreStrip` and swap into ChatPage; remove `ExplorePage` embed
7) Optional: Modernize ChatHeader if it’s intended for reuse

## Validation
- Start dev server and visually verify Chat and Explore for:
  - Consistent palette (sand/ocean, no lime/cyan gradients)
  - Pills/toggles share hover, focus ring, radius, motion
  - No Tailwind ambiguous class warnings in console
  - Chat shows ExploreStrip without nested full-page background or modal collisions
- Smoke tests: click category/subcategory pills, toggle views, quick actions, and lanes; confirm behavior unchanged functionally

## Rollback & Risks
- All changes are localized and can be gated per component; no API changes
- If ExploreStrip needs iteration, keep a feature flag to temporarily render old embed for comparison

## Deliverables
- Updated components with consistent tokens and primitives
- New `ExploreStrip` component and ChatPage integration
- Build free of ambiguous duration warnings