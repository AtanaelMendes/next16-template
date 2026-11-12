# Accessibility (WAI-ARIA), Focus Management & DOM Event Specification Report

**Author**: Explorer 3  
**Date**: 2026-11-12  
**Milestone**: Milestone 2: Reusable Drawer Core System & Accessibility  
**Scope Document**: `c:\www\next16-template\.agents\teamwork\sub_orch_m2\SCOPE.md`  
**Test Suite Contract**: `c:\www\next16-template\tests\e2e\drawers.spec.ts`  

---

## 1. Executive Summary

This investigation provides the definitive accessibility (A11y), WAI-ARIA 1.2, focus management, and DOM lifecycle specification for the Reusable Drawer Core System in `next16-template`. 

Operating under **React 19.3.0**, **Next.js 16.4.6**, and **Tailwind CSS 4.3.3**, without external UI libraries (such as Radix or Headless UI), the Drawer system must provide bulletproof native accessibility that satisfies:
1. **WCAG 2.1 AA** Success Criteria (2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 4.1.2 Name, Role, Value).
2. **WAI-ARIA 1.2 Patterns**: Modal Dialog pattern for temporary overlays and Landmark Navigation/Complementary patterns for persistent desktop drawers.
3. **Playwright E2E Test Suite Contracts** (`tests/e2e/drawers.spec.ts`), notably:
   - Scenario 1 & 2: `aria-expanded` and `aria-controls` bindings.
   - Scenario 4: Permanent accessibility of `[data-testid="left-drawer-toggle"]` and `[data-testid="right-drawer-toggle"]` in all states and viewports.
   - Scenario 7: Mobile overlay with backdrop click dismissal and body scroll lock (`document.body.style.overflow = 'hidden'`).
   - Scenario 8: ESC key dismissal of temporary drawers with scroll and focus restoration.
   - Scenario 9: Full keyboard navigation (Enter/Space trigger, initial focus transfer into drawer, Tab/Shift-Tab focus trap, ESC dismissal, and focus restoration to the trigger button).

---

## 2. WAI-ARIA Roles & Landmark Semantics

The Drawer component operates in two distinct operational paradigms: **Temporary Overlay (Modal)** and **Persistent Inline (Landmark)**. Assistive technologies (screen readers like NVDA, JAWS, VoiceOver) require different roles and attributes depending on the active paradigm.

### 2.1 Semantic Mapping Matrix

| Paradigm | Component | Role | Attributes | Assistive Tech Behavior |
|---|---|---|---|---|
| **Temporary Overlay** (Mobile or `variant="temporary"`) | `Drawer` (Base Container) | `role="dialog"` | `aria-modal="true"`, `aria-labelledby="{titleId}"` (or `aria-label`), `id="{drawerId}"`, `data-testid="{side}-drawer"`, `data-state="open"` | Screen reader announces a modal dialog, isolates virtual navigation within dialog, announces header title. |
| **Temporary Overlay** | Backdrop | `presentation` or implicit `div` | `aria-hidden="true"`, `data-testid="drawer-backdrop"` | Hidden from screen reader tree; clickable surface for pointer dismissal. |
| **Persistent Inline** (Desktop `>= lg`) | `LeftDrawer` | `role="navigation"` | `aria-label="Navegação principal"`, `id="left-drawer"`, `data-testid="left-drawer"`, `data-state={open ? (compact ? 'collapsed' : 'open') : 'closed'}` | Screen reader registers standard navigation landmark in page landmarks list. |
| **Persistent Inline** (Desktop `>= lg`) | `RightDrawer` | `role="region"` or `role="complementary"` | `aria-label="Painel contextual"`, `id="right-drawer"`, `data-testid="right-drawer"`, `data-state={open ? 'open' : 'closed'}` | Screen reader registers complementary landmark. |
| **Both Paradigms** | `DrawerToggle` | Native `<button>` | `type="button"`, `aria-expanded={isOpen}`, `aria-controls="{drawerId}"`, `aria-label="{dynamicLabel}"`, `data-testid="{side}-drawer-toggle"` | Screen reader announces button, its controlled target, and its current expanded/collapsed state. |
| **Both Paradigms** | `DrawerHeader` Close Button | Native `<button>` | `type="button"`, `aria-label="Fechar painel"`, `title="Fechar"` | Screen reader announces action to close panel. |

### 2.2 Dynamic ARIA Attributes

1. **`aria-expanded`**:
   - Must be a boolean string (`"true"` or `"false"`).
   - Applied directly to the `<DrawerToggle />` element.
   - For `LeftDrawer`:
     * When expanded: `aria-expanded="true"`
     * When compact or closed: `aria-expanded="false"`
   - For `RightDrawer`:
     * When open: `aria-expanded="true"`
     * When closed: `aria-expanded="false"`

2. **`aria-controls`**:
   - Left toggle: `aria-controls="left-drawer"`
   - Right toggle: `aria-controls="right-drawer"`
   - Corresponds strictly to the HTML `id` attribute of the drawer panel container.

3. **`aria-labelledby` vs `aria-label`**:
   - `DrawerHeader` automatically generates a deterministic title ID: `${id || side + '-drawer'}-title`.
   - The title element renders `<h2 id={titleId} className="...">...</h2>`.
   - The drawer container specifies `aria-labelledby={titleId}`.
   - If no title is supplied, the drawer container falls back to `aria-label={ariaLabel || (side === 'left' ? 'Navegação principal' : 'Painel contextual')}`.

4. **Inert State on Collapsed / Closed Panels**:
   - When a drawer is closed on desktop (e.g. RightDrawer with `w-0 overflow-hidden`), internal interactive elements must not receive focus during standard page tabbing.
   - Setting `aria-hidden={!isOpen}` and `inert={!isOpen ? '' : undefined}` (or conditionally rendering children / applying `invisible` class) ensures screen readers and Tab keys ignore closed drawer contents.

---

## 3. Focus Management Architecture

A cornerstone of accessible modal dialogs is strict focus management: **Capturing the trigger**, **Transferring initial focus**, **Trapping Tab navigation**, and **Restoring focus upon closure**.

```
[ User presses Enter / Click on DrawerToggle ]
                     │
                     ▼
       Capture document.activeElement
            (triggerElementRef)
                     │
                     ▼
          Open Drawer (State -> true)
                     │
                     ▼
         Lock Body Scroll (overflow: hidden)
                     │
                     ▼
    requestAnimationFrame / microtask
                     │
                     ▼
     Find focusable elements in Drawer
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
Focusables found?         No focusables?
         │                       │
         ▼                       ▼
Focus 1st element         Focus drawer container
(Close button or link)    (tabIndex = -1)
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
       ┌───────────────────────────────┐
       │   FOCUS TRAP ACTIVE LOOP      │
       │                               │
       │ Tab on last  ──> Focus first  │
       │ Shift+Tab 1st──> Focus last   │
       └──────────────┬────────────────┘
                      │
   [ Dismiss via ESC / Backdrop / Toggle ]
                      │
                      ▼
         Unlock Body Scroll
                      │
                      ▼
        Restore Focus to Trigger
       (triggerElementRef.current.focus())
```

### 3.1 Comprehensive Focusable Element Selector

To identify all interactive elements capable of receiving keyboard focus inside the drawer:

```javascript
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export function getFocusableElements(container) {
  if (!container) return [];
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  return elements.filter((el) => {
    // Ensure element is visible and not display:none or visibility:hidden
    return (
      el.offsetWidth > 0 ||
      el.offsetHeight > 0 ||
      el.getClientRects().length > 0 ||
      window.getComputedStyle(el).visibility !== 'hidden'
    );
  });
}
```

### 3.2 Initial Focus Transfer

When a temporary drawer transitions to `open === true`:
1. Save `triggerElementRef.current = document.activeElement`.
2. Wait for the DOM update via `requestAnimationFrame` (ensuring Tailwind CSS transition classes and DOM elements are rendered).
3. Query focusables inside `drawerRef.current`.
4. If `initialFocusRef?.current` is provided and exists inside the drawer, focus it.
5. Otherwise, focus the first focusable element (typically the `DrawerHeader` close button or first navigation link).
6. If no focusable children exist, ensure `tabIndex="-1"` on the drawer container and call `drawerRef.current.focus()`.
7. **Verification**: Playwright Scenario 9 asserts:
   ```javascript
   const isFocusInside = await page.evaluate(() => {
     const drawerEl = document.querySelector('[data-testid="left-drawer"]');
     return drawerEl ? drawerEl.contains(document.activeElement) : false;
   });
   expect(isFocusInside).toBe(true);
   ```

### 3.3 Focus Trap Mechanics (Tab and Shift-Tab)

In temporary overlay mode, pressing `Tab` must never leak focus to the background dashboard or browser chrome:
- **Forward Tab (`e.key === 'Tab' && !e.shiftKey`)**:
  - Dynamically query focusables (to account for collapsible submenus or newly rendered elements).
  - If `document.activeElement === lastElement` (or focus is outside the container):
    - `e.preventDefault()`
    - `firstElement.focus()`
- **Backward Tab (`e.key === 'Tab' && e.shiftKey`)**:
  - If `document.activeElement === firstElement` (or focus is outside the container):
    - `e.preventDefault()`
    - `lastElement.focus()`

### 3.4 Focus Restoration (Return Focus)

When the drawer closes:
1. Check `triggerElementRef.current`.
2. Confirm the element is still attached to the DOM (`document.body.contains(triggerElementRef.current)`).
3. Execute `triggerElementRef.current.focus()` inside `requestAnimationFrame`.
4. **Verification**: Playwright Scenario 9 asserts:
   ```javascript
   await page.keyboard.press('Escape');
   await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);
   await expect(leftToggle).toBeFocused();
   ```

---

## 4. Keyboard Navigation System

### 4.1 Keydown Event Handling Matrix

| Key | Context | Behavior | Implementation Detail |
|---|---|---|---|
| **Escape (`Escape`)** | Temporary Overlay Open | Closes drawer immediately, releases scroll lock, restores trigger focus. | `e.stopPropagation(); e.preventDefault(); onClose?.();` |
| **Escape (`Escape`)** | Desktop Persistent Open | **Ignored** (or non-destructive). Persistent inline drawers do not close on ESC per standard landmark rules. | Key listener only attaches when `isTemporary` is active. |
| **Tab** | Temporary Overlay Open | Cycles forward through focusables; wraps from last to first. | `e.preventDefault(); firstElement.focus();` |
| **Shift + Tab** | Temporary Overlay Open | Cycles backward through focusables; wraps from first to last. | `e.preventDefault(); lastElement.focus();` |
| **Enter (`Enter`)** | Focus on `DrawerToggle` | Activates toggle (opens or closes drawer). | Standard native button `onClick`. |
| **Space (` `)** | Focus on `DrawerToggle` | Activates toggle without scrolling the page. | Prevent page scroll on Space: `if (e.key === ' ') { e.preventDefault(); onToggle(); }` |
| **Enter / Space** | Focus on Close Button | Closes drawer. | Standard native button `onClick`. |

---

## 5. Body Scroll Lock Management

### 5.1 The Problem
When a mobile overlay drawer is open, touch swipes and mouse wheels over the backdrop or content can cause the underlying document body to scroll ("scroll bleed"). 

### 5.2 Multi-Instance Reference Counted Lock
Because multiple overlay instances or consecutive state transitions can occur, a naive `document.body.style.overflow = ''` can cause race conditions. We specify a centralized reference-counted scroll manager:

```javascript
let activeLocksCount = 0;
let originalOverflowStyle = '';
let originalPaddingRight = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;

  if (activeLocksCount === 0) {
    originalOverflowStyle = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar layout shift on desktop viewports
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
  }
  activeLocksCount++;
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;

  activeLocksCount = Math.max(0, activeLocksCount - 1);
  if (activeLocksCount === 0) {
    document.body.style.overflow = originalOverflowStyle || '';
    document.body.style.paddingRight = originalPaddingRight || '';
  }
}
```

### 5.3 Viewport Resize Safety
If a user opens a temporary drawer on a mobile screen (`< 1024px`) and subsequently resizes or rotates the device to desktop width (`>= 1024px`), the drawer transitions to persistent mode. The hook must immediately release the scroll lock upon this transition.

---

## 6. Permanent Accessibility of `DrawerToggle`

Requirement R2 and Playwright Scenario 4 impose strict rules on `DrawerToggle`:
> "O botão de alternância de estado (DrawerToggle) deve estar permanentemente disponível e acessível para o usuário tanto com o drawer aberto quanto fechado, para ambos os lados."

Playwright Scenario 4 tests:
```typescript
const leftBoxInitial = await leftToggle.boundingBox();
expect(leftBoxInitial!.x).toBeGreaterThanOrEqual(0);
expect(leftBoxInitial!.y).toBeGreaterThanOrEqual(0);
expect(leftBoxInitial!.x + leftBoxInitial!.width).toBeLessThanOrEqual(vp.width + 10);

await leftToggle.click({ trial: true });
await leftToggle.click(); // opens left drawer
await expect(leftToggle).toBeVisible();
await expect(leftToggle).toBeEnabled();
await leftToggle.click({ trial: true }); // MUST STILL BE ACTIONABLE WHILE DRAWER IS OPEN
```

### 6.1 Z-Index Stacking Context Architecture

To ensure `leftToggle` and `rightToggle` remain actionable and never obscured when a drawer is open:

```
┌────────────────────────────────────────────────────────┐
│  DashboardHeader: z-index: 50 (or z-[60])              │
│  [ Toggle Left ]                         [ Toggle Right]│
└────────────────────────────────────────────────────────┘
          │                                 │
          ▼                                 ▼
┌─────────────────────────┐       ┌──────────────────────┐
│ Left Drawer:            │       │ Right Drawer:        │
│ z-index: 50             │       │ z-index: 50          │
│ top: 4rem (below header)│       │ top: 4rem (below hdr)│
└─────────────────────────┘       └──────────────────────┘
          │                                 │
          ▼                                 ▼
┌────────────────────────────────────────────────────────┐
│ Backdrop Overlay: z-index: 40                          │
│ top: 4rem (or inset-0 with header at higher z-index)   │
│ data-testid="drawer-backdrop"                          │
└────────────────────────────────────────────────────────┘
```

#### Key Positioning Rules:
1. **Persistent Header Placement**:
   - `DashboardHeader` has `sticky top-0 z-50 h-16 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800`.
   - Toggle buttons (`data-testid="left-drawer-toggle"` and `data-testid="right-drawer-toggle"`) reside inside `DashboardHeader`.
2. **Overlay Positioning**:
   - The backdrop (`data-testid="drawer-backdrop"`) has `fixed inset-0 z-40 bg-black/50 backdrop-blur-xs`.
   - Because `DashboardHeader` has `z-50`, the header sits **above** the backdrop.
   - The mobile temporary drawer panel has `fixed inset-y-0 z-50` (or `top-16 bottom-0 z-50`).
   - If the drawer panel is full height (`inset-y-0`), the header toggle on that side can also be rendered within the header with `z-[60]` or the header toggle can remain at `x: 16px, y: 16px` without overlapping the close button.
   - **Critical Design**: Giving `DashboardHeader` `z-50` and the backdrop `z-40` ensures that clicking `[data-testid="left-drawer-toggle"]` or `[data-testid="right-drawer-toggle"]` is never intercepted by the backdrop overlay! Both toggles remain 100% visible, inside the viewport, and clickable in all open/closed permutations.

---

## 7. Concrete Implementation Architecture: `useDrawerAccessibility`

We formulate a self-contained, React 19 hook encapsulating all DOM listeners, focus trap, return focus, ESC dismissal, and scroll locking:

```javascript
// src/components/ui/drawer/useDrawerAccessibility.js
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getFocusableElements } from './utils';
import { lockBodyScroll, unlockBodyScroll } from './scrollLock';

/**
 * Hook providing comprehensive WAI-ARIA focus trap, keyboard navigation,
 * body scroll lock, and return focus mechanics.
 *
 * @param {Object} options
 * @param {React.RefObject<HTMLElement>} options.drawerRef - Ref to the drawer container
 * @param {boolean} options.isOpen - Current drawer open state
 * @param {boolean} options.isTemporary - Whether drawer is behaving as temporary modal overlay
 * @param {() => void} options.onClose - Dismiss callback
 * @param {React.RefObject<HTMLElement>} [options.initialFocusRef] - Optional element to focus first
 * @param {React.RefObject<HTMLElement>} [options.triggerRef] - Explicit trigger button ref
 */
export function useDrawerAccessibility({
  drawerRef,
  isOpen,
  isTemporary,
  onClose,
  initialFocusRef,
  triggerRef,
}) {
  const internalTriggerRef = useRef(null);

  // 1. Capture active element before opening
  useEffect(() => {
    if (isOpen && isTemporary) {
      if (triggerRef?.current) {
        internalTriggerRef.current = triggerRef.current;
      } else if (typeof document !== 'undefined' && document.activeElement) {
        internalTriggerRef.current = document.activeElement;
      }
    }
  }, [isOpen, isTemporary, triggerRef]);

  // 2. Body scroll lock lifecycle
  useEffect(() => {
    if (isOpen && isTemporary) {
      lockBodyScroll();
      return () => {
        unlockBodyScroll();
      };
    }
  }, [isOpen, isTemporary]);

  // 3. Initial focus transfer into drawer
  useEffect(() => {
    if (!isOpen || !isTemporary) return;

    let animFrameId;
    animFrameId = requestAnimationFrame(() => {
      if (!drawerRef.current) return;

      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }

      const focusables = getFocusableElements(drawerRef.current);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        // Fallback: make container focusable and focus it
        if (!drawerRef.current.hasAttribute('tabindex')) {
          drawerRef.current.setAttribute('tabindex', '-1');
        }
        drawerRef.current.focus();
      }
    });

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isOpen, isTemporary, drawerRef, initialFocusRef]);

  // 4. Keyboard listeners: ESC dismissal & Tab focus trap
  useEffect(() => {
    if (!isOpen || !isTemporary) return;

    const handleKeyDown = (e) => {
      // ESC Key dismissal
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
        return;
      }

      // Tab Key focus trap
      if (e.key === 'Tab') {
        if (!drawerRef.current) return;

        const focusables = getFocusableElements(drawerRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];
        const activeElement = document.activeElement;

        if (e.shiftKey) {
          // Backward tab: wrap from first to last
          if (activeElement === firstElement || !drawerRef.current.contains(activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Forward tab: wrap from last to first
          if (activeElement === lastElement || !drawerRef.current.contains(activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, isTemporary, drawerRef, onClose]);

  // 5. Return focus restoration when drawer closes
  const prevOpenRef = useRef(isOpen);
  useEffect(() => {
    // Detect transition from true -> false
    if (prevOpenRef.current && !isOpen && isTemporary) {
      const targetToFocus = triggerRef?.current || internalTriggerRef.current;
      if (targetToFocus && typeof targetToFocus.focus === 'function') {
        requestAnimationFrame(() => {
          if (document.body.contains(targetToFocus)) {
            targetToFocus.focus();
          }
        });
      }
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, isTemporary, triggerRef]);
}
```

---

## 8. Component Code Blueprints & ARIA Integration

### 8.1 `DrawerToggle.jsx`
```javascript
'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export function DrawerToggle({
  side = 'left',
  open = false,
  compact = false,
  onToggle,
  ariaLabel,
  className = '',
  ...props
}) {
  const drawerId = `${side}-drawer`;
  const defaultLabel = side === 'left'
    ? (open ? 'Recolher navegação' : 'Abrir navegação')
    : (open ? 'Fechar painel lateral' : 'Abrir painel lateral');

  const label = ariaLabel || defaultLabel;

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault(); // Prevent page scroll on space
      onToggle?.();
    }
  };

  return (
    <button
      type="button"
      data-testid={`${side}-drawer-toggle`}
      aria-controls={drawerId}
      aria-expanded={open}
      aria-label={label}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150 ${className}`}
      {...props}
    >
      <FontAwesomeIcon
        icon={side === 'left' ? (open && !compact ? faChevronLeft : faBars) : (open ? faXmark : faBars)}
        className="w-5 h-5"
      />
    </button>
  );
}
```

### 8.2 Base `Drawer.jsx`
```javascript
'use client';

import React, { useRef } from 'react';
import { useDrawerAccessibility } from './useDrawerAccessibility';

export function Drawer({
  side = 'left',
  variant = 'responsive',
  open = false,
  onOpenChange,
  titleId,
  ariaLabel,
  className = '',
  children,
  ...props
}) {
  const drawerRef = useRef(null);
  const drawerId = `${side}-drawer`;
  const isTemporary = variant === 'temporary'; // Or responsive mobile evaluated dynamically

  useDrawerAccessibility({
    drawerRef,
    isOpen: open,
    isTemporary,
    onClose: () => onOpenChange?.(false),
  });

  const role = isTemporary ? 'dialog' : (side === 'left' ? 'navigation' : 'region');
  const dataState = open ? 'open' : 'closed';

  return (
    <>
      {/* Backdrop overlay for temporary mode */}
      {isTemporary && open && (
        <div
          data-testid="drawer-backdrop"
          aria-hidden="true"
          onClick={() => onOpenChange?.(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Drawer Container */}
      <aside
        ref={drawerRef}
        id={drawerId}
        role={role}
        aria-modal={isTemporary ? 'true' : undefined}
        aria-labelledby={titleId}
        aria-label={!titleId ? (ariaLabel || (side === 'left' ? 'Navegação principal' : 'Painel contextual')) : undefined}
        data-testid={`${side}-drawer`}
        data-state={dataState}
        className={`... transition-all duration-300 ease-in-out ${className}`}
        {...props}
      >
        {children}
      </aside>
    </>
  );
}
```

### 8.3 `DrawerHeader.jsx`
```javascript
'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export function DrawerHeader({
  title,
  subtitle,
  icon,
  showCloseButton = true,
  onClose,
  titleId,
  className = '',
  children,
}) {
  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 shrink-0 ${className}`}>
      <div className="flex items-center space-x-3 min-w-0">
        {icon && <span className="text-gray-500 shrink-0">{icon}</span>}
        <div className="min-w-0">
          {title && (
            <h2 id={titleId} className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {showCloseButton && onClose && (
        <button
          type="button"
          aria-label="Fechar painel"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
        </button>
      )}
      {children}
    </div>
  );
}
```

---

## 9. Verification & Testing Matrix

The table below maps each accessibility requirement directly to the Playwright E2E assertion:

| Requirement | Playwright E2E Test | Exact Selector / Assertion in `drawers.spec.ts` | Pass Criteria |
|---|---|---|---|
| Toggle ARIA Attributes | Scenario 1 & Scenario 2 | `await expect(toggle).toHaveAttribute('aria-expanded', 'true' / 'false')`<br>`await expect(toggle).toHaveAttribute('aria-controls', 'left-drawer')` | `aria-expanded` strictly reflects state, `aria-controls` matches container ID. |
| Toggle Permanent Reachability | Scenario 4 | Viewports: Desktop (1280x800) & Mobile (375x667).<br>`leftBox.x >= 0, leftBox.y >= 0, leftBox.x + width <= vp.width + 10`<br>`await leftToggle.click({ trial: true })` | Toggles are visible, enabled, inside viewport, and actionable both when drawers are open and closed. |
| Mobile Backdrop Click | Scenario 7 | Mobile 375x667.<br>`await backdrop.click({ position: ... })`<br>`await expect(backdrop).toBeHidden()` | Clicking outside the drawer on backdrop closes drawer and dismisses overlay. |
| Mobile Body Scroll Lock | Scenario 7 & Scenario 8 | `await page.evaluate(() => document.body.style.overflow)` | Returns `'hidden'` when open, returns not `'hidden'` after closing. |
| ESC Key Dismissal | Scenario 8 | `await page.keyboard.press('Escape')`<br>`await expect(backdrop).toBeHidden()`<br>`await expect(leftDrawer).toHaveAttribute('data-state', /closed\|collapsed/)` | Pressing Escape dismisses mobile drawer overlay and removes backdrop. |
| Keyboard Trigger | Scenario 9 | `await leftToggle.focus()`<br>`await page.keyboard.press('Enter')` | Drawer opens via keyboard activation. |
| Initial Focus Transfer | Scenario 9 | `document.querySelector('[data-testid="left-drawer"]').contains(document.activeElement)` | Evaluates to `true` immediately after opening. |
| Focus Trap (Tab Cycle) | Scenario 9 | 4 consecutive `page.keyboard.press('Tab')` calls.<br>`drawerEl.contains(document.activeElement)` | Evaluates to `true` on every single Tab press; focus never leaks out. |
| Return Focus | Scenario 9 | After ESC dismissal: `await expect(leftToggle).toBeFocused()` | Focus returns cleanly to the button that originally opened the drawer. |

---

## 10. Conclusion & Recommendations for Sub-Orchestrator

1. **Adopt `useDrawerAccessibility` as a shared core hook** located in `src/components/ui/drawer/useDrawerAccessibility.js` (or integrated within `useDrawer.js`).
2. **Implement reference-counted scroll locking** in `src/components/ui/drawer/scrollLock.js` to ensure bulletproof cleanup and prevent multi-drawer race conditions.
3. **Set `DashboardHeader` with `z-50` and the Backdrop with `z-40`**: this cleanly fulfills Playwright Scenario 4 without complex coordinate hacks, keeping toggles permanently reachable and actionable on all viewports.
4. **Use `requestAnimationFrame` for initial focus and return focus**: this guarantees that DOM layout shifts and React 19 rendering cycles are fully committed before `.focus()` is called.
