# Dispatch: Survey Miner 2 (Next.js 16 Specs, Layout Architecture & Components)

## Objective
Extract technical specifications and conventions for Next.js 16 in this project, inspect existing layout, sidebar, header, and components page, and define architecture for Left Drawer, Right Drawer, and accessibility.

## Scope & Instructions
1. Read `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md` and `c:\www\next16-template\AGENTS.md`.
2. Check `node_modules/next/dist/docs/` (or Next.js 16 documentation in node_modules) and project configuration (`next.config.*`, `tsconfig.json`, `tailwind.config.*`).
3. Examine existing layout structure:
   - `src/app/layout.tsx`, `src/app/page.tsx`, dashboard layout or pages.
   - Existing navigation/sidebar components and header components.
   - Check if `/components` page exists (`src/app/components/page.tsx` or similar).
4. Analyze architectural requirements for:
   - `Drawer`, `DrawerHeader`, `DrawerContent`, `DrawerFooter`, `DrawerToggle`, `LeftDrawer`, `RightDrawer`.
   - Controlled vs Uncontrolled modes (`open`, `onOpenChange`, `defaultOpen`).
   - LocalStorage persistence without React hydration mismatch (using `useSyncExternalStore` or safe mounting pattern).
   - Desktop vs Mobile behavior (desktop compact icon mode for LeftDrawer, hidden RightDrawer, fluid content resizing without horizontal scroll; mobile overlay, backdrop click, ESC key, focus trap/lock, return focus to trigger).
   - Permanent accessibility of `DrawerToggle` (both open and closed states, both sides, small screens).
   - Keyboard accessibility (`aria-label`, `aria-expanded`, focus management).
5. Write your comprehensive report to `.agents/teamwork/survey_miner_2/report.md` and deliver `handoff.md`.


## 2026-11-12T15:45:39Z
You are Survey Miner 2.
Read your dispatch instructions at `c:\www\next16-template\.agents\teamwork\survey_miner_2\DISPATCH.md`, `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`, and `c:\www\next16-template\AGENTS.md`.
Your mission:
- Inspect Next.js 16 breaking changes and conventions in `node_modules/next/dist/docs/`, React 19 rules, client/server boundaries, and hydration safety.
- Inspect the existing layout, navigation, header, and check if `/components` page exists.
- Design the architectural specification for `Drawer`, `DrawerHeader`, `DrawerContent`, `DrawerFooter`, `DrawerToggle`, `LeftDrawer`, `RightDrawer`.
- Detail requirements for controlled & uncontrolled state, hydration-safe localStorage persistence, mobile temporary overlay (backdrop, ESC, focus trap, body scroll lock, return focus), desktop compact left drawer & collapsible right drawer, permanent accessibility of toggle buttons, fluid central layout.
- Save your full investigation to `c:\www\next16-template\.agents\teamwork\survey_miner_2\report.md` and write `handoff.md` in your state folder.
- Notify the orchestrator via send_message when done.
