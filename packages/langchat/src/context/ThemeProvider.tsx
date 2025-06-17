import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { getThemeByMode, mergeTheme, Theme, ThemeMode } from '../theme';

interface ThemeContextProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  mode?: ThemeMode;
  theme?: Partial<Theme>;
  onModeChange?: (mode: ThemeMode) => void; // Callback for external apps
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  mode: externalMode,
  theme: themeOverrides,
  onModeChange,
}) => {
  const [internalMode, setInternalMode] = useState<ThemeMode>(externalMode || 'system');
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  // Use external mode if provided, otherwise use internal mode
  const currentMode = externalMode || internalMode;

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription?.remove();
  }, []);

  // Handle mode changes
  const handleSetMode = (newMode: ThemeMode) => {
    if (externalMode) {
      // If mode is controlled externally, notify parent
      onModeChange?.(newMode);
    } else {
      // Internal mode management
      setInternalMode(newMode);
    }
  };

  // Get current theme
  const baseTheme = getThemeByMode(currentMode, systemColorScheme);
  const finalTheme = themeOverrides ? mergeTheme(baseTheme, themeOverrides) : baseTheme;

  return (
    <ThemeContext.Provider value={{
      mode: currentMode,
      setMode: handleSetMode,
      theme: finalTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useOptionalTheme = () => {
  return useContext(ThemeContext);
};