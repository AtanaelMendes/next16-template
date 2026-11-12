'use client';
function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties(source, excluded) {
    if (source == null) return {};
    var target = {}, sourceKeys, key, i;
    if (typeof Reflect !== "undefined" && Reflect.ownKeys) {
        sourceKeys = Reflect.ownKeys(Object(source));
        for(i = 0; i < sourceKeys.length; i++){
            key = sourceKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
        return target;
    }
    target = _object_without_properties_loose(source, excluded);
    if (Object.getOwnPropertySymbols) {
        sourceKeys = Object.getOwnPropertySymbols(source);
        for(i = 0; i < sourceKeys.length; i++){
            key = sourceKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
    }
    return target;
}
function _object_without_properties_loose(source, excluded) {
    if (source == null) return {};
    var target = {}, sourceKeys = Object.getOwnPropertyNames(source), key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
    }
    return target;
}
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useState, useEffect, useId } from 'react';
import { DrawerContext, useDrawerState, useDrawerAccessibility } from '../../../src/components/ui/drawer/useDrawer.js';
import { cn } from '../../../src/lib/utils.js';
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
 */ export function Drawer(_0) {
    var _0_side = _0.side, side = _0_side === void 0 ? 'left' : _0_side, _0_variant = _0.variant, variant = _0_variant === void 0 ? 'responsive' : _0_variant, controlledOpen = _0.open, _0_defaultOpen = _0.defaultOpen, defaultOpen = _0_defaultOpen === void 0 ? false : _0_defaultOpen, onOpenChange = _0.onOpenChange, controlledCompact = _0.compact, _0_defaultCompact = _0.defaultCompact, defaultCompact = _0_defaultCompact === void 0 ? false : _0_defaultCompact, onCompactChange = _0.onCompactChange, storageKey = _0.storageKey, compactStorageKey = _0.compactStorageKey, width = _0.width, _0_compactWidth = _0.compactWidth, compactWidth = _0_compactWidth === void 0 ? 'w-16' : _0_compactWidth, _0_closeOnEsc = _0.closeOnEsc, closeOnEsc = _0_closeOnEsc === void 0 ? true : _0_closeOnEsc, _0_closeOnBackdropClick = _0.closeOnBackdropClick, closeOnBackdropClick = _0_closeOnBackdropClick === void 0 ? true : _0_closeOnBackdropClick, _0_trapFocus = _0.trapFocus, trapFocus = _0_trapFocus === void 0 ? true : _0_trapFocus, _0_lockScroll = _0.lockScroll, lockScroll = _0_lockScroll === void 0 ? true : _0_lockScroll, ariaLabel = _0.ariaLabel, ariaLabelledBy = _0.ariaLabelledBy, id = _0.id, dataTestId = _0.dataTestId, triggerRef = _0.triggerRef, initialFocusRef = _0.initialFocusRef, _0_className = _0.className, className = _0_className === void 0 ? '' : _0_className, children = _0.children, props = _object_without_properties(_0, [
        "side",
        "variant",
        "open",
        "defaultOpen",
        "onOpenChange",
        "compact",
        "defaultCompact",
        "onCompactChange",
        "storageKey",
        "compactStorageKey",
        "width",
        "compactWidth",
        "closeOnEsc",
        "closeOnBackdropClick",
        "trapFocus",
        "lockScroll",
        "ariaLabel",
        "ariaLabelledBy",
        "id",
        "dataTestId",
        "triggerRef",
        "initialFocusRef",
        "className",
        "children"
    ]);
    var generatedTitleId = useId();
    var drawerRef = useRef(null);
    // Responsive breakpoint detection (standard lg: 1024px)
    var _useState = _sliced_to_array(useState(false), 2), isMobile = _useState[0], setIsMobile = _useState[1];
    useEffect(function() {
        if (typeof window === 'undefined') return;
        var media = window.matchMedia('(max-width: 1023px)');
        var handleMedia = function handleMedia(e) {
            return setIsMobile(e.matches);
        };
        setIsMobile(media.matches);
        if (media.addEventListener) {
            media.addEventListener('change', handleMedia);
            return function() {
                return media.removeEventListener('change', handleMedia);
            };
        } else if (media.addListener) {
            media.addListener(handleMedia);
            return function() {
                return media.removeListener(handleMedia);
            };
        }
    }, []);
    var isModal = variant === 'temporary' || variant === 'responsive' && isMobile;
    // Initialize unified drawer state manager
    var drawerState = useDrawerState({
        open: controlledOpen,
        defaultOpen: defaultOpen,
        onOpenChange: onOpenChange,
        compact: controlledCompact,
        defaultCompact: defaultCompact,
        onCompactChange: onCompactChange,
        storageKey: storageKey,
        compactStorageKey: compactStorageKey
    });
    var isOpen = drawerState.isOpen, isCompact = drawerState.isCompact, openDrawer = drawerState.openDrawer, closeDrawer = drawerState.closeDrawer, toggle = drawerState.toggle, toggleCompact = drawerState.toggleCompact, setOpen = drawerState.setOpen, setCompact = drawerState.setCompact;
    // WAI-ARIA Focus Trap, ESC dismissal and Scroll Lock in modal mode
    useDrawerAccessibility({
        drawerRef: drawerRef,
        open: isOpen,
        side: side,
        variant: variant,
        isTemporary: isModal,
        onClose: closeOnEsc ? closeDrawer : undefined,
        triggerRef: triggerRef,
        initialFocusRef: initialFocusRef
    });
    var targetId = id || (side === 'left' ? 'left-drawer' : 'right-drawer');
    var targetTestId = dataTestId || props['data-testid'] || (side === 'left' ? 'left-drawer' : 'right-drawer');
    var computedState = !isOpen ? 'closed' : isCompact && side === 'left' ? 'collapsed' : 'open';
    var defaultWidth = width || (side === 'right' ? 'w-80' : 'w-64');
    var titleId = ariaLabelledBy || generatedTitleId;
    // Default accessible name based on side
    var defaultLabel = side === 'left' ? 'Navegação principal' : 'Painel contextual';
    // Resolved accessible naming:
    // 1. If ariaLabelledBy is explicitly provided, bind aria-labelledby.
    // 2. Otherwise bind aria-label (custom prop or fallback defaultLabel).
    // This prevents dangling aria-labelledby pointing to unrendered generated IDs
    // and activates the previously unreachable fallback accessible name.
    var resolvedAriaLabelledBy = ariaLabelledBy || undefined;
    var resolvedAriaLabel = resolvedAriaLabelledBy ? undefined : ariaLabel || defaultLabel;
    // Layout mode positioning classes
    var positionClasses = isModal ? cn('fixed inset-y-0 z-50 shadow-2xl max-w-[85vw] transition-transform duration-300 ease-in-out', side === 'left' ? 'left-0 border-r' : 'right-0 border-l', defaultWidth, isOpen ? 'translate-x-0' : side === 'left' ? '-translate-x-full pointer-events-none invisible' : 'translate-x-full pointer-events-none invisible') : cn('relative shrink-0 h-full transition-all duration-300 ease-in-out', side === 'left' ? 'border-r' : 'border-l', !isOpen ? 'w-0 overflow-hidden opacity-0 pointer-events-none invisible border-none!' : isCompact && side === 'left' ? "".concat(compactWidth, " overflow-hidden") : defaultWidth);
    var defaultRole = isModal ? 'dialog' : side === 'left' ? 'navigation' : 'region';
    var contextValue = {
        side: side,
        variant: variant,
        isOpen: isOpen,
        open: isOpen,
        isCompact: isCompact,
        compact: isCompact,
        isModal: isModal,
        isTemporary: isModal,
        isHydrated: drawerState.isHydrated,
        drawerId: targetId,
        id: targetId,
        titleId: titleId,
        close: closeDrawer,
        closeDrawer: closeDrawer,
        openDrawer: openDrawer,
        toggle: toggle,
        toggleCompact: toggleCompact,
        setOpen: setOpen,
        setCompact: setCompact
    };
    return /*#__PURE__*/ _jsxs(DrawerContext.Provider, {
        value: contextValue,
        children: [
            isModal && isOpen && /*#__PURE__*/ _jsx("div", {
                "data-testid": "drawer-backdrop",
                "aria-hidden": "true",
                onClick: closeOnBackdropClick ? closeDrawer : undefined,
                className: "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out backdrop-blur-xs"
            }),
            /*#__PURE__*/ _jsx("aside", _object_spread_props(_object_spread({
                ref: drawerRef,
                id: targetId,
                "data-testid": targetTestId,
                "data-state": computedState,
                "data-side": side,
                "data-variant": variant,
                role: defaultRole,
                "aria-modal": isModal ? 'true' : undefined,
                "aria-label": resolvedAriaLabel,
                "aria-labelledby": resolvedAriaLabelledBy,
                inert: !isOpen ? true : undefined,
                tabIndex: isModal ? -1 : undefined,
                className: cn('flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100', 'border-gray-200 dark:border-gray-800', positionClasses, className)
            }, props), {
                children: children
            }))
        ]
    });
}
