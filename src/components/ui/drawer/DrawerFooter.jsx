import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Footer action and controls bar for Drawer components.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {string} [props.dataTestId='drawer-footer']
 */
export function DrawerFooter({
    children,
    className = '',
    dataTestId,
    ...props
}) {
    return (
        <footer
            data-testid={dataTestId || props['data-testid'] || 'drawer-footer'}
            className={cn(
                'p-4 border-t border-border bg-surface-secondary/50 shrink-0',
                className
            )}
            {...props}
        >
            {children}
        </footer>
    );
}
