'use client';

import React from 'react';
import { Drawer } from './Drawer';
import { DrawerHeader } from './DrawerHeader';
import { DrawerContent } from './DrawerContent';
import { DrawerFooter } from './DrawerFooter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

/**
 * Specialized Left Navigation Drawer.
 * Supports desktop expanded (w-64), desktop compact icon mode (w-16),
 * and mobile temporary overlay modal.
 *
 * @param {Object} props
 * @param {boolean} [props.open]
 * @param {boolean} [props.defaultOpen=true]
 * @param {(open: boolean) => void} [props.onOpenChange]
 * @param {boolean} [props.compact]
 * @param {boolean} [props.defaultCompact=false]
 * @param {(compact: boolean) => void} [props.onCompactChange]
 * @param {string} [props.storageKey='dashboard:drawer:left']
 * @param {string} [props.compactStorageKey='dashboard:drawer:left:compact']
 * @param {Array<Object>} [props.items=[]]
 * @param {string} [props.currentPath='']
 * @param {React.ReactNode} [props.title='Navegação']
 * @param {React.ReactNode} [props.subtitle]
 * @param {'responsive'|'persistent'|'temporary'} [props.variant='responsive']
 * @param {string} [props.width]
 * @param {string} [props.compactWidth='w-16']
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 * @param {React.ReactNode} [props.footer]
 * @param {string} [props.dataTestId='left-drawer']
 */
export function LeftDrawer({
  open,
  defaultOpen = true,
  onOpenChange,
  compact,
  defaultCompact = false,
  onCompactChange,
  storageKey = 'dashboard:drawer:left',
  compactStorageKey = 'dashboard:drawer:left:compact',
  items = [],
  currentPath = '',
  title = 'Navegação',
  subtitle,
  variant = 'responsive',
  width,
  compactWidth = 'w-16',
  className = '',
  children,
  footer,
  dataTestId,
  ...props
}) {
  return (
    <Drawer
      side="left"
      variant={variant}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      compact={compact}
      defaultCompact={defaultCompact}
      onCompactChange={onCompactChange}
      storageKey={storageKey}
      compactStorageKey={compactStorageKey}
      width={width}
      compactWidth={compactWidth}
      dataTestId={dataTestId || props['data-testid'] || 'left-drawer'}
      id="left-drawer"
      ariaLabel="Navegação principal"
      className={className}
      {...props}
    >
      <DrawerHeader
        title={title}
        subtitle={subtitle}
        icon={
          <FontAwesomeIcon
            icon={faCompass}
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
          />
        }
      />
      <DrawerContent>
        {children ? (
          children
        ) : (
          <nav aria-label="Navegação principal" className="space-y-1">
            {items.map((item) => {
              const isActive =
                item.active ||
                (currentPath && currentPath.length > 0 && currentPath === item.href);

              return (
                <a
                  key={item.id || item.href || item.label}
                  href={item.href || '#'}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  {item.icon && (
                    <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
        )}
      </DrawerContent>
      {footer && <DrawerFooter>{footer}</DrawerFooter>}
    </Drawer>
  );
}
