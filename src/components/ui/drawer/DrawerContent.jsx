import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Primary scrollable body container for Drawer components.
 * Configured with independent vertical scroll and horizontal overflow protection.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {string} [props.dataTestId='drawer-content']
 */
export function DrawerContent({
    children,
    className = '',
    dataTestId,
    ...props
}) {
    return (
        <div
            data-testid={dataTestId || props['data-testid'] || 'drawer-content'}
            className={cn(
                'flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
