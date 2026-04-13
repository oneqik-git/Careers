'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'oq-career-theme';
const ThemeContext = createContext(null);

function resolveInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = window.localStorage.getItem(THEME_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const nextTheme = resolveInitialTheme();
    setTheme(nextTheme);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [isReady, theme]);

  const value = useMemo(() => ({
    theme,
    isReady,
    toggleTheme() {
      setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
    },
  }), [isReady, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
