import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";

// ============================================================================
// Focus Management & Accessibility Helpers
// ============================================================================

export const FOCUSABLE_SELECTOR = [
    'a[href]:not([tabindex="-1"])',
    'area[href]:not([tabindex="-1"])',
    'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'iframe:not([tabindex="-1"])',
    'object:not([tabindex="-1"])',
    'embed:not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]:not([tabindex="-1"])',
].join(", ");

/**
 * Returns all visible focusable elements within a container element.
 * Excludes disabled elements, elements with tabindex="-1", and invisible elements
 * (display: none, visibility: hidden, or elements inside hidden parents).
 *
 * @param {HTMLElement|null} container
 * @returns {HTMLElement[]}
 */
export function getFocusableElements(container) {
    if (!container || typeof window === "undefined") return [];
    const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
    return elements.filter((el) => {
        if (
            el.getAttribute("tabindex") === "-1" ||
            el.hasAttribute("disabled") ||
            el.disabled
        ) {
            return false;
        }
        const style = window.getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") {
            return false;
        }
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
}

// ============================================================================
// Reference-Counted Body Scroll Lock
// ============================================================================

let activeLocksCount = 0;
let originalOverflowStyle = "";

/**
 * Locks document body scroll with reference counting to prevent multi-instance race conditions.
 */
export function lockBodyScroll() {
    if (typeof document === "undefined") return;
    if (activeLocksCount === 0) {
        originalOverflowStyle = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }
    activeLocksCount++;
}

/**
 * Unlocks document body scroll when all active locks have been released.
 */
export function unlockBodyScroll() {
    if (typeof document === "undefined") return;
    activeLocksCount = Math.max(0, activeLocksCount - 1);
    if (activeLocksCount === 0) {
        document.body.style.overflow = originalOverflowStyle || "";
    }
}

// ============================================================================
// Safe Storage Adapter (Private Browsing & SSR Resilient)
// ============================================================================

/**
 * Defensive localStorage wrapper providing try/catch guards against
 * SecurityError (private browsing), QuotaExceededError, SSR guards, and syntax errors.
 */
export const safeStorage = {
    getItem: (key, fallback = null) => {
        if (typeof window === "undefined" || !key) return fallback;
        try {
            const item = window.localStorage.getItem(key);
            if (item === null) return fallback;
            return JSON.parse(item);
        } catch {
            return fallback;
        }
    },

    setItem: (key, value) => {
        if (typeof window === "undefined" || !key) return false;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },

    removeItem: (key) => {
        if (typeof window === "undefined" || !key) return false;
        try {
            window.localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },
};

// ============================================================================
// Two-Phase Hydration-Safe Hook
// ============================================================================

/**
 * Two-phase hydration hook: renders SSR default initial state,
 * synchronizing with localStorage only after client-side hydration mount.
 *
 * @param {string|null|undefined} storageKey
 * @param {any} defaultState
 * @returns {[any, Function, boolean]} [state, setState, isHydrated]
 */
export function useHydratedDrawerState(storageKey, defaultState = false) {
    const [state, setState] = useState(defaultState);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
        if (!storageKey || typeof window === "undefined") return;

        const saved = safeStorage.getItem(storageKey, null);
        if (saved !== null) {
            const resolved = typeof saved === "object" && saved !== null ? saved.open : saved;
            if (typeof resolved === "boolean") {
                setState(resolved);
            } else if (saved !== undefined) {
                setState(saved);
            }
        }
    }, [storageKey]);

    const updateState = useCallback(
        (next) => {
            setState((prev) => {
                const resolved = typeof next === "function" ? next(prev) : next;
                if (storageKey) {
                    safeStorage.setItem(storageKey, resolved);
                }
                return resolved;
            });
        },
        [storageKey],
    );

    return [state, updateState, isHydrated];
}

// ============================================================================
// Unified Drawer State Manager Hook
// ============================================================================

/**
 * Unified Drawer State Manager Hook supporting:
 * - Controlled mode: `open`, `onOpenChange`
 * - Uncontrolled mode: `defaultOpen`, `storageKey`
 * - Compact icon mode: `compact`, `defaultCompact`, `compactStorageKey`
 * - Cross-tab synchronization via window 'storage' events
 * - Guaranteed zero hydration mismatch in Next.js 16 / React 19
 *
 * @param {Object} options
 * @param {boolean} [options.open]
 * @param {boolean} [options.defaultOpen=false]
 * @param {(open: boolean) => void} [options.onOpenChange]
 * @param {boolean} [options.compact]
 * @param {boolean} [options.defaultCompact=false]
 * @param {(compact: boolean) => void} [options.onCompactChange]
 * @param {string} [options.storageKey]
 * @param {string} [options.compactStorageKey]
 */
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

    // Phase 1: Initialize strictly with defaults to match SSR output
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const [internalCompact, setInternalCompact] = useState(defaultCompact);
    const [isHydrated, setIsHydrated] = useState(false);

    // Phase 2: Post-mount hydration from localStorage for uncontrolled modes
    useEffect(() => {
        setIsHydrated(true);
        if (typeof window === "undefined") return;

        if (!isControlledOpen && storageKey) {
            const saved = safeStorage.getItem(storageKey, null);
            if (saved !== null) {
                const resolved = typeof saved === "object" && saved !== null ? saved.open : saved;
                if (typeof resolved === "boolean") {
                    setInternalOpen(resolved);
                    onOpenChange?.(resolved);
                }
            }
        }

        if (!isControlledCompact && compactStorageKey) {
            const saved = safeStorage.getItem(compactStorageKey, null);
            if (saved !== null) {
                const resolved =
                    typeof saved === "object" && saved !== null ? saved.compact : saved;
                if (typeof resolved === "boolean") {
                    setInternalCompact(resolved);
                    onCompactChange?.(resolved);
                }
            }
        }
    }, [
        storageKey,
        compactStorageKey,
        isControlledOpen,
        isControlledCompact,
        onOpenChange,
        onCompactChange,
    ]);

    // Cross-tab synchronization
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleStorage = (event) => {
            if (
                !isControlledOpen &&
                storageKey &&
                event.key === storageKey &&
                event.newValue !== null
            ) {
                try {
                    const parsed = JSON.parse(event.newValue);
                    const resolved =
                        typeof parsed === "object" && parsed !== null ? parsed.open : parsed;
                    if (typeof resolved === "boolean") {
                        setInternalOpen(resolved);
                        onOpenChange?.(resolved);
                    }
                } catch {
                    // Ignore external malformed entries
                }
            }

            if (
                !isControlledCompact &&
                compactStorageKey &&
                event.key === compactStorageKey &&
                event.newValue !== null
            ) {
                try {
                    const parsed = JSON.parse(event.newValue);
                    const resolved =
                        typeof parsed === "object" && parsed !== null ? parsed.compact : parsed;
                    if (typeof resolved === "boolean") {
                        setInternalCompact(resolved);
                        onCompactChange?.(resolved);
                    }
                } catch {
                    // Ignore external malformed entries
                }
            }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [
        storageKey,
        compactStorageKey,
        isControlledOpen,
        isControlledCompact,
        onOpenChange,
        onCompactChange,
    ]);

    const isOpen = isControlledOpen ? Boolean(controlledOpen) : Boolean(internalOpen);
    const isCompact = isControlledCompact
        ? Boolean(controlledCompact)
        : Boolean(internalCompact);

    const setOpen = useCallback(
        (next) => {
            const current = isControlledOpen ? Boolean(controlledOpen) : Boolean(internalOpen);
            const nextVal = typeof next === "function" ? next(current) : next;

            if (!isControlledOpen) {
                setInternalOpen(nextVal);
                if (storageKey) {
                    safeStorage.setItem(storageKey, nextVal);
                }
            }

            onOpenChange?.(nextVal);
        },
        [isControlledOpen, controlledOpen, internalOpen, storageKey, onOpenChange],
    );

    const setCompact = useCallback(
        (next) => {
            const current = isControlledCompact
                ? Boolean(controlledCompact)
                : Boolean(internalCompact);
            const nextVal = typeof next === "function" ? next(current) : next;

            if (!isControlledCompact) {
                setInternalCompact(nextVal);
                if (compactStorageKey) {
                    safeStorage.setItem(compactStorageKey, nextVal);
                }
            }

            onCompactChange?.(nextVal);
        },
        [
            isControlledCompact,
            controlledCompact,
            internalCompact,
            compactStorageKey,
            onCompactChange,
        ],
    );

    const openDrawer = useCallback(() => setOpen(true), [setOpen]);
    const closeDrawer = useCallback(() => setOpen(false), [setOpen]);
    const toggle = useCallback(() => setOpen((prev) => !prev), [setOpen]);
    const toggleCompact = useCallback(() => setCompact((prev) => !prev), [setCompact]);

    return {
        open: isOpen,
        isOpen,
        compact: isCompact,
        isCompact,
        isControlled: isControlledOpen,
        isControlledCompact,
        isHydrated,
        setOpen,
        setCompact,
        openDrawer,
        close: closeDrawer,
        closeDrawer,
        toggle,
        toggleCompact,
    };
}

export function useDrawer(options) {
    return useDrawerState(options);
}

// ============================================================================
// WAI-ARIA Focus Trap, Scroll Lock & Keyboard Accessibility Hook
// ============================================================================

/**
 * Comprehensive WAI-ARIA focus trap, return focus, ESC dismissal,
 * and body scroll locking hook for temporary overlay drawers.
 *
 * @param {Object} options
 * @param {React.RefObject<HTMLElement>} options.drawerRef
 * @param {boolean} [options.open]
 * @param {boolean} [options.isOpen]
 * @param {string} [options.side]
 * @param {string} [options.variant]
 * @param {boolean} [options.isTemporary]
 * @param {() => void} [options.onClose]
 * @param {React.RefObject<HTMLElement>} [options.initialFocusRef]
 * @param {React.RefObject<HTMLElement>} [options.triggerRef]
 */
export function useDrawerAccessibility({
    drawerRef,
    open,
    isOpen,
    side,
    variant,
    isTemporary,
    onClose,
    initialFocusRef,
    triggerRef,
}) {
    const activeOpen = Boolean(open !== undefined ? open : isOpen);
    const activeTemporary =
        isTemporary !== undefined ? Boolean(isTemporary) : variant === "temporary";

    const savedTriggerRef = useRef(null);
    const prevOpenRef = useRef(activeOpen);

    // 1. Capture active element trigger when drawer is opened
    useEffect(() => {
        if (activeOpen && activeTemporary) {
            if (triggerRef?.current) {
                savedTriggerRef.current = triggerRef.current;
            } else if (typeof document !== "undefined" && document.activeElement) {
                savedTriggerRef.current = document.activeElement;
            }
        }
    }, [activeOpen, activeTemporary, triggerRef]);

    // 2. Reference-counted body scroll lock
    useEffect(() => {
        if (activeOpen && activeTemporary) {
            lockBodyScroll();
            return () => {
                unlockBodyScroll();
            };
        }
    }, [activeOpen, activeTemporary]);

    // 3. Initial focus transfer into drawer
    useEffect(() => {
        if (!activeOpen || !activeTemporary) return;

        let rafId = requestAnimationFrame(() => {
            if (!drawerRef?.current) return;

            if (initialFocusRef?.current) {
                initialFocusRef.current.focus();
                return;
            }

            const focusables = getFocusableElements(drawerRef.current);
            if (focusables.length > 0) {
                focusables[0].focus();
            } else {
                if (!drawerRef.current.hasAttribute("tabindex")) {
                    drawerRef.current.setAttribute("tabindex", "-1");
                }
                drawerRef.current.focus();
            }
        });

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [activeOpen, activeTemporary, drawerRef, initialFocusRef]);

    // 4. Focus trap & ESC key dismissal
    useEffect(() => {
        if (!activeOpen || !activeTemporary) return;

        const handleKeyDown = (e) => {
            // ESC Key dismissal
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose?.();
                return;
            }

            // Tab Key focus trap
            if (e.key === "Tab") {
                if (!drawerRef?.current) return;

                const focusables = getFocusableElements(drawerRef.current);
                if (focusables.length === 0) {
                    e.preventDefault();
                    return;
                }

                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement;

                if (e.shiftKey) {
                    // Backward tab: wrap from first to last
                    if (active === first || !drawerRef.current.contains(active)) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    // Forward tab: wrap from last to first
                    if (active === last || !drawerRef.current.contains(active)) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);
        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [activeOpen, activeTemporary, drawerRef, onClose]);

    // 5. Return focus to trigger button upon drawer closure
    useEffect(() => {
        if (prevOpenRef.current && !activeOpen && activeTemporary) {
            const target = triggerRef?.current || savedTriggerRef.current;
            if (target && typeof target.focus === "function") {
                requestAnimationFrame(() => {
                    if (typeof document !== "undefined" && document.body.contains(target)) {
                        target.focus();
                    }
                });
            }
        }
        prevOpenRef.current = activeOpen;
    }, [activeOpen, activeTemporary, triggerRef]);
}

// ============================================================================
// Compound Component Context
// ============================================================================

export const DrawerContext = createContext(null);

export function useDrawerContext() {
    const context = useContext(DrawerContext);
    if (!context) {
        throw new Error("useDrawerContext must be used within a <Drawer> provider");
    }
    return context;
}
