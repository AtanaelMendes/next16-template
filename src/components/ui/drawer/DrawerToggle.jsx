import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faChevronLeft,
    faChevronRight,
    faSliders,
} from '@fortawesome/free-solid-svg-icons';
import { DrawerContext } from './useDrawer';
import { cn } from '@/lib/utils';

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
    ...props
}) {
    const context = useContext(DrawerContext);

    const effectiveSide = side || context?.side || 'left';
    const isOpen =
        propOpen !== undefined
            ? Boolean(propOpen)
            : Boolean(context?.isOpen ?? context?.open ?? false);
    const isCompact =
        propCompact !== undefined
            ? Boolean(propCompact)
            : Boolean(context?.isCompact ?? context?.compact ?? false);

    const handleToggle = propOnToggle || context?.toggle;

    const targetDrawerId =
        ariaControls || (effectiveSide === 'left' ? 'left-drawer' : 'right-drawer');
    const targetTestId =
        dataTestId ||
        props['data-testid'] ||
        (effectiveSide === 'left' ? 'left-drawer-toggle' : 'right-drawer-toggle');

    const defaultLabel =
        ariaLabel ||
        (effectiveSide === 'left'
            ? isOpen
                ? 'Recolher menu de navegação'
                : 'Abrir menu de navegação'
            : isOpen
                ? 'Fechar painel contextual'
                : 'Abrir painel contextual');

    const defaultIcon =
        effectiveSide === 'left'
            ? isOpen && !isCompact
                ? faChevronLeft
                : faBars
            : isOpen
                ? faChevronRight
                : faSliders;

    const handleKeyDown = (e) => {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            handleToggle?.();
        }
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            aria-expanded={isOpen ? 'true' : 'false'}
            aria-controls={targetDrawerId}
            aria-label={defaultLabel}
            data-testid={targetTestId}
            className={cn(
                'inline-flex items-center justify-center p-2 rounded-lg',
                'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                'dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
                'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0',
                className
            )}
            {...props}
        >
            {icon ? (
                typeof icon === 'function' ? (
                    icon({ open: isOpen, compact: isCompact })
                ) : (
                    icon
                )
            ) : (
                <FontAwesomeIcon icon={defaultIcon} className="w-4 h-4" />
            )}
            {children}
        </button>
    );
}
