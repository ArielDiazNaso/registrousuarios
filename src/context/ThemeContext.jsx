import { createContext, useState, useEffect, useCallback, useMemo } from 'react';

export const ThemeContext = createContext(null);

const THEME_KEY = 'app_theme';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

const getSystemTheme = () => {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? THEMES.DARK : THEMES.LIGHT;
};

const applyThemeClass = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(THEMES.LIGHT, THEMES.DARK);
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
};

export const ThemeProvider = ({ children, defaultTheme = null }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored && (stored === THEMES.LIGHT || stored === THEMES.DARK)) {
        return stored;
      }
    } catch (err) {
      /* ignore */
    }
    return defaultTheme || getSystemTheme();
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (err) {
      /* ignore */
    }
    setMounted(true);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e) => {
      try {
        const stored = localStorage.getItem(THEME_KEY);
        if (!stored) {
          setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
        }
      } catch (_) {
        /* ignore */
      }
    };
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  }, []);

  const setThemeExplicit = useCallback((newTheme) => {
    if (newTheme === THEMES.LIGHT || newTheme === THEMES.DARK) {
      setTheme(newTheme);
    }
  }, []);

  const resetToSystem = useCallback(() => {
    try {
      localStorage.removeItem(THEME_KEY);
    } catch (_) {
      /* ignore */
    }
    setTheme(getSystemTheme());
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === THEMES.DARK,
      isLight: theme === THEMES.LIGHT,
      mounted,
      toggleTheme,
      setTheme: setThemeExplicit,
      resetToSystem,
      THEMES,
    }),
    [theme, mounted, toggleTheme, setThemeExplicit, resetToSystem]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
