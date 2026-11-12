# Investigation & Architectural Report: Drawer Core System Hierarchy & Interface Contracts

**Author**: Explorer M2.1  
**Date**: 2026-11-12  
**Milestone**: Milestone 2 — Reusable Drawer Core System & Accessibility  
**Target Directory**: `src/components/ui/drawer/`  
**Working Directory**: `c:\www\next16-template`

---

## 1. Executive Summary

This report establishes the complete component hierarchy, interface contracts, prop types, Tailwind CSS 4 transitions, accessibility bindings, and test selector contracts for the **9 files** comprising the modern, reusable Drawer Core System in `src/components/ui/drawer/`:
1. `useDrawer.js`
2. `Drawer.jsx`
3. `DrawerHeader.jsx`
4. `DrawerContent.jsx`
5. `DrawerFooter.jsx`
6. `DrawerToggle.jsx`
7. `LeftDrawer.jsx`
8. `RightDrawer.jsx`
9. `index.js`

All designs strictly adhere to **Next.js 16.4.6** (Turbopack, Async Request APIs, App Router), **React 19.3.0** (client directive `'use client'`, strict zero hydration mismatch requirements), and **Tailwind CSS 4.3.3** (`@import "tailwindcss"`, CSS-first configuration, atomic transitions). They fulfill all requirements R2, R3, R4, and R5 from `ORIGINAL_REQUEST.md` and match the data contracts specified in `PROJECT.md`.

---

## 2. Component Hierarchy & Architectural Taxonomy

The drawer system is structured around a compound component architecture combined with specialized domain wrappers:

```
src/components/ui/drawer/
├── useDrawer.js          <-- State hook, storage synchronization, DrawerContext
├── Drawer.jsx             <-- Foundational composite container (Left & Right, Temporary & Persistent)
│   ├── DrawerHeader.jsx   <-- Header bar, title (h2), icon, accessible close button
│   ├── DrawerContent.jsx  <-- Main scrollable area (overflow-y-auto, min-h-0)
│   ├── DrawerFooter.jsx   <-- Action buttons, status bar (shrink-0, border-t)
│   └── (Backdrop)         <-- Modal overlay backdrop [data-testid="drawer-backdrop"]
├── DrawerToggle.jsx       <-- Permanent toggle trigger button [data-testid="*-drawer-toggle"]
├── LeftDrawer.jsx         <-- Specialized Navigation Drawer (Expanded w-64, Compact w-16, Mobile Modal)
├── RightDrawer.jsx        <-- Specialized Contextual Drawer (Expanded w-80, Closed w-0, Mobile Modal)
└── index.js               <-- Barrel re-exports for seamless consumer imports
```

### Composition Model
- **Base Level (`Drawer`)**: Manages side positioning (`left` | `right`), variant modes (`responsive` | `persistent` | `temporary` | `compact`), modal overlay lifecycle (focus trap, body scroll lock, ESC dismissal), and provides React Context (`DrawerContext`) to nested compound components.
- **Compound Subcomponents (`DrawerHeader`, `DrawerContent`, `DrawerFooter`)**: Can be composed flexibly within `<Drawer>`, receiving state (e.g. `titleId`, `onClose`) from `DrawerContext` or explicit props.
- **Trigger Component (`DrawerToggle`)**: Designed to remain permanently mounted and accessible in headers or layout bars, decoupled from whether the drawer itself is rendered inline or as a modal.
- **Domain Specializations (`LeftDrawer`, `RightDrawer`)**: Out-of-the-box, highly configured wrappers that provide specific navigation menu layouts, route highlighting, compact icon collapses (`LeftDrawer`), and contextual notification/settings cards (`RightDrawer`).

---

## 3. Detailed Specification for All 9 Files

### File 1: `useDrawer.js`

**Purpose**: Core state management hook and React Context provider for drawers, supporting controlled/uncontrolled state, safe localStorage synchronization, and compound component context.

#### Exported Entities
1. `DrawerContext`: React context holding `{ side, open, compact, variant, toggle, close, setOpen, setCompact, titleId }`.
2. `useDrawerContext()`: Consumer hook with protective error message if called outside `<Drawer>`.
3. `useDrawerState(options)`: Foundational hook for controlled/uncontrolled state with hydration-safe localStorage synchronization.
4. `useDrawer(options)`: High-level hook returning `{ isOpen, isCompact, isControlled, open, close, toggle, toggleCompact, setOpen, setCompact, isHydrated }`.

#### Interface Contract & Props
```typescript
interface UseDrawerOptions {
  open?: boolean;                             // Controlled open state
  defaultOpen?: boolean;                      // Uncontrolled initial open (default: false)
  onOpenChange?: (open: boolean) => void;     // Open change callback
  compact?: boolean;                          // Controlled compact state
  defaultCompact?: boolean;                  // Uncontrolled initial compact (default: false)
  onCompactChange?: (compact: boolean) => void; // Compact change callback
  storageKey?: string;                        // LocalStorage key for open state
  compactStorageKey?: string;                 // LocalStorage key for compact state
}

interface UseDrawerReturn {
  isOpen: boolean;
  isCompact: boolean;
  isControlled: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleCompact: () => void;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setCompact: (value: boolean | ((prev: boolean) => boolean)) => void;
  isHydrated: boolean;
}
```

#### Hydration Safety Rule (React 19)
- SSR and initial client mount render with `defaultOpen` (or `false`).
- `useEffect` reads `window.localStorage` after initial mount. If a stored value exists, it updates state.
- All `localStorage` calls are wrapped in `try/catch` to gracefully degrade when storage is blocked (e.g. private browsing).

---

### File 2: `Drawer.jsx` (Base Component)

**Purpose**: Foundational sliding drawer container. Operates as an inline layout element in persistent mode, or as an accessible modal overlay in temporary/mobile mode.

#### Props Contract
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `side` | `'left' \| 'right'` | `'left'` | Edge of screen where drawer is anchored |
| `variant` | `'responsive' \| 'persistent' \| 'temporary' \| 'compact'` | `'responsive'` | Presentation variant (`responsive` switches at `lg` breakpoint) |
| `open` | `boolean` | `undefined` | Controlled open state |
| `defaultOpen` | `boolean` | `false` | Uncontrolled initial open state |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Callback fired on open/close |
| `compact` | `boolean` | `undefined` | Controlled compact icon state (for left drawer) |
| `defaultCompact`| `boolean` | `false` | Uncontrolled initial compact state |
| `onCompactChange`| `(compact: boolean) => void` | `undefined` | Callback fired on compact change |
| `storageKey` | `string` | `undefined` | LocalStorage persistence key for open state |
| `compactStorageKey`| `string` | `undefined` | LocalStorage persistence key for compact state |
| `width` | `string` | `side === 'right' ? 'w-80' : 'w-64'` | Tailwind class for expanded desktop width |
| `compactWidth` | `string` | `'w-16'` | Tailwind class for compact desktop width |
| `closeOnEsc` | `boolean` | `true` | Close on Escape key in modal/temporary mode |
| `closeOnBackdropClick` | `boolean` | `true` | Close when clicking modal backdrop |
| `trapFocus` | `boolean` | `true` | Enforce keyboard focus trap in modal mode |
| `lockScroll` | `boolean` | `true` | Lock body scroll (`overflow: hidden`) while open in modal mode |
| `ariaLabel` | `string` | `undefined` | Accessible label for drawer landmark/dialog |
| `ariaLabelledBy`| `string` | `undefined` | ID of element labeling the drawer (defaults to internal titleId) |
| `data-testid` | `string` | `side === 'left' ? 'left-drawer' : 'right-drawer'` | Testing selector |
| `id` | `string` | `side === 'left' ? 'left-drawer' : 'right-drawer'` | DOM id for `aria-controls` linkage |
| `className` | `string` | `''` | Custom additional CSS classes |
| `children` | `React.ReactNode` | — | Content or compound components |

#### DOM Attributes & Testing Data Contracts
- Root element: `<aside>` (in persistent layout mode) or `<div role="dialog">` (in modal mode)
- `data-testid`: `"left-drawer"` or `"right-drawer"` (or passed value)
- `data-state`:
  - When open and expanded: `"open"`
  - When compact / collapsed: `"collapsed"`
  - When closed: `"closed"`
- `data-side`: `"left"` or `"right"`
- `data-variant`: `"responsive" | "persistent" | "temporary" | "compact"`
- `id`: `"left-drawer"` or `"right-drawer"`

#### Backdrop Contract
- When temporary modal is open:
  ```jsx
  <div
    data-testid="drawer-backdrop"
    aria-hidden="true"
    onClick={closeOnBackdropClick ? handleClose : undefined}
    className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out"
  />
  ```

---

### File 3: `DrawerHeader.jsx`

**Purpose**: Header container for title, subtitle, optional icon, and accessible dismiss button.

#### Props Contract
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `React.ReactNode` | `undefined` | Heading text/node |
| `subtitle` | `React.ReactNode` | `undefined` | Secondary descriptive text |
| `icon` | `any` | `undefined` | FontAwesome icon or ReactNode |
| `showCloseButton` | `boolean` | `true` | Whether to display close button |
| `onClose` | `() => void` | `undefined` | Custom close handler (defaults to context `close()`) |
| `closeAriaLabel` | `string` | `'Fechar painel'` | Accessible label for close button |
| `className` | `string` | `''` | Custom additional classes |
| `children` | `React.ReactNode` | `undefined` | Custom header content |
| `data-testid` | `string` | `'drawer-header'` | Testing selector |

#### Markup & Accessibility Structure
```jsx
<header
  data-testid={dataTestId || 'drawer-header'}
  className={`flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 shrink-0 ${className}`}
>
  <div className="flex items-center gap-2.5 min-w-0">
    {icon && <span className="text-gray-500 dark:text-gray-400 shrink-0">{icon}</span>}
    <div className="min-w-0">
      {title && (
        <h2 id={context.titleId} className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
      )}
    </div>
  </div>
  {showCloseButton && (
    <button
      type="button"
      onClick={handleClose}
      aria-label={closeAriaLabel}
      data-testid="drawer-close-button"
      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
    </button>
  )}
</header>
```

---

### File 4: `DrawerContent.jsx`

**Purpose**: Primary scrollable body container with independent scrollbar and horizontal overflow protection.

#### Props Contract
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Custom additional classes |
| `children` | `React.ReactNode` | — | Body content |
| `data-testid` | `string` | `'drawer-content'` | Testing selector |

#### Markup & Styling
```jsx
<div
  data-testid={dataTestId || 'drawer-content'}
  className={`flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin min-h-0 ${className}`}
>
  {children}
</div>
```

---

### File 5: `DrawerFooter.jsx`

**Purpose**: Footer section for actions, submission buttons, or status summaries.

#### Props Contract
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Custom additional classes |
| `children` | `React.ReactNode` | — | Footer controls/actions |
| `data-testid` | `string` | `'drawer-footer'` | Testing selector |

#### Markup & Styling
```jsx
<footer
  data-testid={dataTestId || 'drawer-footer'}
  className={`p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0 ${className}`}
>
  {children}
</footer>
```

---

### File 6: `DrawerToggle.jsx`

**Purpose**: Permanently accessible toggle trigger button for opening, closing, or compacting drawers.

#### Props Contract
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `side` | `'left' \| 'right'` | `'left'` | Drawer side this button controls |
| `open` | `boolean` | `undefined` | Controlled open state (or taken from context) |
| `compact` | `boolean` | `undefined` | Controlled compact state |
| `onToggle` | `() => void` | `undefined` | Toggle handler callback |
| `ariaLabel` | `string` | `undefined` | Explicit accessible description |
| `ariaControls` | `string` | `side === 'left' ? 'left-drawer' : 'right-drawer'` | Linked drawer ID |
| `data-testid` | `string` | `side === 'left' ? 'left-drawer-toggle' : 'right-drawer-toggle'` | Testing selector |
| `icon` | `any` | `undefined` | Custom icon component/node |
| `className` | `string` | `''` | Custom additional classes |
| `children` | `React.ReactNode` | `undefined` | Optional label text |

#### Permanent Accessibility Contract (Requirement R2, R5 Scenario 4)
- Must be rendered as `<button type="button">`.
- Retains fixed or sticky presence in header/navigation layout.
- Always renders `data-testid="left-drawer-toggle"` or `data-testid="right-drawer-toggle"`.
- Always updates `aria-expanded={Boolean(isOpen)}`.
- Always links to drawer with `aria-controls={ariaControls}`.
- Supports native keyboard activation via `Enter` and `Space`.

```jsx
<button
  type="button"
  onClick={handleClick}
  aria-expanded={Boolean(isOpen)}
  aria-controls={targetDrawerId}
  aria-label={computedAriaLabel}
  data-testid={dataTestId || (side === 'left' ? 'left-drawer-toggle' : 'right-drawer-toggle')}
  className={`inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${className}`}
>
  {icon ? (
    typeof icon === 'function' ? icon({ open: isOpen, compact: isCompact }) : icon
  ) : (
    <FontAwesomeIcon icon={defaultIcon} className="w-4 h-4" />
  )}
  {children}
</button>
```

---

### File 7: `LeftDrawer.jsx` (Navigation Drawer)

**Purpose**: Specialized navigation drawer providing expanded desktop sidebar (`w-64`), compact icon mode (`w-16`), collapsible groups, active route styling, and mobile temporary overlay modal.

#### Props Contract
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `undefined` | Controlled open state |
| `defaultOpen` | `boolean` | `true` | Default open state on desktop |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Open state callback |
| `compact` | `boolean` | `undefined` | Controlled compact icon mode |
| `defaultCompact`| `boolean` | `false` | Default compact mode |
| `onCompactChange`| `(compact: boolean) => void`| `undefined` | Compact mode callback |
| `storageKey` | `string` | `'dashboard-left-drawer'` | LocalStorage persistence key |
| `compactStorageKey` | `string` | `'dashboard-left-drawer-compact'` | LocalStorage persistence key for compact |
| `items` | `Array<NavItem>` | `[]` | Navigation items array |
| `currentPath` | `string` | `''` | Active route path for highlighting |
| `title` | `React.ReactNode` | `'Navegação'` | Drawer title in header |
| `variant` | `'responsive' \| 'persistent' \| 'temporary'` | `'responsive'` | Layout variant |
| `className` | `string` | `''` | Custom additional classes |
| `children` | `React.ReactNode` | `undefined` | Custom navigation content |

#### Navigation Item Specification (`NavItem`)
```typescript
interface NavItem {
  id: string;
  label: string;
  icon?: any;
  href?: string;
  badge?: string | number;
  active?: boolean;
  children?: Array<{ id: string; label: string; href: string; active?: boolean }>;
}
```

#### Behavioral Rules & Selectors
- Root element has `data-testid="left-drawer"`.
- `data-state`:
  - `"open"` when desktop expanded (`w-64`) or mobile modal open.
  - `"collapsed"` when desktop compact icon mode (`w-16`).
  - `"closed"` when desktop closed or mobile modal closed.
- Landmark role: `role="navigation"` on desktop; `role="dialog"` on mobile modal.
- Active item indicator: highlighted with background `bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium`.

---

### File 8: `RightDrawer.jsx` (Contextual Drawer)

**Purpose**: Specialized contextual panel for notifications, quick settings, detail cards, and contextual actions. Supports desktop expansion (`w-80`), desktop zero-width collapse (`w-0`), and mobile temporary overlay modal.

#### Props Contract
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `undefined` | Controlled open state |
| `defaultOpen` | `boolean` | `false` | Default open state (hidden by default) |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Open state callback |
| `storageKey` | `string` | `'dashboard-right-drawer'` | LocalStorage persistence key |
| `title` | `React.ReactNode` | `'Painel Contextual'` | Panel heading |
| `subtitle` | `React.ReactNode` | `undefined` | Subtitle description |
| `width` | `string` | `'w-80'` | Desktop expanded width class |
| `variant` | `'responsive' \| 'persistent' \| 'temporary'` | `'responsive'` | Layout variant |
| `className` | `string` | `''` | Custom additional classes |
| `children` | `React.ReactNode` | `undefined` | Contextual cards, forms, or tabs |

#### Behavioral Rules & Selectors
- Root element has `data-testid="right-drawer"`.
- `data-state`:
  - `"open"` when desktop expanded (`w-80`) or mobile modal open.
  - `"closed"` when desktop closed (`w-0 overflow-hidden opacity-0 pointer-events-none`) or mobile modal closed.
- Landmark role: `role="region"` or `role="complementary"` on desktop; `role="dialog"` on mobile modal.
- Simultaneous support: Right Drawer can be open alongside Left Drawer without collisions on desktop viewports.

---

### File 9: `index.js` (Barrel Exports)

**Purpose**: Unified public API entry point.

```javascript
'use client';

export { Drawer } from './Drawer';
export { DrawerHeader } from './DrawerHeader';
export { DrawerContent } from './DrawerContent';
export { DrawerFooter } from './DrawerFooter';
export { DrawerToggle } from './DrawerToggle';
export { LeftDrawer } from './LeftDrawer';
export { RightDrawer } from './RightDrawer';
export { useDrawer, useDrawerState, useDrawerContext, DrawerContext } from './useDrawer';
```

---

## 4. Tailwind CSS 4 Transitions, Dimensions, and Visual Contracts

### Breakpoints & Responsive Modes
The drawer system utilizes Tailwind 4's standard `lg` breakpoint (1024px) to separate desktop layout from mobile overlays:
- **Mobile (`< 1024px`)**:
  Both Left and Right drawers switch to `fixed inset-y-0 z-50` temporary modal overlays with backdrop.
  - Left Drawer slides in from `-translate-x-full` to `translate-x-0`. Width: `w-64 max-w-[85vw]`.
  - Right Drawer slides in from `translate-x-full` to `translate-x-0`. Width: `w-80 max-w-[85vw]`.
  - Backdrop: `fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out`.
  - Body scroll lock enabled (`overflow: hidden`).
- **Desktop (`>= 1024px`)**:
  Both drawers participate in the inline flex layout flow (`relative shrink-0`):
  - Left Drawer:
    - Expanded: `w-64` (256px)
    - Compact: `w-16` (64px)
    - Closed: `w-0 overflow-hidden opacity-0 pointer-events-none`
  - Right Drawer:
    - Expanded: `w-80` (320px)
    - Closed: `w-0 overflow-hidden opacity-0 pointer-events-none`
  - Central Main Area:
    `flex-1 min-w-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out`
    *(Crucial: `min-w-0` ensures the central area flexes down without horizontal scroll!)*

### CSS Transition Classes
- Width / layout transitions: `transition-all duration-300 ease-in-out`
- Slide transform transitions: `transition-transform duration-300 ease-in-out`
- Backdrop fade transitions: `transition-opacity duration-300 ease-in-out`
- Border styling:
  - Left drawer: `border-r border-gray-200 dark:border-gray-800`
  - Right drawer: `border-l border-gray-200 dark:border-gray-800`

---

## 5. Playwright Test Selectors & WAI-ARIA Verification Matrix

The table below maps the required test selectors and WAI-ARIA contracts directly to the 10 mandatory Playwright test scenarios:

| Scenario | Selector Under Test | Assertion / Expected Attribute | Action & Event |
|----------|---------------------|--------------------------------|----------------|
| **1. Left Drawer abre e fecha** | `[data-testid="left-drawer-toggle"]`<br>`[data-testid="left-drawer"]` | Toggle: `aria-expanded="true"` / `"false"`<br>Drawer: `data-state="open"` / `"closed"` / `"collapsed"` | Click toggle -> assert open;<br>Click toggle -> assert closed/collapsed |
| **2. Right Drawer abre e fecha** | `[data-testid="right-drawer-toggle"]`<br>`[data-testid="right-drawer"]` | Toggle: `aria-expanded="true"` / `"false"`<br>Drawer: `data-state="open"` / `"closed"` | Click toggle -> assert open;<br>Click toggle -> assert closed (`w-0`) |
| **3. Independência de estado** | `[data-testid="left-drawer"]`<br>`[data-testid="right-drawer"]` | Both can be `data-state="open"` simultaneously on desktop without colliding | Open left, assert right closed;<br>Open right, assert both open |
| **4. Toggle permanentemente acessível** | `[data-testid="left-drawer-toggle"]`<br>`[data-testid="right-drawer-toggle"]` | Buttons visible, `pointer-events: auto`, reachable in all permutations | Verify `toBeVisible()` and `toBeEnabled()` in all 4 state permutations |
| **5. Drawer fechado pode ser reaberto** | `[data-testid="left-drawer-toggle"]`<br>`[data-testid="left-drawer"]` | Re-entrant toggle cycle without frozen state | Sequence: Open -> Close -> Open -> Close -> Open |
| **6. Layout se adapta aos estados** | `[data-testid="dashboard-main"]`<br>`documentElement` | `scrollWidth <= clientWidth`<br>Central main width flexes dynamically | Verify zero horizontal scrollbar across all states |
| **7. Comportamento mobile** | `[data-testid="drawer-backdrop"]`<br>`[data-testid="left-drawer"]` | In mobile viewport (375px), backdrop renders with `data-testid="drawer-backdrop"` | Click backdrop -> drawer closes and backdrop is removed |
| **8. ESC fecha drawer temporário** | `[data-testid="left-drawer"]` / `right-drawer` | Drawer closes on `Escape` keydown event | Open mobile/temporary drawer, press `Escape` -> assert `data-state="closed"` |
| **9. Navegação por teclado** | `[data-testid="left-drawer-toggle"]`<br>`[data-testid="drawer-close-button"]` | Focus enters drawer on open, cycles with Tab/Shift-Tab, returns to toggle on close | Focus toggle -> press Enter -> press Tab -> press Escape -> assert toggle focused |
| **10. Zero referências a Axios/amCharts** | Global codebase scan | Zero import statements or bundle inclusions | Forensic integrity check |

---

## 6. Implementation Blueprint & Recommended Worker Execution Order

To minimize dependency friction and facilitate clean unit testing, the Worker should create the 9 files in the following exact sequence:

1. **Step 1: `src/components/ui/drawer/useDrawer.js`**
   - Implements `useDrawerState`, `useDrawerContext`, `DrawerContext`, and `useDrawer`.
   - Embeds hydration-safe `localStorage` synchronization with `try/catch`.
2. **Step 2: `src/components/ui/drawer/DrawerToggle.jsx`**
   - Implements permanent toggle button with `data-testid`, `aria-expanded`, and `aria-controls`.
3. **Step 3: `src/components/ui/drawer/DrawerHeader.jsx`**
   - Implements header bar, title heading `<h2>`, and accessible close button with `faXmark`.
4. **Step 4: `src/components/ui/drawer/DrawerContent.jsx`**
   - Implements scrollable container with `flex-1 overflow-y-auto min-h-0`.
5. **Step 5: `src/components/ui/drawer/DrawerFooter.jsx`**
   - Implements footer container with `shrink-0 border-t`.
6. **Step 6: `src/components/ui/drawer/Drawer.jsx`**
   - Implements base container orchestrating inline persistent layout and mobile modal overlay, backdrop `[data-testid="drawer-backdrop"]`, focus trap, ESC listener, and body scroll lock.
7. **Step 7: `src/components/ui/drawer/LeftDrawer.jsx`**
   - Implements navigation drawer with desktop `w-64` / compact `w-16` / mobile modal overlay and `data-testid="left-drawer"`.
8. **Step 8: `src/components/ui/drawer/RightDrawer.jsx`**
   - Implements contextual drawer with desktop `w-80` / closed `w-0` / mobile modal overlay and `data-testid="right-drawer"`.
9. **Step 9: `src/components/ui/drawer/index.js`**
   - Re-exports all components and hooks.

---

## 7. Concrete Code Architectures & Reference Sketches

### 7.1 `useDrawer.js`
```javascript
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useId } from 'react';

export const DrawerContext = createContext(null);

export function useDrawerContext() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawerContext must be used within a <Drawer> component');
  }
  return context;
}

export function useDrawerState({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  compact: controlledCompact,
  defaultCompact = false,
  onCompactChange,
  storageKey,
  compactStorageKey,
} = {}) {
  const isControlledOpen = controlledOpen !== undefined;
  const isControlledCompact = controlledCompact !== undefined;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [uncontrolledCompact, setUncontrolledCompact] = useState(defaultCompact);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration-safe localStorage synchronization
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window === 'undefined') return;

    if (storageKey && !isControlledOpen) {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved !== null) {
          setUncontrolledOpen(JSON.parse(saved));
        }
      } catch (err) {
        console.warn(`[useDrawer] Failed to read localStorage key "${storageKey}":`, err);
      }
    }

    if (compactStorageKey && !isControlledCompact) {
      try {
        const saved = window.localStorage.getItem(compactStorageKey);
        if (saved !== null) {
          setUncontrolledCompact(JSON.parse(saved));
        }
      } catch (err) {
        console.warn(`[useDrawer] Failed to read localStorage key "${compactStorageKey}":`, err);
      }
    }
  }, [storageKey, compactStorageKey, isControlledOpen, isControlledCompact]);

  const isOpen = isControlledOpen ? controlledOpen : uncontrolledOpen;
  const isCompact = isControlledCompact ? controlledCompact : uncontrolledCompact;

  const setOpen = useCallback((next) => {
    const resolveValue = (prev) => (typeof next === 'function' ? next(prev) : next);
    if (!isControlledOpen) {
      setUncontrolledOpen((prev) => {
        const val = resolveValue(prev);
        if (storageKey && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(val));
          } catch (e) {
            console.warn(`[useDrawer] Failed to write localStorage key "${storageKey}":`, e);
          }
        }
        return val;
      });
    }
    const val = resolveValue(isOpen);
    onOpenChange?.(val);
  }, [isControlledOpen, isOpen, onOpenChange, storageKey]);

  const setCompact = useCallback((next) => {
    const resolveValue = (prev) => (typeof next === 'function' ? next(prev) : next);
    if (!isControlledCompact) {
      setUncontrolledCompact((prev) => {
        const val = resolveValue(prev);
        if (compactStorageKey && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(compactStorageKey, JSON.stringify(val));
          } catch (e) {
            console.warn(`[useDrawer] Failed to write localStorage key "${compactStorageKey}":`, e);
          }
        }
        return val;
      });
    }
    const val = resolveValue(isCompact);
    onCompactChange?.(val);
  }, [isControlledCompact, isCompact, onCompactChange, compactStorageKey]);

  const openDrawer = useCallback(() => setOpen(true), [setOpen]);
  const closeDrawer = useCallback(() => setOpen(false), [setOpen]);
  const toggleDrawer = useCallback(() => setOpen((prev) => !prev), [setOpen]);
  const toggleCompact = useCallback(() => setCompact((prev) => !prev), [setCompact]);

  return {
    isOpen,
    isCompact,
    isControlled: isControlledOpen,
    open: openDrawer,
    close: closeDrawer,
    toggle: toggleDrawer,
    toggleCompact,
    setOpen,
    setCompact,
    isHydrated,
  };
}

export function useDrawer(options) {
  return useDrawerState(options);
}
```

### 7.2 `DrawerToggle.jsx`
```javascript
'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faChevronLeft, faChevronRight, faSliders } from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import { DrawerContext } from './useDrawer';

export function DrawerToggle({
  side = 'left',
  open: propOpen,
  compact: propCompact,
  onToggle: propOnToggle,
  ariaLabel,
  ariaControls,
  dataTestId,
  icon,
  className = '',
  children,
}) {
  const context = useContext(DrawerContext);

  const isOpen = propOpen !== undefined ? propOpen : context?.isOpen ?? false;
  const isCompact = propCompact !== undefined ? propCompact : context?.isCompact ?? false;
  const handleToggle = propOnToggle || context?.toggle;

  const targetId = ariaControls || (side === 'left' ? 'left-drawer' : 'right-drawer');
  const defaultTestId = side === 'left' ? 'left-drawer-toggle' : 'right-drawer-toggle';

  const defaultLabel = ariaLabel || (
    side === 'left'
      ? (isOpen ? 'Recolher menu de navegação' : 'Abrir menu de navegação')
      : (isOpen ? 'Fechar painel contextual' : 'Abrir painel contextual')
  );

  const defaultIcon = side === 'left' ? faBars : faSliders;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-expanded={Boolean(isOpen)}
      aria-controls={targetId}
      aria-label={defaultLabel}
      data-testid={dataTestId || defaultTestId}
      className={`inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${className}`}
    >
      {icon ? (
        typeof icon === 'function' ? icon({ open: isOpen, compact: isCompact }) : icon
      ) : (
        <FontAwesomeIcon icon={defaultIcon} className="w-4 h-4" />
      )}
      {children}
    </button>
  );
}
```

### 7.3 `DrawerHeader.jsx`
```javascript
'use client';

import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { DrawerContext } from './useDrawer';

export function DrawerHeader({
  title,
  subtitle,
  icon,
  showCloseButton = true,
  onClose,
  closeAriaLabel = 'Fechar painel',
  className = '',
  children,
  dataTestId = 'drawer-header',
}) {
  const context = useContext(DrawerContext);
  const handleClose = onClose || context?.close;
  const titleId = context?.titleId || 'drawer-title';

  return (
    <header
      data-testid={dataTestId}
      className={`flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 shrink-0 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="text-gray-500 dark:text-gray-400 shrink-0">{icon}</span>}
        <div className="min-w-0">
          {title && (
            <h2 id={titleId} className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {children}
        {showCloseButton && (
          <button
            type="button"
            onClick={handleClose}
            aria-label={closeAriaLabel}
            data-testid="drawer-close-button"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
```

### 7.4 `DrawerContent.jsx` & `DrawerFooter.jsx`
```javascript
'use client';

export function DrawerContent({ children, className = '', dataTestId = 'drawer-content' }) {
  return (
    <div
      data-testid={dataTestId}
      className={`flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 ${className}`}
    >
      {children}
    </div>
  );
}

export function DrawerFooter({ children, className = '', dataTestId = 'drawer-footer' }) {
  return (
    <footer
      data-testid={dataTestId}
      className={`p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0 ${className}`}
    >
      {children}
    </footer>
  );
}
```

### 7.5 `Drawer.jsx` (Base Component Architecture)
```javascript
'use client';

import { useRef, useEffect, useId, useState } from 'react';
import { DrawerContext, useDrawerState } from './useDrawer';

export function Drawer({
  side = 'left',
  variant = 'responsive',
  open,
  defaultOpen = false,
  onOpenChange,
  compact,
  defaultCompact = false,
  onCompactChange,
  storageKey,
  compactStorageKey,
  width,
  compactWidth = 'w-16',
  closeOnEsc = true,
  closeOnBackdropClick = true,
  trapFocus = true,
  lockScroll = true,
  ariaLabel,
  ariaLabelledBy,
  dataTestId,
  id,
  className = '',
  children,
}) {
  const generatedTitleId = useId();
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  const drawerState = useDrawerState({
    open,
    defaultOpen,
    onOpenChange,
    compact,
    defaultCompact,
    onCompactChange,
    storageKey,
    compactStorageKey,
  });

  const { isOpen, isCompact, close, toggle, toggleCompact, setOpen, setCompact } = drawerState;

  // Responsive state detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isModal = variant === 'temporary' || (variant === 'responsive' && isMobile);
  const defaultWidth = width || (side === 'right' ? 'w-80' : 'w-64');

  // Body scroll lock in modal mode
  useEffect(() => {
    if (!isModal || !isOpen || !lockScroll) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isModal, isOpen, lockScroll]);

  // ESC key dismissal and Focus Trap in modal mode
  useEffect(() => {
    if (!isModal || !isOpen) return;

    triggerRef.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (trapFocus && e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus into drawer
    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) focusables[0].focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isModal, isOpen, closeOnEsc, trapFocus, close]);

  const targetId = id || (side === 'left' ? 'left-drawer' : 'right-drawer');
  const targetTestId = dataTestId || (side === 'left' ? 'left-drawer' : 'right-drawer');

  const computedState = !isOpen
    ? 'closed'
    : (isCompact && side === 'left' ? 'collapsed' : 'open');

  const contextValue = {
    side,
    isOpen,
    isCompact,
    variant,
    isModal,
    close,
    toggle,
    toggleCompact,
    setOpen,
    setCompact,
    titleId: ariaLabelledBy || generatedTitleId,
  };

  // Determine width and positioning classes
  const positionClasses = isModal
    ? `fixed inset-y-0 ${side === 'left' ? 'left-0' : 'right-0'} z-50 ${defaultWidth} max-w-[85vw] ${
        isOpen
          ? 'translate-x-0'
          : side === 'left'
          ? '-translate-x-full'
          : 'translate-x-full'
      } transition-transform duration-300 ease-in-out`
    : `relative shrink-0 ${
        !isOpen
          ? 'w-0 overflow-hidden opacity-0 pointer-events-none'
          : isCompact && side === 'left'
          ? `${compactWidth} overflow-hidden`
          : defaultWidth
      } transition-all duration-300 ease-in-out`;

  const borderClass = side === 'left'
    ? 'border-r border-gray-200 dark:border-gray-800'
    : 'border-l border-gray-200 dark:border-gray-800';

  const defaultRole = isModal
    ? 'dialog'
    : side === 'left'
    ? 'navigation'
    : 'region';

  return (
    <DrawerContext.Provider value={contextValue}>
      {/* Backdrop for modal mode */}
      {isModal && isOpen && (
        <div
          data-testid="drawer-backdrop"
          aria-hidden="true"
          onClick={closeOnBackdropClick ? close : undefined}
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out"
        />
      )}

      {/* Drawer element */}
      <aside
        ref={drawerRef}
        id={targetId}
        data-testid={targetTestId}
        data-state={computedState}
        data-side={side}
        data-variant={variant}
        role={defaultRole}
        aria-modal={isModal ? 'true' : undefined}
        aria-label={ariaLabel}
        aria-labelledby={!ariaLabel && (ariaLabelledBy || generatedTitleId) ? (ariaLabelledBy || generatedTitleId) : undefined}
        className={`flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${borderClass} ${positionClasses} ${className}`}
      >
        {children}
      </aside>
    </DrawerContext.Provider>
  );
}
```

### 7.6 `LeftDrawer.jsx`
```javascript
'use client';

import { Drawer } from './Drawer';
import { DrawerHeader } from './DrawerHeader';
import { DrawerContent } from './DrawerContent';
import { DrawerFooter } from './DrawerFooter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass } from '@fortawesome/free-solid-svg-icons';

export function LeftDrawer({
  open,
  defaultOpen = true,
  onOpenChange,
  compact,
  defaultCompact = false,
  onCompactChange,
  storageKey = 'dashboard-left-drawer',
  compactStorageKey = 'dashboard-left-drawer-compact',
  items = [],
  currentPath = '',
  title = 'Navegação',
  variant = 'responsive',
  className = '',
  children,
  dataTestId = 'left-drawer',
}) {
  return (
    <Drawer
      side="left"
      variant={variant}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      compact={compact}
      defaultCompact={defaultCompact}
      onCompactChange={onCompactChange}
      storageKey={storageKey}
      compactStorageKey={compactStorageKey}
      dataTestId={dataTestId}
      id="left-drawer"
      ariaLabel="Navegação principal"
      className={className}
    >
      <DrawerHeader
        title={title}
        icon={<FontAwesomeIcon icon={faCompass} className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      />
      <DrawerContent>
        {children ? (
          children
        ) : (
          <nav className="space-y-1">
            {items.map((item) => {
              const isActive = item.active || currentPath === item.href;
              return (
                <a
                  key={item.id || item.href || item.label}
                  href={item.href || '#'}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
        )}
      </DrawerContent>
    </Drawer>
  );
}
```

### 7.7 `RightDrawer.jsx`
```javascript
'use client';

import { Drawer } from './Drawer';
import { DrawerHeader } from './DrawerHeader';
import { DrawerContent } from './DrawerContent';
import { DrawerFooter } from './DrawerFooter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders } from '@fortawesome/free-solid-svg-icons';

export function RightDrawer({
  open,
  defaultOpen = false,
  onOpenChange,
  storageKey = 'dashboard-right-drawer',
  title = 'Painel Contextual',
  subtitle,
  width = 'w-80',
  variant = 'responsive',
  className = '',
  children,
  footer,
  dataTestId = 'right-drawer',
}) {
  return (
    <Drawer
      side="right"
      variant={variant}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      storageKey={storageKey}
      width={width}
      dataTestId={dataTestId}
      id="right-drawer"
      ariaLabel="Painel contextual"
      className={className}
    >
      <DrawerHeader
        title={title}
        subtitle={subtitle}
        icon={<FontAwesomeIcon icon={faSliders} className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
      />
      <DrawerContent>
        {children}
      </DrawerContent>
      {footer && <DrawerFooter>{footer}</DrawerFooter>}
    </Drawer>
  );
}
```

---

## 8. Summary of Interface Guarantees

1. **Hydration Zero-Mismatch**: All localStorage reads happen exclusively inside `useEffect` on the client. Initial server-rendered HTML and client hydration markup match 100%.
2. **Permanent Accessibility**: `DrawerToggle` remains in the DOM with valid `aria-expanded` and `aria-controls` regardless of drawer state.
3. **Flexible Variants**: Supports `responsive`, `persistent`, `temporary`, and `compact` modes.
4. **Fluid Layout Safety**: Uses `flex-1 min-w-0` on central content and `transition-all duration-300` on sidebars, preventing horizontal scrollbars (`scrollWidth <= clientWidth`).
5. **Exact Selectors**: Conforms to all required test IDs (`[data-testid="left-drawer"]`, `[data-testid="right-drawer"]`, `[data-testid="left-drawer-toggle"]`, `[data-testid="right-drawer-toggle"]`, `[data-testid="drawer-backdrop"]`).
