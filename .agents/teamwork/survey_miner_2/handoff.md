# Handoff Report: Survey Miner 2 — Next.js 16 Specs, Layout Architecture & Drawer System

**From**: Survey Miner 2 (Agent `9c7676cd-6a1f-4245-8ec4-494ac74fa08e`)  
**To**: Orchestrator (Parent Agent `c069720f-3ad7-4b72-9dc5-04cabcd31783`)  
**Date**: 2026-11-12T15:55:00Z  
**Type**: Hard Handoff (Investigation & Specification Complete)  

---

## 1. Observation

1. **Framework & Package Versions**:
   In `package.json` (lines 10-27):
   ```json
   "dependencies": {
     "@fortawesome/free-regular-svg-icons": "^7.3.1",
     "@fortawesome/free-solid-svg-icons": "^7.3.1",
     "@fortawesome/react-fontawesome": "^3.5.0",
     "flag-icons": "^7.6.0",
     "moment": "^2.31.0",
     "next": "16.4.6",
     "react": "19.3.0",
     "react-dom": "19.3.0",
     "react-toastify": "^11.2.0",
     "suneditor": "^2.47.12",
     "suneditor-react": "^3.6.1"
   },
   "devDependencies": {
     "@tailwindcss/turbopack": "4.3.3",
     "babel-plugin-react-compiler": "1.0.0",
     "tailwindcss": "4.3.3"
   }
   ```
   Direct observation: Next.js is version 16.4.6, React is 19.3.0, and Tailwind is 4.3.3.

2. **Next.js 16 Documentation & Breaking Changes**:
   In `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`:
   - Line 104: "Starting with Next.js 16, Turbopack is stable and used by default with `next dev` and `next build`."
   - Line 263: "Starting with Next.js 16, synchronous access is fully removed. These APIs can only be accessed asynchronously: `cookies`, `headers`, `draftMode`, `params` in layout.js, page.js, route.js, searchParams in page.js."
   - Line 363: "The App Router in Next.js 16 uses the latest React Canary release, which includes the newly released React 19.2 features..."
   - Line 961: "In Next.js 16, this behavior has changed. By default, Next.js will no longer override your scroll-behavior setting during navigation."

3. **Current Layout & App Structure**:
   - `src/app/layout.js`: Lines 19-27 define a minimal `RootLayout` with `Geist` fonts wrapping `{children}`.
   - `src/app/page.js`: Default create-next-app starter page (lines 1-69).
   - `src/app/components/`: Does NOT exist in filesystem (`Get-ChildItem -Path src\app -Recurse` yielded only `favicon.ico`, `globals.css`, `layout.js`, and `page.js`).
   - `src/components/layout/`: Contains `Sidebar.jsx` (535 lines) and `MiniSidebar.jsx` (54 lines). Both attempt to import `@/assets/utils` (`cn`, `empty`) and `@/context/AppContext` (`useAppContext`), neither of which currently exists in `src/`.

4. **Production Build Baseline**:
   Running `npm run build` executed synchronously with exit code 0:
   ```text
   ▲ Next.js 16.4.6 (Turbopack)
   ✓ Running next.config.mjs took 35ms
   - Cache Components enabled
   - Partial Prefetching enabled
   - Experiments: agentFeedback
   ✓ Compiled successfully in 992ms
   ✓ Generating static pages using 3 workers (4/4) in 323ms
   Route (app): / and /_not-found
   ```

---

## 2. Logic Chain

1. **Hydration Mismatch Mitigation**:
   - *Premise*: React 19 enforces strict hydration matching between server-generated HTML and client initial render.
   - *Observation*: During SSR, `window` and `localStorage` are undefined.
   - *Inference*: If a component initializes state with `localStorage.getItem` during the initial client render, any mismatch with the SSR default triggers a React 19 hydration error.
   - *Conclusion*: A safe two-phase hydration pattern (`useHydratedDrawerState` or `useSyncExternalStore` with deterministic server snapshot) must be used. SSR and initial hydration always use `defaultOpen`; storage synchronization occurs post-hydration.

2. **Drawer Architecture Decomposition**:
   - *Requirement*: R2 demands reusable `Drawer`, `DrawerHeader`, `DrawerContent`, `DrawerFooter`, `DrawerToggle`, `LeftDrawer`, and `RightDrawer`.
   - *Observation*: `LeftDrawer` has navigation responsibilities (expanded vs compact icon mode), while `RightDrawer` has contextual panel responsibilities (collapsible to 0px vs expanded). On mobile, both must act as temporary overlay modals.
   - *Conclusion*: A base `Drawer` component managing side (`left`/`right`), responsive variant (`temporary`/`persistent`), overlay/backdrop, ESC key handler, focus trap, and body scroll lock provides the shared core. Specialized `LeftDrawer` and `RightDrawer` compose `Drawer` with domain-specific props, widths, and content structures.

3. **Fluid Layout & Horizontal Scroll Prevention**:
   - *Requirement*: R3 mandates that the layout adjusts central content width without unexpected overlap, clipping, or horizontal scrollbar.
   - *Observation*: Flex items without `min-w-0` default to `min-width: auto`, which causes flex parents to expand beyond the viewport width when sidebars expand.
   - *Conclusion*: The root container must use `h-screen w-full overflow-hidden`, the horizontal body flex must use `flex-1 min-h-0 w-full overflow-hidden`, and the central content container must use `flex-1 min-w-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out`. When LeftDrawer transitions (256px <-> 64px) and RightDrawer transitions (0px <-> 320px), the central area resizes dynamically with zero horizontal overflow.

4. **Permanent Toggle Accessibility**:
   - *Requirement*: R2 mandates toggle buttons permanently accessible in both open and closed states on both sides, including on small screens.
   - *Observation*: Placing toggles exclusively inside the sliding panel makes them unreachable when the panel is closed.
   - *Conclusion*: Toggles must be housed in the persistent top `DashboardHeader` with fixed z-index and permanent visibility. Each `<DrawerToggle />` maintains proper ARIA attributes (`aria-expanded`, `aria-label`, `aria-controls`). On mobile, opening a drawer also provides an internal close button in `DrawerHeader` for touch convenience.

---

## 3. Caveats

1. **Existing Unused Components**:
   Legacy components in `src/components/layout/Sidebar.jsx` and various files in `src/components/features/` import `@/assets/utils` and `@/context/AppContext`. These were imported prior to this task and are currently unused by `src/app/page.js`. Implementing `src/lib/utils.js` (and aliasing `src/assets/utils.js`) will resolve the broken import risk for future integration without altering legacy files unnecessarily.
2. **Tailwind v4 Setup**:
   The repository uses Tailwind CSS 4.3.3. There is no `tailwind.config.js`. All styles and custom utilities must adhere to Tailwind v4 CSS syntax (`@import "tailwindcss";`, `@theme inline { ... }`).
3. **No Code Implementation in this Step**:
   As a read-only Specification Miner, no production source code has been modified or created during this turn. All findings and detailed specifications are documented in `.agents/teamwork/survey_miner_2/report.md`.

---

## 4. Conclusion

1. The architectural blueprint for the Drawer System is completely formulated and documented in `.agents/teamwork/survey_miner_2/report.md`.
2. The specification fully covers:
   - Base `Drawer` and compound parts (`DrawerHeader`, `DrawerContent`, `DrawerFooter`, `DrawerToggle`).
   - Specialized `LeftDrawer` (desktop expanded/compact icon modes + mobile overlay modal).
   - Specialized `RightDrawer` (desktop collapsible/hidden + mobile overlay modal).
   - Controlled (`open`, `onOpenChange`) and uncontrolled (`defaultOpen`) state mechanics.
   - Hydration-safe `localStorage` persistence with zero SSR mismatch warnings.
   - Fluid `DashboardLayout` preventing horizontal scroll (`overflow-x-hidden`, `min-w-0`).
   - WAI-ARIA compliance: focus trap, return focus to trigger, ESC dismissal, body scroll lock, `aria-expanded`, `aria-label`.
   - Full specification for the `/components` interactive documentation page.
   - Direct mapping to all 10 mandatory Playwright test scenarios (R5).

The project is fully ready for the Implementation Phase.

---

## 5. Verification Method

1. **Verify Report Existence & Completeness**:
   Inspect `.agents/teamwork/survey_miner_2/report.md` to confirm all 12 sections, tables, edge cases, and code specifications are present:
   ```powershell
   powershell -NoProfile -Command "Test-Path .agents\teamwork\survey_miner_2\report.md; Get-Item .agents\teamwork\survey_miner_2\report.md | Select-Object Length"
   ```
2. **Verify Next.js 16 Build Status**:
   Confirm the production build continues to compile cleanly:
   ```powershell
   npm run build
   ```
3. **Check Route Inventory**:
   Confirm route compilation shows `/` and that `/components` will be the new addition during implementation.
