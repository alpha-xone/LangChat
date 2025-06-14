import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: typeof lightTheme;
}

export const lightTheme = {
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#000000',
  primary: '#007AFF',
  secondary: '#5856d6',
  accent: '#ff9500',
  error: '#ff3b30',
  success: '#34c759',
  warning: '#ffcc00',
  border: '#e5e5e5',
  placeholder: '#8e8e93',
};

export const darkTheme = {
  background: '#000000',
  surface: '#1c1c1e',
  text: '#ffffff',
  primary: '#0A84FF',
  secondary: '#5e5ce6',
  accent: '#ff9f0a',
  error: '#ff453a',
  success: '#32d74b',
  warning: '#ffd60a',
  border: '#38383a',
  placeholder: '#8e8e93',
};

const ThemeContext = createContext<ThemeContextProps>({
  mode: 'system',
  setMode: () => {},
  theme: lightTheme,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    if (mode === 'system') {
      const listener = Appearance.addChangeListener(({ colorScheme }) => {
        setColorScheme(colorScheme);
      });
      return () => listener.remove();
    }
  }, [mode]);

  const theme = mode === 'system'
    ? (colorScheme === 'dark' ? darkTheme : lightTheme)
    : (mode === 'dark' ? darkTheme : lightTheme);

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);