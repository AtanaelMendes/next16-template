'use client';

import React, { useRef, useState, useEffect, useId } from 'react';
import {
  DrawerContext,
  useDrawerState,
  useDrawerAccessibility,
} from './useDrawer';
import { cn } from '@/lib/utils';

/**
 * Modern, reusable composite Drawer container.
 * Supports:
 * - Anchors: Left and Right
 * - Presentation: Responsive, Persistent, Temporary (Modal), and Compact icon modes
 * - Controlled and Uncontrolled state with safe localStorage synchronization
 * - Full WAI-ARIA compliance, focus trap, ESC dismissal, and body scroll lock
 *
 * @param {Object} props
 * @param {'left'|'right'} [props.side='left']
 * @param {'responsive'|'persistent'|'temporary'|'compact'} [props.variant='responsive']
 * @param {boolean} [props.open]
 * @param {boolean} [props.defaultOpen=false]
 * @param {(open: boolean) => void} [props.onOpenChange]
 * @param {boolean} [props.compact]
 * @param {boolean} [props.defaultCompact=false]
 * @param {(compact: boolean) => void} [props.onCompactChange]
 * @param {string} [props.storageKey]
 * @param {string} [props.compactStorageKey]
 * @param {string} [props.width]
 * @param {string} [props.compactWidth='w-16']
 * @param {boolean} [props.closeOnEsc=true]
 * @param {boolean} [props.closeOnBackdropClick=true]
 * @param {boolean} [props.trapFocus=true]
 * @param {boolean} [props.lockScroll=true]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.ariaLabelledBy]
 * @param {string} [props.id]
 * @param {string} [props.dataTestId]
 * @param {React.RefObject<HTMLElement>} [props.triggerRef]
 * @param {React.RefObject<HTMLElement>} [props.initialFocusRef]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function Drawer({
  side = 'left',
  variant = 'responsive',
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  compact: controlledCompact,
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
  id,
  dataTestId,
  triggerRef,
  initialFocusRef,
  className = '',
  children,
  ...props
}) {
  const generatedTitleId = useId();
  const drawerRef = useRef(null);

  // Responsive breakpoint detection (standard lg: 1024px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 1023px)');
    const handleMedia = (e) => setIsMobile(e.matches);
    setIsMobile(media.matches);
    if (media.addEventListener) {
      media.addEventListener('change', handleMedia);
      return () => media.removeEventListener('change', handleMedia);
    } else if (media.addListener) {
      media.addListener(handleMedia);
      return () => media.removeListener(handleMedia);
    }
  }, []);

  const isModal =
    variant === 'temporary' || (variant === 'responsive' && isMobile);

  // Initialize unified drawer state manager
  const drawerState = useDrawerState({
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
    compact: controlledCompact,
    defaultCompact,
    onCompactChange,
    storageKey,
    compactStorageKey,
  });

  const {
    isOpen,
    isCompact,
    openDrawer,
    closeDrawer,
    toggle,
    toggleCompact,
    setOpen,
    setCompact,
  } = drawerState;

  // WAI-ARIA Focus Trap, ESC dismissal and Scroll Lock in modal mode
  useDrawerAccessibility({
    drawerRef,
    open: isOpen,
    side,
    variant,
    isTemporary: isModal,
    onClose: closeOnEsc ? closeDrawer : undefined,
    triggerRef,
    initialFocusRef,
  });

  const targetId = id || (side === 'left' ? 'left-drawer' : 'right-drawer');
  const targetTestId =
    dataTestId ||
    props['data-testid'] ||
    (side === 'left' ? 'left-drawer' : 'right-drawer');

  const computedState = !isOpen
    ? 'closed'
    : isCompact && side === 'left'
    ? 'collapsed'
    : 'open';

  const defaultWidth = width || (side === 'right' ? 'w-80' : 'w-64');
  const titleId = ariaLabelledBy || generatedTitleId;

  // Default accessible name based on side
  const defaultLabel =
    side === 'left' ? 'Navegação principal' : 'Painel contextual';

  // Resolved accessible naming:
  // 1. If ariaLabelledBy is explicitly provided, bind aria-labelledby.
  // 2. Otherwise bind aria-label (custom prop or fallback defaultLabel).
  // This prevents dangling aria-labelledby pointing to unrendered generated IDs
  // and activates the previously unreachable fallback accessible name.
  const resolvedAriaLabelledBy = ariaLabelledBy || undefined;
  const resolvedAriaLabel = resolvedAriaLabelledBy
    ? undefined
    : ariaLabel || defaultLabel;

  // Layout mode positioning classes
  const positionClasses = isModal
    ? cn(
        'fixed inset-y-0 z-50 shadow-2xl max-w-[85vw] transition-transform duration-300 ease-in-out',
        side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        defaultWidth,
        isOpen
          ? 'translate-x-0'
          : side === 'left'
          ? '-translate-x-full pointer-events-none invisible'
          : 'translate-x-full pointer-events-none invisible'
      )
    : cn(
        'relative shrink-0 h-full transition-all duration-300 ease-in-out',
        side === 'left' ? 'border-r' : 'border-l',
        !isOpen
          ? 'w-0 overflow-hidden opacity-0 pointer-events-none invisible border-none!'
          : isCompact && side === 'left'
          ? `${compactWidth} overflow-hidden`
          : defaultWidth
      );

  const defaultRole = isModal
    ? 'dialog'
    : side === 'left'
    ? 'navigation'
    : 'region';

  const contextValue = {
    side,
    variant,
    isOpen,
    open: isOpen,
    isCompact,
    compact: isCompact,
    isModal,
    isTemporary: isModal,
    isHydrated: drawerState.isHydrated,
    drawerId: targetId,
    id: targetId,
    titleId,
    close: closeDrawer,
    closeDrawer,
    openDrawer,
    toggle,
    toggleCompact,
    setOpen,
    setCompact,
  };

  return (
    <DrawerContext.Provider value={contextValue}>
      {/* Semi-transparent backdrop for temporary modal mode */}
      {isModal && isOpen && (
        <div
          data-testid="drawer-backdrop"
          aria-hidden="true"
          onClick={closeOnBackdropClick ? closeDrawer : undefined}
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out backdrop-blur-xs"
        />
      )}

      {/* Main Drawer Container */}
      <aside
        ref={drawerRef}
        id={targetId}
        data-testid={targetTestId}
        data-state={computedState}
        data-side={side}
        data-variant={variant}
        role={defaultRole}
        aria-modal={isModal ? 'true' : undefined}
        aria-label={resolvedAriaLabel}
        aria-labelledby={resolvedAriaLabelledBy}
        inert={!isOpen ? true : undefined}
        tabIndex={isModal ? -1 : undefined}
        className={cn(
          'flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
          'border-gray-200 dark:border-gray-800',
          positionClasses,
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </DrawerContext.Provider>
  );
}
