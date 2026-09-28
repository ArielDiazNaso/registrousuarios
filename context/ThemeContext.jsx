'use client';
import { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';

export const ThemeContext = createContext(null);

const THEME_KEY = 'app_theme';
const THEMES = { LIGHT: 'light', DARK: 'dark' };

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(THEMES.DARK);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === THEMES.LIGHT || stored === THEMES.DARK) {
        setThemeState(stored);
      } else {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        setThemeState(prefersDark ? THEMES.DARK : THEMES.LIGHT);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  }, []);

  const value = useMemo(() => ({
    theme,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
    toggleTheme,
    THEMES,
  }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}

export default ThemeProvider;
