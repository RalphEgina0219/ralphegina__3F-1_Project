import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import {
  applyTheme,
  currentTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  systemPrefersDark,
  type Theme,
} from '@/lib/theme';

interface ThemeValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue>({
  theme: 'light',
  setTheme: () => undefined,
  toggle: () => undefined,
});

export const useTheme = () => useContext(ThemeContext);

/** Holds the mode, keeps <html data-theme> in step, and always prints in light mode. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    document.documentElement.dataset.theme
      ? currentTheme()
      : resolveTheme(readStoredTheme(), systemPrefersDark()),
  );

  useEffect(() => applyTheme(theme), [theme]);

  // Without a remembered choice, follow the device when it changes.
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return undefined;
    const onChange = () => {
      if (!readStoredTheme()) setThemeState(query.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Prints (reports, basket labels) are always light.
  useEffect(() => {
    let before: Theme | null = null;
    const start = () => {
      before = currentTheme();
      if (before === 'dark') flushSync(() => setThemeState('light'));
    };
    const end = () => {
      if (before === 'dark') setThemeState('dark');
      before = null;
    };
    window.addEventListener('beforeprint', start);
    window.addEventListener('afterprint', end);
    return () => {
      window.removeEventListener('beforeprint', start);
      window.removeEventListener('afterprint', end);
    };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    storeTheme(next);
    setThemeState(next);
  }, []);
  const toggle = useCallback(() => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
