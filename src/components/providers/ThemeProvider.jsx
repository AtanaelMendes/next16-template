'use client';

import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'next16-template:theme';

const applyTheme = (theme) => {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('light', !isDark);
  document.documentElement.style.colorScheme = theme;
};

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = savedTheme === 'light' ? 'light' : 'dark';
    applyTheme(initialTheme);
    setTheme(initialTheme);

    const syncTheme = (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextTheme = event.newValue === 'light' ? 'light' : 'dark';
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };

    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  const isDark = theme === 'dark';

  return (
    <>
      {children}
      <button
        type='button'
        onClick={toggleTheme}
        aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        className='fixed bottom-4 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-lg transition hover:scale-105 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700'
      >
        <FontAwesomeIcon icon={isDark ? faSun : faMoon} width='18' height='18' />
      </button>
    </>
  );
}
