import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Default to dark theme, but check localStorage
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('photo-library-theme');
    return (savedTheme as Theme) || 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('photo-library-theme', newTheme);
  };

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('pf-v5-theme-dark');
      root.classList.remove('pf-v5-theme-light');
    } else {
      root.classList.add('pf-v5-theme-light');
      root.classList.remove('pf-v5-theme-dark');
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
