# Architectural Specification Report: Next.js 16 Specs, Layout Architecture & Drawer Component System

**Author**: Survey Miner 2  
**Date**: 2026-11-12  
**Milestone**: Architecture Specification & Codebase Survey  
**Working Directory**: `c:\www\next16-template`

---

## 1. Executive Summary

This report establishes the technical and architectural specification for the modernized Layout, Navigation, and Contextual Drawer System for `next16-template`. It grounds all architectural decisions in the authoritative documentation for **Next.js 16.4.6**, **React 19.3.0**, and **Tailwind CSS 4.3.3**, ensuring full compliance with requirements R2, R3, R4, and R5 from `ORIGINAL_REQUEST.md`.

Key findings:
1. **Next.js 16 & React 19 Foundations**: Next.js 16 operates with Turbopack by default, Async Request APIs (synchronous access to `params`, `searchParams`, `cookies`, `headers` is completely removed), and strict React 19 hydration mismatch constraints. All client state and storage interactions must use safe hydration patterns.
2. **Current Codebase State**: The current App Router layout in `src/app/layout.js` is minimal. The `/components` documentation page does not exist and must be created. Legacy `Sidebar.jsx` and `MiniSidebar.jsx` exist in `src/components/layout/` but are unintegrated and reference missing modules (`@/assets/utils`, `@/context/AppContext`).
3. **Drawer System Architecture**: We specify a composable compound architecture comprising base `Drawer`, `DrawerHeader`, `DrawerContent`, `DrawerFooter`, `DrawerToggle`, and specialized `LeftDrawer` and `RightDrawer` components. It natively supports controlled and uncontrolled modes, hydration-safe `localStorage` persistence, desktop compact icon and collapsible states, mobile temporary overlays with backdrop/ESC/focus trap/scroll lock, permanent toggle accessibility, and fluid central layout resizing without horizontal scroll.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Runtime/Build | Turbopack Default | Next.js 16 uses Turbopack by default for `next dev` and `next build`. Config moved to top-level `turbopack`. | `next.config.mjs` | Fast native compilation | Fails build if custom unsupported webpack plugins are detected without `--webpack` | `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` |
| 2 | Runtime/Build | Async Request APIs | `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are strictly Promises in Next.js 16. | Server route/page props | `Promise<T>` | Synchronous access throws runtime error | `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` |
| 3 | React 19 | Server/Client Boundary | Components utilizing DOM events, hooks (`useState`, `useEffect`, `useSyncExternalStore`), or browser storage must declare `'use client'`. | Source files | Hydrated client island | Server components importing client hooks throw build error | `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` |
| 4 | React 19 | Hydration Safety | Direct access to `window` or `localStorage` during initial SSR render triggers React 19 hydration mismatch error. | Browser storage / window globals | Rendered DOM tree | Hydration error / unstyled flash / bailout | React 19 hydration spec & Next.js 16 docs |
| 5 | Styling | Tailwind CSS v4 | Project uses Tailwind CSS 4.3.3 with `@tailwindcss/turbopack` and CSS-first `@theme` configuration in `src/app/globals.css`. | CSS `@import "tailwindcss";` | Atomic CSS rules | Unrecognized classes ignored; missing CSS imports break layout | `package.json`, `src/app/globals.css`, `next.config.mjs` |
| 6 | Layout | Root Layout & Home | Minimal App Router structure: `src/app/layout.js` (RootLayout) and `src/app/page.js` (Create Next App starter). | App Router entry | HTML shell | No dashboard or drawer integration yet | `src/app/layout.js`, `src/app/page.js` |
| 7 | Layout | Existing Legacy Sidebars | `src/components/layout/Sidebar.jsx` (535 lines) and `MiniSidebar.jsx` (54 lines) contain legacy menu implementations. | Menu arrays, permissions | Aside markup | Throws module resolution errors if imported due to missing `@/assets/utils` | `src/components/layout/Sidebar.jsx` |
| 8 | Documentation | `/components` Route Missing | Currently no `src/app/components/` route directory or page exists. Must be authored per R4. | URL `/components` | 404 Not Found currently | Returns 404 until `src/app/components/page.jsx` is implemented | `src/app` filesystem scan |
| 9 | Component | Base `Drawer` | Unified sliding panel base supporting left and right edges, modal/temporary and persistent variants. | `side`, `open`, `defaultOpen`, `variant`, `storageKey` | `<aside>` or modal dialog | Graceful fallback to defaultOpen if storage fails | Architectural Specification (R2) |
| 10 | Component | `DrawerHeader` | Header bar with title, optional icon, subtitle, and accessible close button. | `title`, `subtitle`, `icon`, `showCloseButton`, `onClose` | Header markup | Omits close button if `showCloseButton=false` | Architectural Specification (R2) |
| 11 | Component | `DrawerContent` | Scrollable body section with independent scroll container and custom scrollbar. | `children`, `className` | Scrollable `<div>` | Preserves layout bounds on content overflow | Architectural Specification (R2) |
| 12 | Component | `DrawerFooter` | Auxiliary footer section for actions, status, or persistent links. | `children`, `className` | Footer markup | Renders nothing if children empty | Architectural Specification (R2) |
| 13 | Component | `DrawerToggle` | Permanent button to toggle drawer open/compact/close states, visible in both states. | `side`, `open`, `compact`, `onToggle`, `ariaLabel` | `<button type="button">` | Fallback aria-labels provided if omitted | Architectural Specification (R2) |
| 14 | Component | `LeftDrawer` | Navigation-focused drawer with desktop expanded & compact icon modes, plus mobile temporary overlay. | `open`, `compact`, `onOpenChange`, `navItems` | Interactive navigation sidebar | Defaults to closed on mobile, compact/expanded on desktop | Architectural Specification (R3) |
| 15 | Component | `RightDrawer` | Contextual panel (notifications, settings, details), desktop collapsible (hidden) & mobile temporary overlay. | `open`, `onOpenChange`, `title`, `children` | Interactive contextual panel | Hidden when closed on desktop (`w-0`), zero horizontal scroll | Architectural Specification (R3) |
| 16 | Layout | `DashboardLayout` | Orchestrates LeftDrawer, DashboardHeader, Central Main Area, and RightDrawer. | `children`, layout props | Fluid responsive 3-column shell | Restricts horizontal scroll with `min-w-0` and `overflow-x-hidden` | Architectural Specification (R3) |
| 17 | Layout | `DashboardHeader` | Persistent top bar housing Left Toggle, logo/title, search/breadcrumbs, and Right Toggle. | Toggle callbacks, drawer states | Fixed/sticky top header | Both toggles remain permanently clickable | Architectural Specification (R2, R3) |
| 18 | Accessibility | Focus Trap & Return Focus | Traps keyboard TAB focus within temporary drawers when active; returns focus to trigger upon close. | DOM focus events, TAB/Shift-TAB | Scoped focus cycle | Prevents focus escaping to backdrop; returns focus gracefully | WAI-ARIA 1.2 Dialog Pattern (R3, R5) |
| 19 | Accessibility | ESC Key Close | Pressing Escape key immediately dismisses temporary mobile drawers. | `keydown` (key === 'Escape') | Closes drawer, releases scroll | Ignored if drawer is persistent desktop variant | Architectural Specification (R3, R5) |
| 20 | Accessibility | Body Scroll Lock | Disables background document scrolling while temporary modal drawer is open. | Modal open state | `body { overflow: hidden }` | Restores original scroll style on unmount/close | Architectural Specification (R3, R5) |
| 21 | Persistence | Hydration-Safe Storage | Persists drawer open/compact states in `localStorage` without causing SSR hydration mismatches. | `storageKey`, `defaultOpen` | Hydrated state value | Falls back to defaultOpen if `window.localStorage` throws | React 19 Hydration Rule (R2) |

---

## 3. Edge Cases & Observed Behavior

| # | Feature | Input / Scenario | Observed / Expected Behavior |
|---|---------|------------------|------------------------------|
| 1 | LocalStorage Persistence | Initial SSR render with `storageKey="left-drawer"` | SSR renders with `defaultOpen`. Client reconciles with stored value post-hydration without React 19 hydration mismatch warning. |
| 2 | LocalStorage Availability | Browser has cookies/localStorage disabled (private browsing security restriction) | `localStorage.getItem` or `setItem` throws SecurityError; try/catch fallback ensures drawer functions normally with in-memory state. |
| 3 | Both Drawers Open | Desktop viewport >= 1280px, both LeftDrawer (260px) and RightDrawer (320px) open simultaneously | Central main area contracts smoothly via `flex-1 min-w-0`; no layout overflow, elements do not collide, zero horizontal scrollbar. |
| 4 | Mobile Viewport Overlay | Screen width 375px (mobile emulation), user clicks toggle | Drawer slides in as temporary modal with fixed position, z-index 50, and semi-transparent backdrop (`bg-black/50`). Central content does NOT resize or jump. |
| 5 | Mobile Backdrop Click | Mobile overlay open, user clicks outside drawer on the dimmed backdrop | `onClick` on backdrop triggers `onOpenChange(false)` / `handleClose()`; drawer slides out, backdrop fades out, focus returns to trigger button. |
| 6 | ESC Key on Mobile Drawer | Temporary drawer open, user presses Escape key | `keydown` handler detects Escape, calls `handleClose()`, drawer closes, body scroll lock is removed, focus restored to trigger. |
| 7 | Keyboard Focus Cycle | User presses TAB repeatedly while temporary drawer is open | Focus cycles only through interactive elements inside the drawer (close button, links, buttons). When reaching the last element, TAB wraps to first; Shift+TAB wraps backwards. |
| 8 | Rapid Toggle Clicks | User rapidly clicks toggle button multiple times | Smooth CSS transitions (`transition-all duration-300 ease-in-out`) prevent visual flickering or race conditions; aria-expanded updates synchronously. |
| 9 | Permanent Toggle Availability | LeftDrawer closed / compact, RightDrawer closed / open | Toggle buttons reside in the persistent `DashboardHeader` (or fixed anchor), guaranteed visible and clickable in all permutations. |
| 10 | Window Resize (Mobile to Desktop) | User opens mobile temporary drawer, then resizes browser window past `lg` breakpoint | Backdrop automatically disappears (`lg:hidden`), drawer seamlessly transitions into desktop inline layout without stuck body scroll lock. |
| 11 | Controlled vs Uncontrolled Mode | Component provided with `open={state}` vs no `open` prop provided | Controlled mode strictly respects `open` prop and delegates mutation to `onOpenChange`. Uncontrolled mode initializes from `defaultOpen` / localStorage and manages internal state. |
| 12 | Zero Horizontal Scrollbar | Drawers expanding and collapsing | Container uses `overflow-x-hidden` and `w-full min-w-0`, ensuring `document.documentElement.scrollWidth === document.documentElement.clientWidth`. |

---

## 4. Next.js 16 Breaking Changes & React 19 Technical Analysis

### 4.1 Turbopack by Default
Next.js 16.4.6 enables Turbopack by default for development and production builds:
- Build command `npm run build` maps directly to `next build` using Turbopack.
- Any custom Webpack configurations in `next.config.*` will cause builds to fail unless configured in `turbopack: { ... }` or invoked with `--webpack`.
- In `next.config.mjs`, Turbopack rules are configured for `@tailwindcss/turbopack`.
- Compiler caching is handled via Turbopack File System Caching.

### 4.2 Async Request APIs
Synchronous access to request headers and parameters has been fully removed in Next.js 16:
- In App Router pages, layouts, and route handlers, `props.params` and `props.searchParams` are Promises.
- For example, in `page.jsx`:
  ```javascript
  export default async function Page(props) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    // ...
  }
  ```
- Any server component accessing `cookies()` or `headers()` from `next/headers` must `await` them.

### 4.3 React 19 & Client/Server Boundaries
- All interactive drawer components (`Drawer`, `DrawerToggle`, `LeftDrawer`, `RightDrawer`, `DashboardLayout`) require DOM event handling, state, and browser listeners. They **must include `'use client';`** at the very top of each file.
- The `src/app/layout.js` remains a Server Component (`RootLayout`). It wraps children in server-rendered `<html>` and `<body>` tags.
- Client interactive wrappers (e.g. `DashboardLayout`) accept `children` as a prop. This allows nested pages and child components to remain React Server Components if desired.

### 4.4 Hydration Safety & LocalStorage Persistence
A critical challenge in modern SSR with React 19 is avoiding hydration mismatches when persisting client state in `localStorage`:
- **The Hydration Problem**: On the server (Node.js), `window` and `localStorage` do not exist. If the component initializes state directly from `window.localStorage.getItem(...)` during the initial client render, the client DOM will not match the server-rendered HTML if a saved state exists. React 19 will flag this as a Hydration Mismatch error, causing unstyled flashes or bailouts.
- **The Safe Pattern**:
  1. *Option A (`useSyncExternalStore`)*:
     Provide a `getServerSnapshot` that always returns the deterministic SSR default (`defaultOpen`), while `getClientSnapshot` reads `localStorage`. React 19 hydrates with the server snapshot first, then immediately performs a clean client-side transition to the storage snapshot without mismatch warnings.
  2. *Option B (Safe Post-Hydration Effect)*:
     Initialize state to `defaultOpen`. In a `useEffect` hook (which only executes on the client after hydration is complete), check `window.localStorage` and update the state if a valid stored value exists. Include an `isHydrated` flag if necessary to prevent layout flicker.
- Both methods ensure 100% hydration safety while providing transparent persistence across page reloads.

### 4.5 Tailwind CSS v4 Integration
The project uses Tailwind CSS v4 (`tailwindcss: 4.3.3`):
- Configuration is declared in CSS (`src/app/globals.css`) via `@import "tailwindcss";` and `@theme inline { ... }`.
- No `tailwind.config.js` exists or is needed.
- Standard utility classes (`w-64`, `w-16`, `w-80`, `fixed`, `relative`, `inset-y-0`, `z-50`, `transition-all`, `duration-300`, `ease-in-out`, `hidden`, `lg:flex`) are fully compiled via `@tailwindcss/turbopack`.

---

## 5. Codebase Layout & Page Inspection

### 5.1 Current Layout Structure
- `src/app/layout.js`:
  ```javascript
  import { Geist, Geist_Mono } from "next/font/google";
  import "./globals.css";
  // RootLayout renders <html> and <body> with fonts and children
  ```
- `src/app/page.js`:
  Renders default Vercel starter page.
- `src/app/components/`:
  **Currently does NOT exist**. Requirement R4 requires interactive documentation and demos on `/components`. A new route directory `src/app/components/page.jsx` must be created.

### 5.2 Existing Layout Components & Broken Legacy References
- `src/components/layout/Sidebar.jsx` (535 lines) and `MiniSidebar.jsx` (54 lines):
  - These files were committed from an earlier project codebase.
  - They attempt to import `@/assets/utils` (`cn`, `empty`) and `@/context/AppContext` (`useAppContext`).
  - Neither `src/assets` nor `src/context` exists in the repository!
  - **Architectural Decision**: The new Drawer system should live in `src/components/ui/drawer/` (clean, self-contained, and reusable) and `src/components/layout/` (`DashboardLayout.jsx`, `DashboardHeader.jsx`, `LeftDrawer.jsx`, `RightDrawer.jsx`). Additionally, a standard `src/lib/utils.js` (and aliased `src/assets/utils.js`) should provide `cn(...)` to eliminate broken imports across the legacy components.

---

## 6. Architectural Specification for the Drawer System

### 6.1 Component Hierarchy
```
src/
├── components/
│   ├── ui/
│   │   └── drawer/
│   │       ├── Drawer.jsx           # Base container (left/right, temporary/persistent)
│   │       ├── DrawerHeader.jsx     # Header with title & close button
│   │       ├── DrawerContent.jsx    # Scrollable body container
│   │       ├── DrawerFooter.jsx     # Footer bar for actions/status
│   │       ├── DrawerToggle.jsx     # Accessible permanent toggle button
│   │       └── index.js             # Re-export barrel
│   ├── layout/
│   │   ├── DashboardLayout.jsx      # Fluid 3-column dashboard layout
│   │   ├── DashboardHeader.jsx      # Persistent top bar with drawer toggles
│   │   ├── LeftDrawer.jsx           # Navigation drawer (compact icon / expanded / mobile modal)
│   │   ├── RightDrawer.jsx          # Context drawer (collapsible / open / mobile modal)
│   │   └── index.js                 # Re-export barrel
```

### 6.2 Base Component: `<Drawer />`
The foundational component that handles sliding drawer logic for both sides (`left` and `right`).

#### Props Contract
```typescript
interface DrawerProps {
  side?: "left" | "right";                    // Default: "left"
  variant?: "temporary" | "persistent" | "compact" | "responsive"; // Default: "responsive"
  open?: boolean;                             // Controlled state
  defaultOpen?: boolean;                      // Uncontrolled initial state (default: false)
  onOpenChange?: (open: boolean) => void;     // State change callback
  storageKey?: string;                        // Optional localStorage persistence key
  width?: string;                             // Desktop expanded width (default: left "w-64", right "w-80")
  compactWidth?: string;                      // Desktop compact width (default: "w-16")
  compact?: boolean;                          // Compact mode active (for persistent left drawer)
  onCompactChange?: (compact: boolean) => void;
  closeOnEsc?: boolean;                       // Default: true
  closeOnBackdropClick?: boolean;             // Default: true
  trapFocus?: boolean;                        // Default: true in temporary/mobile overlay mode
  lockScroll?: boolean;                       // Default: true in temporary/mobile overlay mode
  returnFocusRef?: React.RefObject<HTMLElement>; // Trigger to return focus to
  ariaLabel?: string;                         // Accessible label
  ariaLabelledBy?: string;                    // ID of heading element
  className?: string;
  children: React.ReactNode;
}
```

#### Behavioral Rules
1. **Side Positioning**:
   - `side="left"`: Slides in from left (`left-0`, `border-r`).
   - `side="right"`: Slides in from right (`right-0`, `border-l`).
2. **Variants**:
   - `"temporary"`: Always behaves as a modal overlay with backdrop, ESC dismissal, body scroll lock, and focus trap (regardless of screen width).
   - `"persistent"`: Always behaves as an inline layout element (pushed into layout, no backdrop).
   - `"responsive"` (default): Operates as `"temporary"` overlay on mobile (`< lg` / `< 1024px`), and as `"persistent"` (or compact) on desktop (`>= lg`).
3. **Controlled vs Uncontrolled**:
   - If `props.open !== undefined`, the component operates in **Controlled Mode**. State changes trigger `onOpenChange?.(newOpen)`.
   - If `props.open === undefined`, the component operates in **Uncontrolled Mode**, managing internal state initialized via `defaultOpen` (or `storageKey`).

### 6.3 Auxiliary Components

#### `<DrawerHeader />`
- **Props**: `title?: React.ReactNode`, `subtitle?: React.ReactNode`, `icon?: any`, `showCloseButton?: boolean`, `onClose?: () => void`, `className?: string`, `children?: React.ReactNode`.
- **Accessibility**: Renders title inside an `<h2 id="drawer-title" className="text-lg font-semibold">` to be referenced by `aria-labelledby`.
- **Close Button**: `<button type="button" aria-label="Fechar painel" onClick={onClose}>` with FontAwesome `faXmark` icon.

#### `<DrawerContent />`
- **Props**: `className?: string`, `children: React.ReactNode`.
- **Styling**: `flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin`. Provides an independent scroll container so long navigation or notification lists scroll internally without affecting the main page.

#### `<DrawerFooter />`
- **Props**: `className?: string`, `children: React.ReactNode`.
- **Styling**: `p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0`.

#### `<DrawerToggle />`
- **Purpose**: A permanently accessible button for opening and closing drawers.
- **Props**:
  - `side`: `"left"` | `"right"`
  - `open`: `boolean`
  - `compact`: `boolean`
  - `onToggle`: `() => void`
  - `ariaLabel`: `string` (e.g. `"Alternar menu de navegação"`)
  - `ariaControls`: `string` (e.g. `"left-drawer"`)
  - `variant`: `"header"` | `"inline"` | `"floating"` (default: `"header"`)
  - `className`: `string`
- **Permanent Accessibility Guarantee**:
  - In `DashboardHeader`, toggle buttons remain in the DOM and are fully clickable regardless of whether the drawer is open, compact, or closed.
  - Supports keyboard activation (`Enter`, `Space`).
  - Sets `aria-expanded={open}` and `aria-controls={drawerId}`.

### 6.4 Specialized Drawer Components

#### `<LeftDrawer />` (Navigation Drawer)
- **Role**: Primary application navigation.
- **Desktop Behavior (`>= lg`)**:
  - **Expanded Mode** (`w-64` / 256px): Full menu items with icons, text labels, category headings, active route highlights, collapsible submenus.
  - **Compact Icon Mode** (`w-16` / 64px): Collapses text labels, displays only icons with accessible tooltips/titles, active route indicators, and mini badges.
  - Toggling between expanded and compact is smooth (`transition-all duration-300 ease-in-out`).
- **Mobile Behavior (`< lg`)**:
  - Functions as a temporary modal drawer overlay (`fixed inset-y-0 left-0 z-50`).
  - When opened, a semi-transparent backdrop covers the central content.
  - ESC key, backdrop click, or close button dismisses it.
  - Traps focus and locks body scroll while open.

#### `<RightDrawer />` (Contextual Drawer)
- **Role**: Secondary contextual panel for notifications feed, user preferences, detail previews, and quick actions.
- **Desktop Behavior (`>= lg`)**:
  - **Closed Mode** (`w-0 invisible` or collapsed zero-width flex item): Fully hidden without horizontal scrollbar.
  - **Open Mode** (`w-80` / 320px or `w-96` / 384px): Expands into the layout, pushing/flexing the central content area smoothly.
  - Both LeftDrawer and RightDrawer can be open simultaneously on widescreen desktops.
- **Mobile Behavior (`< lg`)**:
  - Functions as a temporary modal drawer overlay (`fixed inset-y-0 right-0 z-50`).
  - Backdrop covers the content; focus trap and body scroll lock engage.
  - Closes on ESC, backdrop click, or close button.

---

## 7. Fluid Layout Integration & Dashboard Architecture

### 7.1 Layout Blueprint
```
+-----------------------------------------------------------------------------------------+
|                                      DashboardHeader                                    |
| [DrawerToggle: Left] [App Logo]              [Search/Breadcrumbs]  [DrawerToggle: Right]|
+-----------------------+-------------------------------------------------+---------------+
|      LeftDrawer       |                Central Main Area                |  RightDrawer  |
|                       |                                                 |               |
| Desktop:              | - flex-1 min-w-0                                | Desktop:      |
| - Expanded (w-64) OR  | - overflow-y-auto                               | - Closed (w-0)|
| - Compact (w-16)      | - Smooth dynamic width contraction/expansion    |   OR          |
|                       | - Zero horizontal scrollbar                     | - Open (w-80) |
| Mobile:               |                                                 |               |
| - Temporary Overlay   | Mobile: Full width viewport (375px - 768px)     | Mobile:       |
|   (fixed z-50 +       | (overlay slides over without pushing layout)    | - Temporary   |
|    backdrop)          |                                                 |   Overlay     |
+-----------------------+-------------------------------------------------+---------------+
```

### 7.2 Horizontal Scroll Prevention
To strictly fulfill R3 ("sem sobreposição indevida, cortes ou scroll horizontal"):
1. The root dashboard wrapper uses:
   `className="flex flex-col h-screen w-full overflow-hidden"`
2. The horizontal container uses:
   `className="flex flex-1 min-h-0 w-full overflow-hidden relative"`
3. The central main area uses:
   `className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out"`
   The `min-w-0` is critical in CSS flexbox: it overrides flex items' default `min-width: auto`, allowing the central container to shrink without overflowing the viewport.
4. On desktop, LeftDrawer and RightDrawer participate in flex layout with `shrink-0 transition-all duration-300 ease-in-out`. When RightDrawer opens (`w-80`), Central Main smoothly resizes from `calc(100% - 256px)` to `calc(100% - 256px - 320px)` with no horizontal scrollbar.

---

## 8. State Management & Hydration-Safe Persistence

### 8.1 Dual State Model (Controlled & Uncontrolled)
The drawer architecture must transparently accommodate both usage paradigms:
```javascript
// Uncontrolled usage (self-managed state with optional persistence)
<LeftDrawer defaultOpen={true} storageKey="dashboard-left-drawer" />

// Controlled usage (external state management, e.g. for sync or automated tests)
<RightDrawer open={isRightOpen} onOpenChange={setIsRightOpen} />
```

### 8.2 Hydration-Safe LocalStorage Hook Specification
To guarantee zero React 19 hydration mismatch warnings:
```javascript
'use client';
import { useState, useEffect, useCallback } from 'react';

export function useHydratedDrawerState(storageKey, defaultState = false) {
  // Always initialize with defaultState for SSR and initial client hydration
  const [state, setState] = useState(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null) {
        setState(JSON.parse(saved));
      }
    } catch (err) {
      console.warn(`[Drawer] Failed to read localStorage key "${storageKey}":`, err);
    }
  }, [storageKey]);

  const updateState = useCallback((next) => {
    setState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      if (storageKey && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(resolved));
        } catch (err) {
          console.warn(`[Drawer] Failed to write localStorage key "${storageKey}":`, err);
        }
      }
      return resolved;
    });
  }, [storageKey]);

  return [state, updateState, isHydrated];
}
```

---

## 9. Mobile & Accessibility (A11y) Implementation Rules

### 9.1 WAI-ARIA Attributes & Landmark Roles
- **Temporary Drawers (Mobile Modal)**:
  - `role="dialog"`
  - `aria-modal="true"`
  - `aria-labelledby="[drawer-title-id]"` or `aria-label="[label]"`
- **Persistent Left Drawer**:
  - `role="navigation"`
  - `aria-label="Navegação principal"`
- **Persistent Right Drawer**:
  - `role="region"` or `role="complementary"`
  - `aria-label="Painel contextual"`
- **Toggle Buttons (`<DrawerToggle />`)**:
  - HTML element: `<button type="button">`
  - `aria-label`: Explicit Portuguese description, e.g. `"Abrir menu de navegação"` / `"Recolher menu de navegação"`
  - `aria-expanded`: `"true"` when open/expanded, `"false"` when closed/compact
  - `aria-controls`: ID of target drawer element (`"left-drawer"` or `"right-drawer"`)

### 9.2 Focus Trap Mechanics
When a temporary drawer opens:
1. Store current active element: `triggerElementRef.current = document.activeElement`.
2. Find all focusable elements inside the drawer:
   `'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'`
3. Focus the first focusable element (e.g. the header close button or first menu item).
4. Listen for `keydown`:
   - If `e.key === 'Tab'`:
     - If `e.shiftKey` and `document.activeElement === firstElement`:
       `e.preventDefault(); lastElement.focus();`
     - If `!e.shiftKey` and `document.activeElement === lastElement`:
       `e.preventDefault(); firstElement.focus();`
   - If `e.key === 'Escape'`:
     - Call close callback.

### 9.3 Return Focus Mechanics
When a temporary drawer closes:
1. Remove focus trap listener and restore body scroll.
2. Call `triggerElementRef.current?.focus()`. This returns focus cleanly to the toggle button that initiated opening.

### 9.4 Body Scroll Lock
When a temporary modal drawer opens:
```javascript
const originalOverflow = document.body.style.overflow;
document.body.style.overflow = 'hidden';
// On close or unmount:
return () => {
  document.body.style.overflow = originalOverflow;
};
```

---

## 10. Interactive Documentation Page Specification (`/components`)

Per Requirement R4, `src/app/components/page.jsx` must be authored to provide an interactive playground and documentation suite:

### 10.1 Demonstrations to Implement
1. **Interactive Layout Simulator**:
   - Live controls to toggle Left Drawer (`Open` / `Compact` / `Closed`) and Right Drawer (`Open` / `Closed`).
   - Mode switcher: `Desktop (Persistent/Compact)` vs `Mobile Viewport Emulation (Modal Overlay)`.
   - Persistence test: Toggle `localStorage` persistence and button to refresh page to observe retained state.
2. **State Permutation Visualizer**:
   - Preview card 1: Left Open + Right Closed.
   - Preview card 2: Left Compact + Right Closed.
   - Preview card 3: Both Open simultaneously (Desktop widescreen test).
   - Preview card 4: Both Closed.
   - Preview card 5: Mobile Temporary Overlay with active backdrop and focus trap.
3. **Component API Tables**:
   - Exhaustive prop tables for `Drawer`, `DrawerHeader`, `DrawerContent`, `DrawerFooter`, `DrawerToggle`, `LeftDrawer`, `RightDrawer`.
4. **Copyable Code Snippets**:
   - Basic setup
   - Controlled state example
   - Uncontrolled with `localStorage` persistence example
   - Custom contextual content in `RightDrawer` (Notifications feed, detail viewer)
5. **Keyboard & Accessibility Reference**:
   - Interactive table detailing `Tab`, `Shift+Tab`, `Escape`, `Space`, `Enter` behavior and ARIA roles.

---

## 11. Playwright Test Verification Strategy (Mapping to R5)

The table below maps our architectural specifications directly to the 10 mandatory Playwright test scenarios required by R5:

| Test Scenario (R5) | Architectural Mechanism Tested | Selector / Assertion Strategy |
|--------------------|--------------------------------|-------------------------------|
| 1. Left Drawer abre e fecha | Toggle button fires `onOpenChange`; CSS width/transform transitions | Click `[data-testid="toggle-left-drawer"]`, assert `[data-testid="left-drawer"]` has `data-state="open"` or expanded width, click again, assert closed/compact. |
| 2. Right Drawer abre e fecha | Contextual drawer toggle fires `onOpenChange`; width transitions between 0 and 320px | Click `[data-testid="toggle-right-drawer"]`, assert `[data-testid="right-drawer"]` visible with `data-state="open"`, click again, assert hidden/w-0. |
| 3. Cada drawer mantém estado independente | Distinct state variables / storage keys for left and right | Open Left Drawer, assert Right Drawer is still closed. Open Right Drawer, assert Left Drawer remains open. Close Left Drawer, assert Right Drawer remains open. |
| 4. O botão de toggle permanece acessível | Toggles rendered in persistent header with fixed z-index | Assert `[data-testid="toggle-left-drawer"]` and `[data-testid="toggle-right-drawer"]` are visible and clickable when drawers are both open, both closed, and mixed. |
| 5. Drawer fechado pode ser reaberto | State is non-destructive and re-entrant | Open -> Close -> Open sequence executes cleanly; no stuck state or broken listeners. |
| 6. Layout se adapta aos estados | Central container uses `flex-1 min-w-0 overflow-x-hidden` | Measure `document.documentElement.scrollWidth <= document.documentElement.clientWidth` across all drawer state combinations; verify main content width adjusts dynamically. |
| 7. Comportamento mobile funciona | Viewport set to 375x667; drawer switches to temporary modal overlay with backdrop | In mobile viewport, opening drawer displays `[data-testid="drawer-backdrop"]`; clicking backdrop closes the drawer. |
| 8. ESC fecha drawer temporário | `keydown` handler on `Escape` triggers close in temporary mode | With mobile drawer open, press `page.keyboard.press('Escape')`; assert drawer closes and backdrop is removed. |
| 9. Navegação por teclado funciona | Focus trap, `aria-expanded`, return focus on close | Focus toggle button, press `Enter`, assert `aria-expanded="true"`, assert focus enters drawer; press `Tab` to cycle; press `Escape`, assert focus returns to toggle button. |
| 10. Zero referências a Axios/amCharts | Codebase scan ensures zero residual imports | Grep/regex test confirms zero imports of `axios`, `@amcharts/amcharts5`, `@amcharts/amcharts5-geodata`. |

---

## 12. Next Steps & Implementation Recommendations

1. **Phase 1 (Foundation)**:
   - Create `src/lib/utils.js` (and `src/assets/utils.js` alias) providing `cn` and helper utilities.
   - Implement base `src/components/ui/drawer/` (`Drawer.jsx`, `DrawerHeader.jsx`, `DrawerContent.jsx`, `DrawerFooter.jsx`, `DrawerToggle.jsx`, `index.js`).
2. **Phase 2 (Specialized Components & Layout)**:
   - Implement `LeftDrawer.jsx` and `RightDrawer.jsx`.
   - Implement `DashboardHeader.jsx` and `DashboardLayout.jsx`.
3. **Phase 3 (App Router Integration & Documentation)**:
   - Integrate `DashboardLayout` into `src/app/page.js` (or dashboard route).
   - Create `src/app/components/page.jsx` with full interactive documentation and state demonstrations.
4. **Phase 4 (Playwright Verification)**:
   - Coordinate with test team to verify all 10 scenarios pass seamlessly.
