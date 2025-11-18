## Findings
- The "Add Photo" box in the listing detail Overview tab is only a visual placeholder and does not trigger any upload logic (src/features/seller-dashboard/domains/real-estate/portfolio/ListingDetailPage/OverviewTab.tsx:255–300). 
- The portfolio map view passes only `city` and `area` to `PropertyLocationMap` (src/features/seller-dashboard/domains/real-estate/portfolio/PortfolioManagementPage.tsx:371–379). `PropertyLocationMap` requires `latitude` and `longitude`, so it renders the "Location not available" placeholder (src/components/ui/PropertyLocationMap.tsx:65–90). 
- On many listings, latitude/longitude can be null even in the detail page; without a fallback, the map appears broken.

## Plan
### 1) Wire up Photo Upload in OverviewTab
- Import the upload hook: `useUploadListingImages` from `../hooks/useRealEstateData`.
- Add a hidden `<input type="file" multiple accept="image/*" />` and trigger it when the dashed "Add Photo" card is clicked.
- On file selection, call `uploadListingImages.mutate({ listingId: listing.id, files: Array.from(files) })`.
- Provide minimal UI states: uploading spinner, error message; disable the card while uploading.
- After success, rely on the hook’s query invalidation to refresh `useListing(id)` so the new images appear immediately in `listing.image_urls`.
- Code locations: OverviewTab `Photos Gallery` block (src/.../OverviewTab.tsx:255–300). 

### 2) Make PropertyLocationMap robust with geocoding fallback
- Enhance `PropertyLocationMap` to geocode when `latitude/longitude` are missing but `city/area/address` exist.
- Use Nominatim (OpenStreetMap) free endpoint to resolve `[address, area, city]` → coordinates; cache result in component state.
- Compute `positionToUse = lat/lng || geocodedPosition || defaultPosition` and `hasLocationData = !!(lat && lng) || !!geocodedPosition`.
- Show the actual map and marker when geocoding succeeds; otherwise keep the current placeholder.
- Code locations: src/components/ui/PropertyLocationMap.tsx (add small `useEffect` and state around 34–90).

### 3) PortfolioManagementPage map view
- Keep the current `PropertyLocationMap` usage (src/.../PortfolioManagementPage.tsx:371–379). With the new fallback, it will center to the first listing by city+area even when lat/lng are absent.
- Optional improvement (deferred): render multiple markers via a simple `PortfolioMap` component; not required to restore functionality.

### 4) Verification
- Upload: open any listing detail, click "Add Photo", select 1–3 images; verify network POST to `/real-estate/listings/:id/images/` and the photos appear in the grid without reload.
- Map: 
  - Detail page with only city/area → map centers via geocoding and shows a marker.
  - Portfolio page → the map view shows the city of the first result, no placeholder.

### 5) Scope & Safety
- No backend changes; uses existing API methods and React Query cache.
- Geocoding uses public Nominatim; minimal traffic and graceful error handling.

If you approve, I will implement these changes and run the app to verify them end-to-end.