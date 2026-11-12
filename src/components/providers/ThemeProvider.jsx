'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function ThemeProvider() {
  const { darkMode } = useAppContext();

  useEffect(() => {    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return null;
}
