## Scope
- Update the Explore header search section to match the ocean/sand palette and tokenized fonts
- Keep glass treatment and layout; replace lime/slate colors with ocean/sand tokens

## Files to update
- `frontend/src/features/explore/components/GlobalSearchBar.tsx`

## Changes
- Container: replace `hover:border-lime-300` with `hover:border-[hsl(var(--ocean-300))]`; focused ring/border to `ring-[hsl(var(--ocean-500))]/30` and `border-[hsl(var(--sand-300))]`
- Search icon: `text-slate-400` → `text-[hsl(var(--sand-500))]`
- Input text: `text-slate-900` → `text-[hsl(var(--sand-900))]`; placeholder `text-slate-500` → `text-[hsl(var(--sand-600))]`
- Quick actions:
  - Buttons: `hover:bg-lime-100/60` → `hover:bg-[hsl(var(--ocean-50))]`
  - Icons: `text-lime-600 hover:text-lime-700` → `text-[hsl(var(--ocean-600))] hover:text-[hsl(var(--ocean-700))]`
  - Voice button: unify to ocean tokens, keep pulse when active
- Dropdown sections: map `text-slate-*` to sand tokens for headings and items to maintain consistency within this section

## Fonts
- Preserve existing `font-[family:var(--font-heading)]` and `font-[family:var(--font-body)]` already applied in the header; ensure the search input and dropdown text uses the body font

## Validation
- Run the app and visually verify the header/search section shows ocean/sand colors and token fonts
- Confirm hover/focus states use ocean ring and border, and contrast remains readable

## Notes
- No layout changes; only palette and font token alignment
- This keeps the section consistent with the HIMS palette used elsewhere