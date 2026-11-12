import React from 'react';
import { Drawer } from './Drawer';
import { DrawerHeader } from './DrawerHeader';
import { DrawerContent } from './DrawerContent';
import { DrawerFooter } from './DrawerFooter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders } from '@fortawesome/free-solid-svg-icons';

export function RightDrawer({
    open,
    defaultOpen = false,
    onOpenChange,
    storageKey = 'dashboard:drawer:right',
    title = 'Painel Contextual',
    subtitle,
    width = 'w-80',
    variant = 'responsive',
    className = '',
    children,
    footer,
    dataTestId,
    ...props
}) {
    return (
        <Drawer
            side="right"
            variant={variant}
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={onOpenChange}
            storageKey={storageKey}
            width={width}
            dataTestId={dataTestId || props['data-testid'] || 'right-drawer'}
            id="right-drawer"
            ariaLabel="Painel contextual"
            className={className}
            {...props}
        >
            <DrawerHeader
                title={title}
                subtitle={subtitle}
                icon={
                    <FontAwesomeIcon
                        icon={faSliders}
                        className="w-4 h-4 text-gray-500 dark:text-gray-400"
                    />
                }
            />
            <DrawerContent>{children}</DrawerContent>
            {footer && <DrawerFooter>{footer}</DrawerFooter>}
        </Drawer>
    );
}
