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
                'flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0 min-h-[56px]',
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                {icon && (
                    <span className="text-content-muted shrink-0">
                        {icon}
                    </span>
                )}
                <div className="min-w-0">
                    {title && (
                        <h2
                            id={targetTitleId}
                            className="text-base font-semibold text-content truncate leading-snug"
                        >
                            {title}
                        </h2>
                    )}
                    {subtitle && (
                        <p className="text-xs text-content-muted truncate leading-tight mt-0.5">
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
                        className="p-1.5 rounded-lg text-content-muted hover:text-content hover:bg-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                    </button>
                )}
            </div>
        </header>
    );
}
