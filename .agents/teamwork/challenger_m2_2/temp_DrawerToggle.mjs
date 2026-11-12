'use client';
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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faChevronLeft, faChevronRight, faSliders } from '@fortawesome/free-solid-svg-icons';
import { DrawerContext } from '../../../src/components/ui/drawer/useDrawer.js';
import { cn } from '../../../src/lib/utils.js';
/**
 * Permanently accessible Drawer Toggle Trigger button.
 * Remains visible, clickable, and reachable in all open/closed permutations and viewports.
 *
 * @param {Object} props
 * @param {'left'|'right'} [props.side='left']
 * @param {boolean} [props.open]
 * @param {boolean} [props.compact]
 * @param {() => void} [props.onToggle]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.ariaControls]
 * @param {string} [props.dataTestId]
 * @param {React.ReactNode|((state: { open: boolean, compact: boolean }) => React.ReactNode)} [props.icon]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */ export function DrawerToggle(_0) {
    var _0_side = _0.side, side = _0_side === void 0 ? 'left' : _0_side, propOpen = _0.open, propCompact = _0.compact, propOnToggle = _0.onToggle, ariaLabel = _0.ariaLabel, ariaControls = _0.ariaControls, dataTestId = _0.dataTestId, icon = _0.icon, _0_className = _0.className, className = _0_className === void 0 ? '' : _0_className, children = _0.children, props = _object_without_properties(_0, [
        "side",
        "open",
        "compact",
        "onToggle",
        "ariaLabel",
        "ariaControls",
        "dataTestId",
        "icon",
        "className",
        "children"
    ]);
    var _ref, _ref1, _ref2, _ref3;
    var context = useContext(DrawerContext);
    var effectiveSide = side || (context === null || context === void 0 ? void 0 : context.side) || 'left';
    var isOpen = propOpen !== undefined ? Boolean(propOpen) : Boolean((_ref = (_ref1 = context === null || context === void 0 ? void 0 : context.isOpen) !== null && _ref1 !== void 0 ? _ref1 : context === null || context === void 0 ? void 0 : context.open) !== null && _ref !== void 0 ? _ref : false);
    var isCompact = propCompact !== undefined ? Boolean(propCompact) : Boolean((_ref2 = (_ref3 = context === null || context === void 0 ? void 0 : context.isCompact) !== null && _ref3 !== void 0 ? _ref3 : context === null || context === void 0 ? void 0 : context.compact) !== null && _ref2 !== void 0 ? _ref2 : false);
    var handleToggle = propOnToggle || (context === null || context === void 0 ? void 0 : context.toggle);
    var targetDrawerId = ariaControls || (effectiveSide === 'left' ? 'left-drawer' : 'right-drawer');
    var targetTestId = dataTestId || props['data-testid'] || (effectiveSide === 'left' ? 'left-drawer-toggle' : 'right-drawer-toggle');
    var defaultLabel = ariaLabel || (effectiveSide === 'left' ? isOpen ? 'Recolher menu de navegação' : 'Abrir menu de navegação' : isOpen ? 'Fechar painel contextual' : 'Abrir painel contextual');
    var defaultIcon = effectiveSide === 'left' ? isOpen && !isCompact ? faChevronLeft : faBars : isOpen ? faChevronRight : faSliders;
    var handleKeyDown = function handleKeyDown(e) {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            handleToggle === null || handleToggle === void 0 ? void 0 : handleToggle();
        }
    };
    return /*#__PURE__*/ _jsxs("button", _object_spread_props(_object_spread({
        type: "button",
        onClick: handleToggle,
        onKeyDown: handleKeyDown,
        "aria-expanded": isOpen ? 'true' : 'false',
        "aria-controls": targetDrawerId,
        "aria-label": defaultLabel,
        "data-testid": targetTestId,
        className: cn('inline-flex items-center justify-center p-2 rounded-lg', 'text-gray-600 hover:text-gray-900 hover:bg-gray-100', 'dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800', 'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0', className)
    }, props), {
        children: [
            icon ? typeof icon === 'function' ? icon({
                open: isOpen,
                compact: isCompact
            }) : icon : /*#__PURE__*/ _jsx(FontAwesomeIcon, {
                icon: defaultIcon,
                className: "w-4 h-4"
            }),
            children
        ]
    }));
}
