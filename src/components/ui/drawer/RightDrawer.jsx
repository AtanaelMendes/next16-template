'use client';

import React from 'react';
import { Drawer } from './Drawer';
import { DrawerHeader } from './DrawerHeader';
import { DrawerContent } from './DrawerContent';
import { DrawerFooter } from './DrawerFooter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders } from '@fortawesome/free-solid-svg-icons';

/**
 * Specialized Right Contextual Drawer.
 * Dedicated to notifications, quick settings, detail cards, and contextual actions.
 * Supports desktop expanded (w-80), desktop zero-width collapse (w-0),
 * and mobile temporary overlay modal.
 *
 * @param {Object} props
 * @param {boolean} [props.open]
 * @param {boolean} [props.defaultOpen=false]
 * @param {(open: boolean) => void} [props.onOpenChange]
 * @param {string} [props.storageKey='dashboard:drawer:right']
 * @param {React.ReactNode} [props.title='Painel Contextual']
 * @param {React.ReactNode} [props.subtitle]
 * @param {string} [props.width='w-80']
 * @param {'responsive'|'persistent'|'temporary'} [props.variant='responsive']
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 * @param {React.ReactNode} [props.footer]
 * @param {string} [props.dataTestId='right-drawer']
 */
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
