# Scope: Milestone 3 — Dashboard Layout Integration & /components Interactive Documentation

## Architecture & Boundaries
This sub-orchestrator is responsible for integrating `LeftDrawer`, `RightDrawer`, and pure SVG charts into a production-grade, fluid `DashboardLayout` and building the `/components` interactive documentation page.

### Exclusively Owned Files
- `src/components/layout/DashboardLayout.jsx`
- `src/components/layout/DashboardHeader.jsx`
- `src/components/layout/SidebarNav.jsx`
- `src/components/layout/ContextPanel.jsx`
- `src/app/page.js` (Main dashboard page)
- `src/app/components/page.js` (Interactive Drawer documentation and live demos)

## Detailed Requirements

### 1. Dashboard Layout & Header (`src/components/layout/`)
- **`DashboardHeader.jsx`**:
  - Sticky top navigation bar (`h-16 border-b bg-white dark:bg-zinc-900 z-30`).
  - Contains `leftToggle` (`<DrawerToggle side="left" ... />`, `data-testid="left-drawer-toggle"`, `aria-controls="left-drawer"`, `aria-label="Alternar menu de navegação"`) permanently visible on the left.
  - Logo and title ("Next16 Production Template").
  - Center or right: search bar, quick links (including link to `/components`), notifications icon.
  - Contains `rightToggle` (`<DrawerToggle side="right" ... />`, `data-testid="right-drawer-toggle"`, `aria-controls="right-drawer"`, `aria-label="Alternar painel de contexto"`) permanently visible on the right.
  - **Permanent Accessibility**: Toggles MUST have non-zero bounding box within viewport, visible and clickable across desktop (1280x800, 1440x900) and mobile (375x667), in both drawer open and closed states.
- **`DashboardLayout.jsx`**:
  - High-level layout wrapper:
    - Root: `h-screen w-full flex flex-col overflow-hidden`.
    - Header: `DashboardHeader`.
    - Body: `flex-1 flex overflow-hidden min-h-0 w-full relative`.
    - Left column: `<LeftDrawer />` (`data-testid="left-drawer"`).
      - Desktop (>= 1024px): inline persistent/compact (w-64 expanded, w-16 compact icon mode).
      - Mobile (< 1024px): temporary overlay modal (`fixed inset-y-0 left-0 z-50`) with backdrop (`data-testid="drawer-backdrop"`), body scroll lock, and ESC/click dismissal.
    - Central column: `<main data-testid="dashboard-main" className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6 transition-all duration-300">`.
      - **Fluid Resizing**: Width adjusts dynamically when drawers open/close.
      - **No Horizontal Overflow**: `document.documentElement.scrollWidth <= window.innerWidth` across all 4 permutations (Both Closed, Left Open, Both Open, Right Open).
    - Right column: `<RightDrawer />` (`data-testid="right-drawer"`).
      - Desktop (>= 1024px): inline collapsible (w-80 expanded, w-0 closed).
      - Mobile (< 1024px): temporary overlay modal (`fixed inset-y-0 right-0 z-50`) with backdrop (`data-testid="drawer-backdrop"`), body scroll lock, and ESC/click dismissal.

### 2. Main Dashboard Page (`src/app/page.js`)
- Renders `DashboardLayout`.
- Inside `LeftDrawer`: navigation menu with icons, active page indicators, collapsible groups, link to Dashboard (`/`) and Components Documentation (`/components`).
- Inside `RightDrawer`: contextual panel (notifications list, quick settings, activity logs, quick action form).
- Inside `dashboard-main`:
  - KPI summary cards (Total Users, Active Sessions, System SLA, Revenue).
  - Integration of pure SVG charts created in Milestone 1:
    - `UserHoursBarChart` (Hours burn-up with 170h ideal line).
    - `MapChart` (Brazil state map with region details and modal pins).
    - `MultiAxisLineChart` (Dual-axis trend lines).
    - `PieChart` (Donut breakdown with hover tooltips).
    - `XyVerticalChart` (SLA column metrics).
    - `AnswersChart` (Comparative survey analysis).
    - `YearlySeriesChart` (Multi-year comparison with variance badges).

### 3. Interactive Documentation Page (`src/app/components/page.js`)
- Route `/components`: Comprehensive interactive documentation showcasing the Drawer component system.
- Demonstrates all required states:
  - Left Drawer open / closed.
  - Right Drawer open / closed.
  - Both drawers open simultaneously (desktop).
  - Both drawers closed.
  - Temporary mode (mobile overlay preview / modal drawer).
  - Permanent mode (desktop layout).
  - Custom dynamic content demo.
- Live controls allowing users to toggle each drawer directly from the page.
- Documentation tables:
  - Props table (`Drawer`, `LeftDrawer`, `RightDrawer`, `DrawerToggle`, `DrawerHeader`, `DrawerContent`, `DrawerFooter`).
  - Event contracts (`onOpenChange`, `onCompactChange`).
  - Code examples and usage guidelines.
  - Accessibility features summary (WAI-ARIA, keyboard keys, focus trap, scroll lock).

## Acceptance Criteria
- [ ] `DashboardLayout` fluidly adapts central area across all 4 drawer permutations with zero horizontal scrollbar (`scrollWidth <= innerWidth`).
- [ ] Toggle buttons remain permanently visible and clickable across all viewports and drawer states.
- [ ] Mobile viewports render overlay backdrop, lock body scroll, and dismiss on backdrop click or ESC for both drawers.
- [ ] `/components` page provides interactive live demos, props tables, code examples, and state controls.
- [ ] `npm run build` compiles cleanly with exit code 0 under Turbopack.
- [ ] Forensic Auditor reports CLEAN integrity.
