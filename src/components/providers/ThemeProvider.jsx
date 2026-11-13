'use client';

import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'next16-template:theme';

const applyTheme = (theme) => {
  const isDark = theme === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);
  root.style.colorScheme = theme;
};

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = savedTheme === 'light' ? 'light' : 'dark';
    applyTheme(initialTheme);
    setTheme(initialTheme);
    document.documentElement.dataset.themeReady = 'true';

    const syncTheme = (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextTheme = event.newValue === 'light' ? 'light' : 'dark';
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };

    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => {
      const nextTheme = previous === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  }, []);

  const isDark = theme === 'dark';
  const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';

  return (
    <>
      {children}
      <button
        type='button'
        onClick={toggleTheme}
        data-testid='theme-toggle'
        aria-label={label}
        aria-pressed={!isDark}
        title={label}
        className='fixed bottom-4 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-content shadow-lg transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      >
        <FontAwesomeIcon
          icon={isDark ? faSun : faMoon}
          width='18'
          height='18'
          className={isDark ? 'text-warning' : 'text-primary'}
        />
      </button>
    </>
  );
}
