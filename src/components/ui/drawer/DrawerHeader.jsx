import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { DrawerContext } from './useDrawer';
import { cn } from '@/lib/utils';

export function DrawerHeader({
    title,
    subtitle,
    icon,
    showCloseButton = true,
    onClose,
    closeAriaLabel = 'Fechar painel',
    titleId: propTitleId,
    className = '',
    children,
    dataTestId,
    ...props
}) {
    const context = useContext(DrawerContext);
    const handleClose = onClose || context?.close;
    const targetTitleId =
        propTitleId || context?.titleId || `${context?.side || 'drawer'}-title`;

    return (
        <header
            data-testid={dataTestId || props['data-testid'] || 'drawer-header'}
            className={cn(
                'flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 shrink-0 min-h-[56px]',
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                {icon && (
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">
                        {icon}
                    </span>
                )}
                <div className="min-w-0">
                    {title && (
                        <h2
                            id={targetTitleId}
                            className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate leading-snug"
                        >
                            {title}
                        </h2>
                    )}
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {children}
                {showCloseButton && (
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label={closeAriaLabel}
                        title={closeAriaLabel}
                        data-testid="drawer-close-button"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                    </button>
                )}
            </div>
        </header>
    );
}
