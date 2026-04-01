'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext<'dark' | 'light'>('dark');

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Force dark mode to prevent mobile white-flash, read cookie if exists
    const stored = localStorage.getItem('hc_theme') as 'dark' | 'light';
    if (stored) setTheme(stored);
    document.documentElement.classList.add('dark'); // Haul Command OS is always dark mode primarily
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
