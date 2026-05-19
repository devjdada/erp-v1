import { useThemeContext } from '@/context/ThemeContext';

export function useTheme() {
  const { theme } = useThemeContext();
  return theme;
}
