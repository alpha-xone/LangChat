import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { getThemeByMode, Theme, ThemeMode } from '../theme';

interface AppThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  currentTheme: Theme;
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export const AppThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const getCurrentTheme = () => {
    return getThemeByMode(mode, systemColorScheme);
  };

  return (
    <AppThemeContext.Provider value={{
      mode,
      setMode,
      currentTheme: getCurrentTheme()
    }}>
      {children}
    </AppThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
};
