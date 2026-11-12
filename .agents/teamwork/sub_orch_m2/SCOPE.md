# Scope: Milestone 2 — Reusable Drawer Core System & Accessibility

## Architecture & Boundaries
This sub-orchestrator is responsible for implementing the modular, accessible, reusable Drawer system and its compound components, supporting controlled/uncontrolled state, safe localStorage persistence, and WAI-ARIA accessibility.

### Exclusively Owned Files
- `src/components/ui/drawer/Drawer.jsx`
- `src/components/ui/drawer/DrawerHeader.jsx`
- `src/components/ui/drawer/DrawerContent.jsx`
- `src/components/ui/drawer/DrawerFooter.jsx`
- `src/components/ui/drawer/DrawerToggle.jsx`
- `src/components/ui/drawer/LeftDrawer.jsx`
- `src/components/ui/drawer/RightDrawer.jsx`
- `src/components/ui/drawer/useDrawer.js`
- `src/components/ui/drawer/index.js`

## Detailed Requirements
1. **Core Drawer Compound Components**:
   - `Drawer`: Base container supporting `side` ("left" | "right"), `variant` ("persistent" | "temporary" | "compact"), `open`, `defaultOpen`, `onOpenChange`, `storageKey`.
   - `DrawerHeader`: Contains title/description and optional mobile close button.
   - `DrawerContent`: Main scrollable content area (`overflow-y-auto`).
   - `DrawerFooter`: Action buttons / bottom controls.
   - `DrawerToggle`: Toggle button maintaining permanent accessibility. Must support `aria-expanded`, `aria-label`, `aria-controls`, and `data-testid` ("left-drawer-toggle" / "right-drawer-toggle").
2. **Specialized Drawers**:
   - `LeftDrawer`: Dedicated to navigation. Supports desktop expanded (e.g. 256px / `w-64`) and compact icon mode (e.g. 64px / `w-16`), active item styling, collapsible menu groups, and mobile overlay modal. Root element must have `data-testid="left-drawer"`.
   - `RightDrawer`: Dedicated to contextual panels (notifications, settings, record details, quick forms). Supports desktop expanded (e.g. 320px / `w-80`) and collapsed/hidden (0px), and mobile overlay modal. Root element must have `data-testid="right-drawer"`.
3. **State Management & Hydration-Safe Persistence**:
   - Dual mode: Controlled (`open`, `onOpenChange`) and Uncontrolled (`defaultOpen`).
   - LocalStorage persistence via `useDrawerState` hook: ensure initial SSR and client hydration render identically (using `defaultOpen` or default snapshot), reading/synchronizing with `localStorage` only after client mount to prevent React 19 hydration mismatch errors.
4. **Accessibility (WAI-ARIA & Keyboard)**:
   - Proper roles: `role="dialog"` or `role="navigation"`, `aria-modal="true"` in temporary/overlay mode.
   - `aria-label` and `aria-expanded` on triggers.
   - Keyboard handling: Enter/Space to activate toggle, ESC key to close temporary drawer.
   - Focus management: in temporary/overlay mode, trap focus within drawer and return focus to trigger element upon closing.
   - Body scroll lock (`document.body.style.overflow = 'hidden'`) when temporary drawer is open on mobile.
   - Overlay backdrop with `data-testid="drawer-backdrop"` that dismisses on click.
5. **Permanent Toggle Accessibility**:
   - Toggles must remain visible, clickable, and reachable regardless of whether the drawer is open or closed, on both sides and on small screens.

## Status: DONE
- Iteration 1: Gate FAIL (Challenger 2 caught getFocusableElements tabindex and visibility defects)
- Iteration 2: Gate **PASS** (Reviewer 1 APPROVE, Reviewer 2 APPROVE, Challenger 1 APPROVE, Challenger 2 APPROVE, Auditor CLEAN)

## Acceptance Criteria
- [x] All compound and specialized components implemented cleanly with zero errors.
- [x] Controlled and uncontrolled states work seamlessly.
- [x] LocalStorage persistence works with 0 React hydration mismatch warnings.
- [x] ARIA attributes, ESC dismissal, focus management, and permanent toggle accessibility verified.
- [x] Forensic Auditor reports CLEAN integrity.
