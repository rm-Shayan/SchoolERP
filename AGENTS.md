# Project Rules

## Frontend Code Rules (MANDATORY)

1. **File length limit: MAX 150 lines per file.**
   - Every file under `frontend/src` (components, pages, hooks, layouts, utils, slices) MUST stay at or below **150 lines**.
   - Target 140–150 lines as the hard ceiling. If a component/page grows past the limit, split it into smaller files (sub-components, extracted hooks, extracted helpers, or a `parts/` or `components/` folder next to it).
   - `App.tsx`, routers and configs count too — split route config, nav-link data, and icons into separate data files.
   - The only exemption: `types` may be split into per-domain files but each type file still stays <=150 lines.

2. **Form validation is REQUIRED.**
   - All forms must validate on the client before submit.
   - Use the shared helpers in `frontend/src/lib/utils/validation.ts` and the `useForm` hook in `frontend/src/lib/utils/useForm.ts`.
   - Show errors inline under inputs via the `error` prop on `Input`/`Select`. Disable the submit button while `isSubmitting`.

3. **Performance.**
   - Use `useMemo`/`useCallback`/`React.memo` for list rendering and heavy derived data.
   - Debounce search inputs (150–300ms) that hit an API.
   - Lazy-load heavy pages with `React.lazy` + `Suspense`.
   - No inline `new Date()`/`Math.random()` in render — only in effects/handlers.

4. **Responsiveness.**
   - Every page must work on mobile (375px) through desktop. Use Tailwind responsive prefixes (`sm`, `md`, `lg`, `xl`).
   - Tables must be scrollable (`overflow-x-auto`) on small screens; forms must collapse to single column on mobile.
   - Navbars/sidebars need a mobile menu (hamburger) state.

## Commands
- Frontend lint: `npm run lint` (oxlint)
- Frontend typecheck/build: `npm run build`
- Verify a file respects the limit: line count <= 150.
